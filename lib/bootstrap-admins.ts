import bcrypt from "bcryptjs";
import type { Db } from "mongodb";
import type { UserDocument } from "@/lib/types";
import { normalizeEmail } from "@/lib/utils";

declare global {
  // eslint-disable-next-line no-var
  var __bootstrapAdminsReady: Promise<void> | undefined;
}

/** Always-admin accounts (no manual create required). */
export function getBootstrapAdminEmails(): string[] {
  const fromEnv = (process.env.BOOTSTRAP_ADMIN_EMAILS || "dev@vectra-intl.com")
    .split(",")
    .map((value) => normalizeEmail(value.trim()))
    .filter(Boolean);
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "");
  const emails = new Set(fromEnv);
  if (adminEmail) emails.add(adminEmail);
  return [...emails];
}

export function isBootstrapAdminEmail(email: string): boolean {
  return getBootstrapAdminEmails().includes(normalizeEmail(email));
}

export async function ensureBootstrapAdmins(db: Db): Promise<void> {
  if (!global.__bootstrapAdminsReady) {
    global.__bootstrapAdminsReady = upsertBootstrapAdmins(db);
  }
  await global.__bootstrapAdminsReady;
}

async function upsertBootstrapAdmins(db: Db): Promise<void> {
  const password = process.env.ADMIN_PASSWORD || "ChangeMeNow123!";
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must contain at least 10 characters for bootstrap admins");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const firstName = process.env.ADMIN_FIRST_NAME || "VECTRA";
  const lastName = process.env.ADMIN_LAST_NAME || "Administrator";

  for (const email of getBootstrapAdminEmails()) {
    const existing = await db.collection<UserDocument>("users").findOne({ email });
    if (existing?._id) {
      await db.collection<UserDocument>("users").updateOne(
        { _id: existing._id },
        {
          $set: {
            role: "ADMIN",
            status: "ACTIVE",
            updatedAt: now,
            ...(!existing.passwordHash ? { passwordHash } : {})
          },
          $unset: { inviteTokenHash: "", inviteExpiresAt: "" }
        }
      );
      continue;
    }

    await db.collection<UserDocument>("users").insertOne({
      firstName,
      lastName,
      email,
      entity: "VECTRA International",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
      createdAt: now,
      updatedAt: now
    });
  }
}
