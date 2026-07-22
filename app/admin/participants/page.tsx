import Shell from "@/components/Shell";
import AdminParticipants from "@/components/AdminParticipants";
import { canManageParticipantRoster, requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ParticipantDocument } from "@/lib/types";

export default async function AdminParticipantsPage() {
  const user = await requirePageUser(["ADMIN", "COORDINATOR"]);
  const db = await getDb();
  const participants = await db
    .collection<ParticipantDocument>("participants")
    .find({ active: true })
    .sort({ stakeholderGroup: 1, name: 1 })
    .toArray();

  const data = participants.map((item) => ({
    id: item._id!.toHexString(),
    stakeholderGroup: item.stakeholderGroup,
    companyId: item.companyId,
    name: item.name,
    belongsToBp: item.belongsToBp,
    country: item.country,
    topic: item.topic,
    nominatedProvider: item.nominatedProvider
  }));

  return (
    <Shell user={user}>
      <h1 className="page-title">Participant roster</h1>
      <p className="page-subtitle">
        Approved Facilities and Business Partners. Learners can only register with a Company ID from this roster.
        Administrators can add, edit, remove, or import organizations.
      </p>
      <AdminParticipants
        initialParticipants={data}
        canManage={canManageParticipantRoster(user.role)}
      />
    </Shell>
  );
}
