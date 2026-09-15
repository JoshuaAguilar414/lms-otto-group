import type { Db, ObjectId } from "mongodb";
import { withActiveCourseStages } from "@/lib/assignments";
import { makeInviteToken } from "@/lib/auth";
import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import { sendInvitationEmail } from "@/lib/mail";
import { findApprovedParticipant } from "@/lib/participants";
import { loadParticipantLookup, overlayRosterOnUser, participantLookupKey, rosterFieldsForUser } from "@/lib/fields";
import type { AssignmentDocument, CourseDocument, StakeholderGroup, UserDocument, UserRole, UserStatus } from "@/lib/types";
import { splitFullName } from "@/lib/utils";

export type InviteLearnerInput = {
  email: string;
  name: string;
  companyId: string;
  stakeholderGroup: StakeholderGroup;
  facilityTraining?: string;
  role?: "LEARNER";
};

export type InviteStaffInput = {
  email: string;
  firstName: string;
  lastName: string;
  entity: string;
  role: UserRole;
};

export type InviteResult = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    entity: string;
    companyId?: string;
    stakeholderGroup?: StakeholderGroup;
    facilityTraining?: string;
    belongsToBp?: string;
    country?: string;
    topic?: string;
    nominatedProvider?: string;
    customFields?: Record<string, string>;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    assignedCourses: Array<{ title: string; status: string }>;
  };
  activationUrl: string;
  emailSent: boolean;
  organization?: string;
};

export async function inviteLearner(db: Db, input: InviteLearnerInput): Promise<InviteResult> {
  const email = input.email.trim().toLowerCase();
  if (isBootstrapAdminEmail(email)) {
    throw new InviteError("This email is reserved for a system administrator account.", 400);
  }
  const { firstName, lastName } = splitFullName(input.name);
  const organizationalName = input.facilityTraining?.trim();
  if (!organizationalName) {
    throw new InviteError("Enter your organizational name.", 400);
  }
  const participant = await findApprovedParticipant(db, input.companyId, input.stakeholderGroup, organizationalName);
  if (!participant) {
    const anyForId = await findApprovedParticipant(db, input.companyId, input.stakeholderGroup);
    throw new InviteError(
      anyForId
        ? "Organizational name must match the approved organization name for this Company ID on the participant roster."
        : "This Company ID is not on the approved VECTRA participant list for the selected stakeholder group.",
      400
    );
  }
  if (await db.collection<UserDocument>("users").findOne({ email })) {
    throw new InviteError("An account with this email already exists.", 409);
  }

  const invite = makeInviteToken();
  const now = new Date();
  const document: UserDocument = {
    firstName,
    lastName,
    email,
    entity: participant.name,
    ...rosterFieldsForUser(participant),
    facilityTraining: organizationalName,
    role: "LEARNER",
    status: "INVITED",
    inviteTokenHash: invite.hash,
    inviteExpiresAt: invite.expiresAt,
    createdAt: now,
    updatedAt: now
  };

  const inserted = await db.collection<UserDocument>("users").insertOne(document);
  const assignedCourses = await autoAssignTopicCourse(db, inserted.insertedId, participant.topic, now);
  return finalizeInvite(db, document, inserted.insertedId, invite.token, participant.name, assignedCourses);
}

export async function inviteStaff(db: Db, input: InviteStaffInput): Promise<InviteResult> {
  const email = input.email.trim().toLowerCase();
  if (isBootstrapAdminEmail(email)) {
    throw new InviteError("This email is reserved for a system administrator account.", 400);
  }
  if (await db.collection<UserDocument>("users").findOne({ email })) {
    throw new InviteError("An account with this email already exists.", 409);
  }
  const invite = makeInviteToken();
  const now = new Date();
  const document: UserDocument = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    entity: input.entity.trim(),
    role: input.role,
    status: "INVITED",
    inviteTokenHash: invite.hash,
    inviteExpiresAt: invite.expiresAt,
    createdAt: now,
    updatedAt: now
  };
  const inserted = await db.collection<UserDocument>("users").insertOne(document);
  return finalizeInvite(db, document, inserted.insertedId, invite.token);
}

async function finalizeInvite(
  db: Db,
  document: UserDocument,
  id: ObjectId,
  token: string,
  organization?: string,
  assignedCourses: AssignedCourseView[] = []
): Promise<InviteResult> {
  const activationUrl = `${process.env.APP_URL || "http://localhost:3000"}/activate?token=${encodeURIComponent(token)}`;
  try {
    const emailSent = await sendInvitationEmail({
      to: document.email,
      learnerName: document.firstName,
      activationUrl
    });
    if (!emailSent) {
      throw new Error("Email provider is not configured (set RESEND_API_KEY or SMTP_HOST)");
    }
  } catch (error) {
    console.error("Invitation email failed", error);
    await db.collection<AssignmentDocument>("assignments").deleteMany({ userId: id });
    await db.collection<UserDocument>("users").deleteOne({ _id: id });
    const detail = error instanceof Error ? error.message : "Unknown email error";
    throw new InviteError(`Activation email could not be sent: ${detail}`, 503);
  }

  return {
    user: toUserView(document, id, assignedCourses),
    activationUrl,
    emailSent: true,
    organization
  };
}

async function autoAssignTopicCourse(db: Db, userId: ObjectId, topic: string, now: Date): Promise<AssignedCourseView[]> {
  const course = await db.collection<CourseDocument>("courses").findOne({
    active: true,
    type: "SCORM_12",
    $or: [
      { title: { $regex: topic || "Freely Chosen Employment", $options: "i" } },
      { description: { $regex: topic || "Freely Chosen Employment", $options: "i" } }
    ]
  });
  if (!course?._id) return [];
  await db.collection<AssignmentDocument>("assignments").updateOne(
    { userId, courseId: course._id },
    {
      $setOnInsert: {
        userId,
        courseId: course._id,
        status: "NOT_STARTED",
        progress: 0,
        scormData: {},
        assignedAt: now,
        updatedAt: now
      }
    },
    { upsert: true }
  );
  return [{ title: course.title, status: "NOT_STARTED" }];
}

export class InviteError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type UserView = Omit<InviteResult["user"], "status"> & { status: UserDocument["status"] };

export type AssignedCourseView = { title: string; status: string };

export type UpdateUserProfileInput = {
  name?: string;
  firstName?: string;
  lastName?: string;
  entity?: string;
};

export async function listAdminUsers(db: Db): Promise<UserView[]> {
  const [users, assignmentRows, participants] = await Promise.all([
    db.collection<UserDocument>("users").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("assignments").aggregate([
      ...withActiveCourseStages(),
      { $project: { userId: 1, title: "$course.title", status: 1 } }
    ]).toArray(),
    loadParticipantLookup(db)
  ]);

  const coursesByUser = new Map<string, AssignedCourseView[]>();
  for (const row of assignmentRows as Array<{ userId: ObjectId; title: string; status: string }>) {
    const key = row.userId.toHexString();
    const list = coursesByUser.get(key) || [];
    list.push({ title: row.title, status: row.status });
    coursesByUser.set(key, list);
  }

  return users
    .filter((user) => user._id)
    .map((user) => {
      const participant = participants.get(participantLookupKey(user.companyId, user.stakeholderGroup, user.entity));
      return toUserView(overlayRosterOnUser(user, participant), user._id!, coursesByUser.get(user._id!.toHexString()) || []);
    });
}

function toUserView(document: UserDocument, id: ObjectId, assignedCourses: AssignedCourseView[] = []): UserView {
  return {
    id: id.toHexString(),
    firstName: document.firstName,
    lastName: document.lastName,
    email: document.email,
    entity: document.entity,
    companyId: document.companyId,
    stakeholderGroup: document.stakeholderGroup,
    facilityTraining: document.facilityTraining,
    belongsToBp: document.belongsToBp,
    country: document.country,
    topic: document.topic,
    nominatedProvider: document.nominatedProvider,
    customFields: document.customFields || {},
    role: document.role,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    assignedCourses
  };
}

function resolveProfileNames(input: UpdateUserProfileInput): { firstName: string; lastName: string } | null {
  if (input.name) return splitFullName(input.name);
  if (input.firstName && input.lastName) {
    return { firstName: input.firstName.trim(), lastName: input.lastName.trim() };
  }
  return null;
}

export async function updateUserProfile(
  db: Db,
  userId: ObjectId,
  input: UpdateUserProfileInput
): Promise<UserView> {
  const user = await db.collection<UserDocument>("users").findOne({ _id: userId });
  if (!user) throw new InviteError("User not found", 404);

  const names = resolveProfileNames(input);
  const updates: Partial<UserDocument> = { updatedAt: new Date() };

  if (names) {
    updates.firstName = names.firstName;
    updates.lastName = names.lastName;
  }
  if (input.entity !== undefined) {
    if (user.role === "LEARNER") {
      throw new InviteError("Learner organization details are tied to the participant roster and cannot be changed here.", 400);
    }
    updates.entity = input.entity.trim();
  }
  if (Object.keys(updates).length === 1) {
    throw new InviteError("Provide at least one field to update.", 400);
  }

  await db.collection<UserDocument>("users").updateOne({ _id: userId }, { $set: updates });
  const updated = await db.collection<UserDocument>("users").findOne({ _id: userId });
  return toUserView(updated!, userId);
}
