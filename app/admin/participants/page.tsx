import Shell from "@/components/Shell";
import AdminParticipants from "@/components/AdminParticipants";
import { canManageParticipantRoster, requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listFieldDefinitionsForData, toParticipantView } from "@/lib/fields";
import type { ParticipantDocument } from "@/lib/types";

export default async function AdminParticipantsPage() {
  const user = await requirePageUser(["ADMIN", "COORDINATOR"]);
  const db = await getDb();
  const [participants, fields] = await Promise.all([
    db.collection<ParticipantDocument>("participants").find({ active: true }).sort({ stakeholderGroup: 1, name: 1 }).toArray(),
    listFieldDefinitionsForData(db)
  ]);

  return (
    <Shell user={user}>
      <h1 className="page-title">Participant roster</h1>
      <p className="page-subtitle">
        Approved Facilities and Business Partners. Learners can only register with a Company ID from this roster.
        Administrators can add, edit, remove, or import organizations. Field definitions are managed in Settings.
      </p>
      <AdminParticipants
        initialParticipants={participants.filter((item) => item._id).map(toParticipantView)}
        fields={fields}
        canManage={canManageParticipantRoster(user.role)}
      />
    </Shell>
  );
}
