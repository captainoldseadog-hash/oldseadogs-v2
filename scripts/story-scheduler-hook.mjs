import process from "node:process";

const port = process.env.PORT || "3000";
const retryDelayMs = Math.max(5_000, Number(process.env.OLDSEADOGS_SCHEDULER_RETRY_MS || 15_000));
const idleDelayMs = Math.max(1_000, Number(process.env.OLDSEADOGS_SCHEDULER_IDLE_MS || 5_000));
const schedulerUrl = `http://127.0.0.1:${port}/api/editor`;
const classifiedsUrl = `http://127.0.0.1:${port}/api/boats/lifecycle`;
const schedulerFetch = globalThis.__OLDSEADOGS_SCHEDULER_FETCH__ || globalThis.fetch.bind(globalThis);
let schedulerRunning = false;
let schedulerTimer;

function scheduleNext(delayMs) {
  schedulerTimer = setTimeout(() => void runScheduler(), Math.max(250, delayMs));
  schedulerTimer.unref();
}

async function runClassifiedsLifecycle() {
  try {
    const response = await schedulerFetch(classifiedsUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "runClassifiedsLifecycle" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const message = await response.text();
      console.error(`[OldSeaDogs scheduler] Classifieds lifecycle HTTP ${response.status}: ${message.slice(0, 500)}`);
    }
  } catch (error) {
    // A boats-desk failure must not stop scheduled story publication.
    console.error("[OldSeaDogs scheduler] Classifieds lifecycle check failed", error);
  }
}

async function runScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  try {
    const response = await schedulerFetch(schedulerUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "publishScheduledStories" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const message = await response.text();
      console.error(`[OldSeaDogs scheduler] HTTP ${response.status}: ${message.slice(0, 500)}`);
      await runClassifiedsLifecycle();
      scheduleNext(retryDelayMs);
      return;
    }
    const payload = await response.json();
    const nextScheduledAt = String(payload?.result?.nextScheduledAt || "");
    const nextTime = Date.parse(nextScheduledAt);
    await runClassifiedsLifecycle();
    scheduleNext(Number.isFinite(nextTime) ? Math.min(idleDelayMs, Math.max(250, nextTime - Date.now())) : idleDelayMs);
  } catch (error) {
    // Startup and brief reload windows are expected. Later checks retry;
    // scheduler failures never terminate the serving process.
    console.error("[OldSeaDogs scheduler] Scheduled publication check failed", error);
    await runClassifiedsLifecycle();
    scheduleNext(retryDelayMs);
  } finally {
    schedulerRunning = false;
  }
}

// The hook is loaded into the Vinext production process with Node --import.
// Timers use unref so they do not change shutdown or PM2 signal behaviour.
const firstRun = setTimeout(() => void runScheduler(), 1_000);
firstRun.unref();
