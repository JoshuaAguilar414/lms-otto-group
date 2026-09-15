import Shell from "@/components/Shell";
import AdminReports from "@/components/AdminReports";
import { withActiveCourseStages } from "@/lib/assignments";
import { requireStaffPage } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { loadParticipantLookup, listFieldDefinitionsForData, overlayRosterOnUser, participantLookupKey } from "@/lib/fields";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireStaffPage("reports");
  const params = await searchParams;
  const db = await getDb();
  const [assignmentRows, fields, participants] = await Promise.all([
    db.collection("assignments").aggregate([
      ...withActiveCourseStages(),
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $sort: { "user.entity": 1, "user.lastName": 1 } }
    ]).toArray(),
    listFieldDefinitionsForData(db),
    loadParticipantLookup(db)
  ]);

  const allowed = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
  const initialStatus = allowed.includes(params.status as typeof allowed[number])
    ? params.status
    : undefined;

  return (
    <Shell user={user}>
      <AdminReports
        initialStatus={initialStatus}
        fields={fields}
        rows={assignmentRows.map((row: any) => {
          const overlay = overlayRosterOnUser(row.user, participants.get(
            participantLookupKey(row.user.companyId, row.user.stakeholderGroup, row.user.entity)
          ));
          return {
            id: row._id.toString(),
            learnerName: `${overlay.firstName} ${overlay.lastName}`,
            email: overlay.email,
            entity: overlay.entity,
            companyId: overlay.companyId || "",
            stakeholderGroup: overlay.stakeholderGroup || "",
            belongsToBp: overlay.belongsToBp || "",
            country: overlay.country || "",
            topic: overlay.topic || "",
            nominatedProvider: overlay.nominatedProvider || "",
            customFields: overlay.customFields || {},
            courseTitle: row.course.title,
            status: row.status,
            progress: row.progress,
            score: row.score,
            lastActivityAt: row.lastActivityAt ? new Date(row.lastActivityAt).toISOString() : undefined,
            completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : undefined
          };
        })}
      />
    </Shell>
  );
}
