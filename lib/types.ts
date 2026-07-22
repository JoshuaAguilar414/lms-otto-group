import type { ObjectId } from "mongodb";

export type UserRole = "ADMIN" | "COORDINATOR" | "LEARNER";
export type UserStatus = "INVITED" | "ACTIVE" | "INACTIVE";
export type CourseType = "SCORM_12" | "MINDSMITH_LINK";
export type AssignmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type StakeholderGroup = "Business Partner" | "Facility";

export interface UserDocument {
  _id?: ObjectId;
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
  role: UserRole;
  status: UserStatus;
  passwordHash?: string;
  inviteTokenHash?: string;
  inviteExpiresAt?: Date;
  resetTokenHash?: string;
  resetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantDocument {
  _id?: ObjectId;
  stakeholderGroup: StakeholderGroup;
  companyId: string;
  name: string;
  belongsToBp: string;
  country: string;
  topic: string;
  nominatedProvider: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseDocument {
  _id?: ObjectId;
  title: string;
  description: string;
  type: CourseType;
  active: boolean;
  externalUrl?: string;
  launchPath?: string;
  originalFilename?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScormData {
  lessonLocation?: string;
  lessonStatus?: string;
  scoreRaw?: number;
  scoreMin?: number;
  scoreMax?: number;
  progressMeasure?: number;
  interactionCount?: number;
  activitySteps?: number;
  lastProgressBumpAt?: Date;
  suspendData?: string;
  totalTime?: string;
  sessionTime?: string;
  exit?: string;
}

export interface AssignmentDocument {
  _id?: ObjectId;
  userId: ObjectId;
  courseId: ObjectId;
  status: AssignmentStatus;
  progress: number;
  score?: number;
  scormData: ScormData;
  assignedAt: Date;
  lastActivityAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  entity: string;
  role: UserRole;
}
