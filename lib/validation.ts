import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(200)
});

export const activateSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(10).max(200)
    .regex(/[A-Z]/, "Use at least one uppercase letter")
    .regex(/[a-z]/, "Use at least one lowercase letter")
    .regex(/[0-9]/, "Use at least one number")
});

export const createUserSchema = z.object({
  role: z.enum(["ADMIN", "COORDINATOR", "LEARNER"]).default("LEARNER"),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  // Learner invite (same as self-registration)
  name: z.string().trim().min(2).max(200).optional(),
  companyId: z.string().trim().min(1).max(100).optional(),
  stakeholderGroup: z.enum(["Business Partner", "Facility"]).optional(),
  facilityTraining: z.string().trim().max(200).optional().default(""),
  // Staff invite
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  entity: z.string().trim().min(1).max(200).optional()
}).superRefine((data, ctx) => {
  if (data.role === "LEARNER") {
    if (!data.name) ctx.addIssue({ code: "custom", path: ["name"], message: "Enter the learner full name." });
    if (!data.companyId) ctx.addIssue({ code: "custom", path: ["companyId"], message: "Enter the Company ID." });
    if (!data.stakeholderGroup) {
      ctx.addIssue({ code: "custom", path: ["stakeholderGroup"], message: "Select the stakeholder group." });
    }
    if (!data.facilityTraining) {
      ctx.addIssue({ code: "custom", path: ["facilityTraining"], message: "Enter the organizational name." });
    }
    return;
  }
  if (!data.firstName) ctx.addIssue({ code: "custom", path: ["firstName"], message: "Enter first name." });
  if (!data.lastName) ctx.addIssue({ code: "custom", path: ["lastName"], message: "Enter last name." });
  if (!data.entity) ctx.addIssue({ code: "custom", path: ["entity"], message: "Enter entity or company." });
});

export const registerSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  name: z.string().trim().min(2).max(200),
  companyId: z.string().trim().min(1).max(100),
  stakeholderGroup: z.enum(["Business Partner", "Facility"]),
  facilityTraining: z.string().trim().max(200).optional().default("")
}).superRefine((data, ctx) => {
  if (!data.facilityTraining) {
    ctx.addIssue({
      code: "custom",
      path: ["facilityTraining"],
      message: "Enter your organizational name."
    });
  }
});

export const updateCourseSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional()
}).refine((data) => data.title !== undefined || data.description !== undefined, {
  message: "Provide at least one field to update"
});

export const participantSchema = z.object({
  stakeholderGroup: z.enum(["Business Partner", "Facility"]),
  companyId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(300),
  belongsToBp: z.string().trim().max(300).optional().default(""),
  country: z.string().trim().max(100).optional().default(""),
  topic: z.string().trim().max(200).optional().default("Freely Chosen Employment"),
  nominatedProvider: z.string().trim().max(200).optional().default("VECTRA")
});

export const assignCourseSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1)
});

export const bulkAssignSchema = z.object({
  courseId: z.string().min(1),
  userIds: z.array(z.string().min(1)).optional(),
  companyId: z.string().trim().optional(),
  country: z.string().trim().optional(),
  stakeholderGroup: z.enum(["Business Partner", "Facility"]).optional(),
  allLearners: z.boolean().optional()
}).refine(
  (data) =>
    Boolean(data.allLearners) ||
    Boolean(data.userIds?.length) ||
    Boolean(data.companyId) ||
    Boolean(data.country) ||
    Boolean(data.stakeholderGroup),
  { message: "Select learners or a filter for bulk assignment." }
);

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200)
});

export const forgotPasswordSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase())
});

export const resetPasswordSchema = activateSchema;

export const progressSchema = z.object({
  values: z.record(z.string(), z.string()).default({})
});

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  entity: z.string().trim().min(1).max(200).optional()
}).superRefine((data, ctx) => {
  const hasFullName = Boolean(data.name);
  const hasFirstLast = Boolean(data.firstName && data.lastName);
  const hasPartialFirstLast = Boolean(data.firstName || data.lastName);
  const hasEntity = Boolean(data.entity);

  if (hasPartialFirstLast && !hasFirstLast) {
    ctx.addIssue({ code: "custom", path: ["lastName"], message: "Enter both first and last name." });
    return;
  }
  if (!hasFullName && !hasFirstLast && !hasEntity) {
    ctx.addIssue({ code: "custom", path: ["name"], message: "Provide at least one field to update." });
  }
});
