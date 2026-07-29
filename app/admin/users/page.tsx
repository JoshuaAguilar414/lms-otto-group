import Shell from "@/components/Shell";
import AdminUsers from "@/components/AdminUsers";
import { canCreateStaff, canRemoveUsers, requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserDocument } from "@/lib/types";

export default async function AdminUsersPage() {
  const user = await requirePageUser(["ADMIN", "COORDINATOR"]);
  const db = await getDb();
  const users = await db.collection<UserDocument>("users").find({}).sort({ createdAt: -1 }).toArray();
  const data = users.map((item) => ({
    id: item._id!.toHexString(),
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    entity: item.entity,
    companyId: item.companyId,
    stakeholderGroup: item.stakeholderGroup,
    role: item.role,
    status: item.status,
    createdAt: item.createdAt.toISOString()
  }));
  return (
    <Shell user={user}>
      <h1 className="page-title">Learners and users</h1>
      <p className="page-subtitle">
        {canCreateStaff(user.role)
          ? "Create learners or staff, import CSV or XLSX, and manage account status."
          : "Invite learners, import learner CSV or XLSX, and activate or deactivate learner accounts."}
      </p>
      <AdminUsers
        initialUsers={data}
        permissions={{
          canCreateStaff: canCreateStaff(user.role),
          canRemoveUsers: canRemoveUsers(user.role)
        }}
      />
    </Shell>
  );
}
