export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  listingId?: string;
};

export type MailResult = {
  mode: "dry-run" | "smtp";
  id: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  secure: boolean;
};

type MailSink = (message: MailMessage & { mode: MailResult["mode"] }) => Promise<void> | void;

let testSink: MailSink | null = null;

export function setClassifiedsMailSinkForTests(sink: MailSink | null) {
  testSink = sink;
}

function env() {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env || {};
}

export function classifiedsMailMode(): MailResult["mode"] {
  return env().OLDSEADOGS_SMTP_HOST?.trim() ? "smtp" : "dry-run";
}

export function smtpConfig(): SmtpConfig | null {
  const host = env().OLDSEADOGS_SMTP_HOST?.trim() || "";
  if (!host) return null;
  const port = Number(env().OLDSEADOGS_SMTP_PORT || 587);
  const secure = env().OLDSEADOGS_SMTP_SECURE === "true" || port === 465;
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    user: env().OLDSEADOGS_SMTP_USER?.trim() || "",
    password: env().OLDSEADOGS_SMTP_PASSWORD || "",
    from: env().OLDSEADOGS_SMTP_FROM?.trim() || "",
    secure,
  };
}

export async function sendClassifiedsMail(message: MailMessage): Promise<MailResult> {
  const mode = classifiedsMailMode();
  if (mode === "smtp") {
    const config = smtpConfig();
    if (!config?.from) {
      throw new Error("OLDSEADOGS_SMTP_FROM is required when OLDSEADOGS_SMTP_HOST is set.");
    }
    await sendSmtp(config, message);
  }
  await appendMailLog({ ...message, mode });
  if (testSink) await testSink({ ...message, mode });
  return { mode, id: `${mode}-${Date.now()}` };
}

export async function classifiedsMailLogPath() {
  const { classifiedsDataDir } = await import("./classifieds-store.ts");
  const path = await import(/* @vite-ignore */ "node:path") as { join(...parts: string[]): string };
  return path.join(await classifiedsDataDir(), "classifieds-mail.log");
}

export async function classifiedsLifecycleLogPath() {
  const { classifiedsDataDir } = await import("./classifieds-store.ts");
  const path = await import(/* @vite-ignore */ "node:path") as { join(...parts: string[]): string };
  return path.join(await classifiedsDataDir(), "classifieds-lifecycle.log");
}

export async function appendLifecycleLog(entry: Record<string, string | number | boolean | null>) {
  const fs = await nodeFs();
  const path = await import(/* @vite-ignore */ "node:path") as { dirname(value: string): string };
  const filePath = await classifiedsLifecycleLogPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, { encoding: "utf8", mode: 0o600 });
}

export async function redactMailLog(listingId: string) {
  const fs = await nodeFs();
  const filePath = await classifiedsMailLogPath();
  let text = "";
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return;
    throw error;
  }
  const kept = text.split("\n").filter((line) => {
    if (!line.trim()) return false;
    try {
      return (JSON.parse(line) as { listingId?: string }).listingId !== listingId;
    } catch {
      return true;
    }
  });
  await fs.writeFile(filePath, kept.length ? `${kept.join("\n")}\n` : "", { encoding: "utf8", mode: 0o600 });
}

async function appendMailLog(message: MailMessage & { mode: MailResult["mode"]; listingId?: string }) {
  const fs = await nodeFs();
  const path = await import(/* @vite-ignore */ "node:path") as { dirname(value: string): string };
  const filePath = await classifiedsMailLogPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const entry = {
    at: new Date().toISOString(),
    mode: message.mode,
    to: message.to,
    subject: message.subject,
    replyTo: message.replyTo || "",
    listingId: message.listingId || "",
    text: message.text,
  };
  await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, { encoding: "utf8", mode: 0o600 });
  console.info("[OldSeaDogs classifieds mail]", {
    mode: message.mode,
    to: message.mode === "dry-run" ? message.to : "redacted",
    subject: message.subject,
  });
}

async function sendSmtp(config: SmtpConfig, message: MailMessage) {
  const net = await import(/* @vite-ignore */ "node:net");
  const tls = await import(/* @vite-ignore */ "node:tls");
  const socket = config.secure
    ? tls.connect({ host: config.host, port: config.port, servername: config.host })
    : net.connect({ host: config.host, port: config.port });
  const session = createSmtpSession(socket);
  try {
    await session.read();
    let greeting = await session.command(`EHLO oldseadogs.com`);
    if (!config.secure && /^250[\s-]/.test(greeting) && /STARTTLS/im.test(greeting)) {
      await session.command("STARTTLS");
      const secureSocket = tls.connect({ socket, servername: config.host });
      session.replace(secureSocket);
      greeting = await session.command("EHLO oldseadogs.com");
    }
    if (!/^250[\s-]/.test(greeting)) throw new Error("SMTP server refused EHLO.");
    if (config.user) {
      await session.command("AUTH LOGIN");
      await session.command(Buffer.from(config.user).toString("base64"));
      const auth = await session.command(Buffer.from(config.password).toString("base64"));
      if (!auth.startsWith("235")) throw new Error("SMTP authentication failed.");
    }
    const from = config.from.match(/<([^>]+)>/)?.[1] || config.from;
    await session.command(`MAIL FROM:<${from}>`);
    const recipient = await session.command(`RCPT TO:<${message.to}>`);
    if (!recipient.startsWith("250")) throw new Error("SMTP recipient was refused.");
    await session.command("DATA");
    const data = await session.command(`${smtpData(config.from, message)}\r\n.`);
    if (!data.startsWith("250")) throw new Error("SMTP message was refused.");
    await session.command("QUIT");
  } finally {
    session.close();
  }
}

function smtpData(from: string, message: MailMessage) {
  const headers = [
    `From: ${from}`,
    `To: ${message.to}`,
    message.replyTo ? `Reply-To: ${message.replyTo}` : "",
    `Subject: ${message.subject.replace(/[\r\n]+/g, " ")}`,
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=oldseadogs-boats",
  ].filter(Boolean);
  return [
    ...headers,
    "",
    "--oldseadogs-boats",
    "Content-Type: text/plain; charset=utf-8",
    "",
    message.text.replace(/\n/g, "\r\n"),
    "--oldseadogs-boats",
    "Content-Type: text/html; charset=utf-8",
    "",
    message.html.replace(/\n/g, "\r\n"),
    "--oldseadogs-boats--",
  ].join("\r\n");
}

function createSmtpSession(initial: NodeSocket) {
  let socket = initial;
  let buffer = "";
  const queued: string[] = [];
  const waiters: Array<(line: string) => void> = [];
  const onData = (chunk: Buffer | string) => {
    buffer += chunk.toString();
    while (true) {
      const match = buffer.match(/(?:^|\n)(\d{3}) [^\n]*\n/);
      if (!match || match.index === undefined) break;
      const end = match.index + match[0].length;
      const message = buffer.slice(0, end);
      buffer = buffer.slice(end);
      const waiter = waiters.shift();
      if (waiter) waiter(message);
      else queued.push(message);
    }
  };
  socket.on("data", onData);
  return {
    replace(next: NodeSocket) {
      socket.off("data", onData);
      socket = next;
      socket.on("data", onData);
    },
    read() {
      const queuedMessage = queued.shift();
      if (queuedMessage) return Promise.resolve(queuedMessage);
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("SMTP server timed out.")), 15_000);
        waiters.push((value) => {
          clearTimeout(timer);
          resolve(value);
        });
      });
    },
    async command(line: string) {
      socket.write(`${line}\r\n`);
      return this.read();
    },
    close() {
      socket.end();
    },
  };
}

type NodeSocket = {
  on(event: "data", listener: (chunk: Buffer | string) => void): void;
  off(event: "data", listener: (chunk: Buffer | string) => void): void;
  write(value: string): void;
  end(): void;
};

async function nodeFs() {
  return import(/* @vite-ignore */ "node:fs/promises") as Promise<{
    appendFile(path: string, data: string, options: { encoding: "utf8"; mode: number }): Promise<void>;
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
    writeFile(path: string, data: string, options: { encoding: "utf8"; mode: number }): Promise<void>;
  }>;
}
