import Shell from "@/components/Shell";
import AdminUsers from "@/components/AdminUsers";
import { canCreateStaff, canRemoveUsers, requireStaffPage } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listFieldDefinitionsForData } from "@/lib/fields";
import { listAdminUsers } from "@/lib/learners";
import { listRoles } from "@/lib/roles";

export default async function AdminUsersPage() {
  const user = await requireStaffPage("users");
  const db = await getDb();
  const [users, fields, roles] = await Promise.all([
    listAdminUsers(db),
    listFieldDefinitionsForData(db),
    listRoles(db)
  ]);
  return (
    <Shell user={user}>
      <h1 className="page-title">Learners and users</h1>
      <p className="page-subtitle">
        {canCreateStaff(user)
          ? "Create learners or staff, import CSV or XLSX, and manage account status."
          : "Invite learners, import learner CSV or XLSX, and activate or deactivate learner accounts."}
      </p>
      <AdminUsers
        initialUsers={users}
        fields={fields}
        roles={roles}
        permissions={{
          canCreateStaff: canCreateStaff(user),
          canRemoveUsers: canRemoveUsers(user)
        }}
      />
    </Shell>
  );
}
