import fs from "node:fs";
import path from "node:path";
import { getBootstrapAdminEmails, ensureBootstrapAdmins } from "../lib/bootstrap-admins";
import { getDb } from "../lib/db";

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

async function main() {
  loadEnv();
  const db = await getDb();
  await ensureBootstrapAdmins(db);
  for (const email of getBootstrapAdminEmails()) {
    console.log(`Administrator ready: ${email}`);
  }
  process.exit(0);
}

main().catch((error) => { console.error(error); process.exit(1); });
