import Shell from "@/components/Shell";
import AdminUsers from "@/components/AdminUsers";
import { canCreateStaff, canRemoveUsers, requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listFieldDefinitionsForData } from "@/lib/fields";
import { listAdminUsers } from "@/lib/learners";

export default async function AdminUsersPage() {
  const user = await requirePageUser(["ADMIN", "COORDINATOR"]);
  const db = await getDb();
  const [users, fields] = await Promise.all([
    listAdminUsers(db),
    listFieldDefinitionsForData(db)
  ]);
  return (
    <Shell user={user}>
      <h1 className="page-title">Learners and users</h1>
      <p className="page-subtitle">
        {canCreateStaff(user.role)
          ? "Create learners or staff, import CSV or XLSX, and manage account status."
          : "Invite learners, import learner CSV or XLSX, and activate or deactivate learner accounts."}
      </p>
      <AdminUsers
        initialUsers={users}
        fields={fields}
        permissions={{
          canCreateStaff: canCreateStaff(user.role),
          canRemoveUsers: canRemoveUsers(user.role)
        }}
      />
    </Shell>
  );
}
