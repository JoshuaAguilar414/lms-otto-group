import Shell from "@/components/Shell";
import AdminSettings from "@/components/AdminSettings";
import { isFullAdmin, requireStaffPage } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listFieldDefinitions } from "@/lib/fields";
import { listRoles } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const user = await requireStaffPage("settings");
  if (!isFullAdmin(user) && !user.permissions.manageSettings) redirect("/admin");
  const db = await getDb();
  const [fields, roles] = await Promise.all([
    listFieldDefinitions(db),
    listRoles(db)
  ]);

  return (
    <Shell user={user}>
      <h1 className="page-title">Admin settings</h1>
      <p className="page-subtitle">
        Manage roster fields and user groups. Field definitions drive Add organization, import validation,
        learner records, filters, and exports. User groups control which pages each role can open.
      </p>
      <AdminSettings initialFields={fields} initialRoles={roles} canManageRoles={isFullAdmin(user)} />
    </Shell>
  );
}
