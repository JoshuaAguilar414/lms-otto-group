import Shell from "@/components/Shell";
import AdminCourses from "@/components/AdminCourses";
import { canManageCourses, requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { CourseDocument, UserDocument } from "@/lib/types";

export default async function AdminCoursesPage() {
  const user = await requirePageUser(["ADMIN", "COORDINATOR"]);
  const db = await getDb();
  const [courses, learners] = await Promise.all([
    db.collection<CourseDocument>("courses").find({ active: true }).sort({ createdAt: -1 }).toArray(),
    db.collection<UserDocument>("users").find({ role: "LEARNER", status: { $ne: "INACTIVE" } }).sort({ lastName: 1 }).toArray()
  ]);
  return (
    <Shell user={user}>
      <h1 className="page-title">Courses and assignments</h1>
      <p className="page-subtitle">
        Upload SCORM 1.2 packages, update or remove courses, and assign training to learners.
      </p>
      <AdminCourses
        courses={courses.map((item) => ({
          id: item._id!.toHexString(),
          title: item.title,
          description: item.description,
          type: item.type
        }))}
        learners={learners.map((item) => ({
          id: item._id!.toHexString(),
          name: `${item.firstName} ${item.lastName}`,
          email: item.email,
          entity: item.entity
        }))}
        canUpload={canManageCourses(user.role)}
      />
    </Shell>
  );
}
