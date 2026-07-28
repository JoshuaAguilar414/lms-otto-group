import Shell from "@/components/Shell";
import ProfileForm from "@/components/ProfileForm";
import { requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await requirePageUser(["LEARNER", "ADMIN", "COORDINATOR"]);
  const db = await getDb();
  const document = await db.collection<UserDocument>("users").findOne({ _id: safeObjectId(user.id)! });
  if (!document) throw new Error("User not found");

  const profile = {
    firstName: document.firstName,
    lastName: document.lastName,
    email: document.email,
    entity: document.entity,
    companyId: document.companyId,
    stakeholderGroup: document.stakeholderGroup,
    role: document.role
  };

  return (
    <Shell user={user}>
      <h1 className="page-title">My profile</h1>
      <p className="page-subtitle">
        Fix a misspelled name or update how you appear in training records without creating a new account.
      </p>
      <ProfileForm initialProfile={profile} />
    </Shell>
  );
}
