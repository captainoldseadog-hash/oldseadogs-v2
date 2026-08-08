#!/usr/bin/env node

const configured = (name) => Boolean(process.env[name]?.trim());
const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION?.trim() || "(not configured; runtime default v23.0)";

console.log(`INSTAGRAM_CONNECTOR_MODE configured: ${configured("INSTAGRAM_CONNECTOR_MODE") ? "yes" : "no"}`);
console.log(`INSTAGRAM_APP_ID configured: ${configured("INSTAGRAM_APP_ID") ? "yes" : "no"}`);
console.log(`INSTAGRAM_APP_SECRET configured: ${configured("INSTAGRAM_APP_SECRET") ? "yes" : "no"}`);
console.log(`INSTAGRAM_REDIRECT_URI configured: ${configured("INSTAGRAM_REDIRECT_URI") ? "yes" : "no"}`);
console.log(`INSTAGRAM_SYNC_SECRET configured: ${configured("INSTAGRAM_SYNC_SECRET") ? "yes" : "no"}`);
console.log(`INSTAGRAM_GRAPH_VERSION value: ${graphVersion}`);
