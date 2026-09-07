import Shell from "@/components/Shell";
import AdminSettings from "@/components/AdminSettings";
import { isFullAdmin, requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listFieldDefinitions } from "@/lib/fields";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const user = await requirePageUser(["ADMIN", "COORDINATOR"]);
  if (!isFullAdmin(user.role)) redirect("/admin");
  const db = await getDb();
  const fields = await listFieldDefinitions(db);

  return (
    <Shell user={user}>
      <h1 className="page-title">Admin settings</h1>
      <p className="page-subtitle">
        Manage roster fields, required rules, and dropdown options. These definitions drive Add organization,
        import validation, learner records, filters, and exports.
      </p>
      <AdminSettings initialFields={fields} />
    </Shell>
  );
}
