import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runnerPath = path.join(root, "node_modules", "@cloudflare", "vite-plugin", "dist", "workers", "runner-worker", "index.js");

if (!fs.existsSync(runnerPath)) {
  console.warn("Cloudflare Vite runner patch skipped: runner file was not found.");
  process.exit(0);
}

let source = fs.readFileSync(runnerPath, "utf8");
let changed = false;

const originalRunInRunnerObject = `async function runInRunnerObject(env, callback) {
	const id = nextCallbackId++;
	pendingCallbacks.set(id, callback);
	try {
		await env.__VITE_RUNNER_OBJECT__.get("singleton").executeCallback(id);
		return callbackResults.get(id);
	} finally {
		pendingCallbacks.delete(id);
		callbackResults.delete(id);
	}
}`;

const patchedRunInRunnerObject = `async function runInRunnerObject(env, callback) {
	const runnerObject = env?.__VITE_RUNNER_OBJECT__;
	if (!runnerObject || typeof runnerObject.get !== "function") {
		return await callback();
	}
	const id = nextCallbackId++;
	pendingCallbacks.set(id, callback);
	try {
		await runnerObject.get("singleton").executeCallback(id);
		return callbackResults.get(id);
	} finally {
		pendingCallbacks.delete(id);
		callbackResults.delete(id);
	}
}`;

if (source.includes(originalRunInRunnerObject)) {
  source = source.replace(originalRunInRunnerObject, patchedRunInRunnerObject);
  changed = true;
}

const originalTransportSend = `send(data) {
				env.__VITE_RUNNER_OBJECT__.get("singleton").send(environmentName, JSON.stringify(data));
			}`;

const patchedTransportSend = `send(data) {
				const runnerObject = env?.__VITE_RUNNER_OBJECT__;
				if (runnerObject && typeof runnerObject.get === "function") {
					runnerObject.get("singleton").send(environmentName, JSON.stringify(data));
				} else {
					webSocket.send(JSON.stringify(data));
				}
			}`;

if (source.includes(originalTransportSend)) {
  source = source.replace(originalTransportSend, patchedTransportSend);
  changed = true;
}

if (changed) {
  fs.writeFileSync(runnerPath, source);
  console.log("Cloudflare Vite runner patched for local development.");
} else if (source.includes("const runnerObject = env?.__VITE_RUNNER_OBJECT__;")) {
  console.log("Cloudflare Vite runner patch already applied.");
} else {
  console.warn("Cloudflare Vite runner patch did not match the installed runner version.");
}
