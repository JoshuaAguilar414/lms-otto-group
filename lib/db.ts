import { MongoClient, type Db } from "mongodb";
import type { AssignmentDocument, CourseDocument, ParticipantDocument, UserDocument } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __indexesReady: Promise<void> | undefined;
}

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  return uri;
}

export function getClientPromise(): Promise<MongoClient> {
  if (!global.__mongoClientPromise) {
    const client = new MongoClient(getUri(), { maxPoolSize: 20, minPoolSize: 1 });
    global.__mongoClientPromise = client.connect();
  }
  return global.__mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB || "otto_lms");
  await ensureIndexes(db);
  const { ensureBootstrapAdmins } = await import("@/lib/bootstrap-admins");
  await ensureBootstrapAdmins(db);
  return db;
}

async function ensureIndexes(db: Db): Promise<void> {
  if (!global.__indexesReady) {
    global.__indexesReady = Promise.all([
      db.collection<UserDocument>("users").createIndex({ email: 1 }, { unique: true }),
      db.collection<UserDocument>("users").createIndex({ inviteTokenHash: 1 }, { sparse: true }),
      db.collection<UserDocument>("users").createIndex({ resetTokenHash: 1 }, { sparse: true }),
      db.collection<UserDocument>("users").createIndex({ companyId: 1 }),
      db.collection<AssignmentDocument>("assignments").createIndex(
        { userId: 1, courseId: 1 },
        { unique: true }
      ),
      db.collection<AssignmentDocument>("assignments").createIndex({ courseId: 1, status: 1 }),
      db.collection<CourseDocument>("courses").createIndex({ active: 1, createdAt: -1 }),
      db.collection<ParticipantDocument>("participants").createIndex(
        { companyId: 1, name: 1, stakeholderGroup: 1 },
        { unique: true }
      ),
      db.collection<ParticipantDocument>("participants").createIndex({ companyId: 1, stakeholderGroup: 1, active: 1 }),
      db.collection<ParticipantDocument>("participants").createIndex({ active: 1, country: 1 })
    ]).then(() => undefined);
  }
  await global.__indexesReady;
}
