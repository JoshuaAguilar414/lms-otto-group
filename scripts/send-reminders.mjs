import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const appUrl = (process.env.APP_URL || "http://127.0.0.1:3050").replace(/\/$/, "");
const secret = process.env.CRON_SECRET || "gZKjOckoxMjPefchaELTs6BfklCUuRGjXWda86geIxzvqZFLbnkAG0P8sr71ciBX";
  
if (!secret) {
  console.error("CRON_SECRET is not set or invalid; assignment reminders were not sent.");
  process.exit(1);
}

const response = await fetch(`${appUrl}/api/cron/reminders`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` }
});
const body = await response.text();
if (!response.ok) {
  console.error(`Reminder job failed (${response.status}): ${body}`);
  process.exit(1);
}
console.log(body);
