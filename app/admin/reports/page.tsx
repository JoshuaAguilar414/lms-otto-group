import Shell from "@/components/Shell";
import AdminReports from "@/components/AdminReports";
import { withActiveCourseStages } from "@/lib/assignments";
import { requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function ReportsPage() {
  const user = await requirePageUser(["ADMIN", "COORDINATOR"]);
  const db = await getDb();
  const rows = await db.collection("assignments").aggregate([
    ...withActiveCourseStages(),
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $sort: { "user.entity": 1, "user.lastName": 1 } }
  ]).toArray();

  return (
    <Shell user={user}>
      <AdminReports
        rows={rows.map((row: any) => ({
          id: row._id.toString(),
          learnerName: `${row.user.firstName} ${row.user.lastName}`,
          email: row.user.email,
          entity: row.user.entity,
          country: row.user.country || "",
          courseTitle: row.course.title,
          status: row.status,
          progress: row.progress,
          score: row.score,
          lastActivityAt: row.lastActivityAt ? new Date(row.lastActivityAt).toISOString() : undefined,
          completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : undefined
        }))}
      />
    </Shell>
  );
}
