import type { Db, ObjectId } from "mongodb";
import { makeInviteToken } from "@/lib/auth";
import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import { sendInvitationEmail } from "@/lib/mail";
import { findApprovedParticipant } from "@/lib/participants";
import type { AssignmentDocument, CourseDocument, StakeholderGroup, UserDocument, UserRole } from "@/lib/types";
import { splitFullName } from "@/lib/utils";

export type InviteLearnerInput = {
  email: string;
  name: string;
  companyId: string;
  stakeholderGroup: StakeholderGroup;
  facilityTraining?: string;
  role?: Extract<UserRole, "LEARNER">;
};

export type InviteStaffInput = {
  email: string;
  firstName: string;
  lastName: string;
  entity: string;
  role: Extract<UserRole, "ADMIN" | "COORDINATOR">;
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
    role: UserRole;
    status: "INVITED";
    createdAt: string;
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
  const participant = await findApprovedParticipant(db, input.companyId, input.stakeholderGroup);
  if (!participant) {
    throw new InviteError(
      "This Company ID is not on the approved VECTRA participant list for the selected stakeholder group.",
      400
    );
  }
  if (participant.name.trim().toLowerCase() !== organizationalName.toLowerCase()) {
    throw new InviteError(
      "Organizational name must match the approved organization name for this Company ID on the participant roster.",
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
    companyId: participant.companyId,
    stakeholderGroup: input.stakeholderGroup,
    belongsToBp: participant.belongsToBp,
    country: participant.country,
    topic: participant.topic,
    facilityTraining: organizationalName,
    role: "LEARNER",
    status: "INVITED",
    inviteTokenHash: invite.hash,
    inviteExpiresAt: invite.expiresAt,
    createdAt: now,
    updatedAt: now
  };

  const inserted = await db.collection<UserDocument>("users").insertOne(document);
  await autoAssignTopicCourse(db, inserted.insertedId, participant.topic, now);
  return finalizeInvite(db, document, inserted.insertedId, invite.token, participant.name);
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
  organization?: string
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
    user: {
      id: id.toHexString(),
      firstName: document.firstName,
      lastName: document.lastName,
      email: document.email,
      entity: document.entity,
      companyId: document.companyId,
      stakeholderGroup: document.stakeholderGroup,
      facilityTraining: document.facilityTraining,
      role: document.role,
      status: "INVITED",
      createdAt: document.createdAt.toISOString()
    },
    activationUrl,
    emailSent: true,
    organization
  };
}

async function autoAssignTopicCourse(db: Db, userId: ObjectId, topic: string, now: Date) {
  const course = await db.collection<CourseDocument>("courses").findOne({
    active: true,
    type: "SCORM_12",
    $or: [
      { title: { $regex: topic || "Freely Chosen Employment", $options: "i" } },
      { description: { $regex: topic || "Freely Chosen Employment", $options: "i" } }
    ]
  });
  if (!course?._id) return;
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
}

export class InviteError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
