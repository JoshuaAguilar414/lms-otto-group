"use client";

import { FormEvent, useCallback, useState } from "react";
import ListControls from "@/components/ListControls";
import { useFilteredPagination } from "@/lib/useFilteredPagination";

interface Course {
  id: string;
  title: string;
  description: string;
  type: string;
}

interface Learner {
  id: string;
  name: string;
  email: string;
  entity: string;
}

export default function AdminCourses({
  courses: initialCourses,
  learners,
  canUpload
}: {
  courses: Course[];
  learners: Learner[];
  canUpload: boolean;
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getSearchValues = useCallback(
    (item: Course) => [item.title, item.description, item.type],
    []
  );
  const list = useFilteredPagination(courses, getSearchValues, { initialPageSize: 10 });
  const editing = courses.find((item) => item.id === editingId) || null;
  const scormCourses = courses.filter((item) => item.type === "SCORM_12");

  async function uploadScorm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/courses/scorm", { method: "POST", body: new FormData(formElement) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "SCORM upload failed");
    setCourses((current) => [data.course, ...current]);
    setMessage("SCORM course uploaded successfully.");
    formElement.reset();
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Assignment failed");
    setMessage(data.alreadyAssigned ? "This learner already has the course." : "Course assigned successfully.");
  }

  async function unassign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/assignments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unassign failed");
    setMessage("Course unassigned from learner.");
  }

  async function bulkAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      courseId: String(form.get("courseId") || "")
    };
    const companyId = String(form.get("companyId") || "").trim();
    const country = String(form.get("country") || "").trim();
    const stakeholderGroup = String(form.get("stakeholderGroup") || "").trim();
    const allLearners = form.get("allLearners") === "on";
    if (companyId) payload.companyId = companyId;
    if (country) payload.country = country;
    if (stakeholderGroup) payload.stakeholderGroup = stakeholderGroup;
    if (allLearners) payload.allLearners = true;
    const response = await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Bulk assignment failed");
    setMessage(`Bulk assign complete: ${data.assigned} new, ${data.alreadyAssigned} already assigned (${data.matchedLearners} learners matched).`);
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const file = form.get("file");

    if (file instanceof File && file.size > 0) {
      const body = new FormData();
      body.set("title", title);
      body.set("description", description);
      body.set("file", file);
      const response = await fetch(`/api/admin/courses/${editing.id}/scorm`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "SCORM package update failed");
      setCourses((current) => current.map((item) => (item.id === editing.id ? { ...item, ...data.course } : item)));
      setMessage("SCORM package replaced successfully.");
      setEditingId(null);
      return;
    }

    const response = await fetch(`/api/admin/courses/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Course update failed");
    setCourses((current) => current.map((item) => (item.id === editing.id ? { ...item, ...data.course } : item)));
    setMessage("Course updated successfully.");
    setEditingId(null);
  }

  async function removeCourse(course: Course) {
    if (!window.confirm(`Remove “${course.title}”? This also removes all learner assignments for this course.`)) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Course removal failed");
    setCourses((current) => current.filter((item) => item.id !== course.id));
    if (editingId === course.id) setEditingId(null);
    setMessage("Course removed.");
  }

  return (
    <div className="grid">
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      {canUpload ? (
        <div className="grid two">
          <form className="card" onSubmit={uploadScorm}>
            <h2>Upload SCORM 1.2</h2>
            <p className="helper">
              Export from Mindsmith (or another tool) as SCORM 1.2 ZIP, then upload here for progress tracking.
              On Render free, set Cloudflare R2 env vars (<code>R2_*</code>) so packages persist across restarts.
            </p>
            <div className="field"><label>Course title</label><input className="input" name="title" required /></div>
            <div className="field"><label>Description</label><textarea className="textarea" name="description" /></div>
            <div className="field"><label>SCORM ZIP package</label><input className="input" type="file" name="file" accept=".zip,application/zip" required /></div>
            <button className="btn">Upload course</button>
          </form>
          <form className="card" onSubmit={assign}>
            <h2>Assign a course</h2>
            <div className="field">
              <label>Learner</label>
              <select className="select" name="userId" required defaultValue="">
                <option value="" disabled>Select learner</option>
                {learners.map((item) => (
                  <option value={item.id} key={item.id}>{item.name} — {item.entity}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Course</label>
              <select className="select" name="courseId" required defaultValue="">
                <option value="" disabled>Select course</option>
                {scormCourses.map((item) => (
                  <option value={item.id} key={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
            <button className="btn">Assign course</button>
          </form>
        </div>
      ) : null}

      {canUpload ? (
        <div className="grid two">
          <form className="card" onSubmit={bulkAssign}>
            <h2>Bulk assign</h2>
            <p className="helper">Assign one course to many learners by filter. Leave filters empty and check “All learners” to assign everyone.</p>
            <div className="field">
              <label>Course</label>
              <select className="select" name="courseId" required defaultValue="">
                <option value="" disabled>Select course</option>
                {scormCourses.map((item) => (
                  <option value={item.id} key={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
            <div className="field"><label>Company ID (optional)</label><input className="input" name="companyId" /></div>
            <div className="field"><label>Country (optional)</label><input className="input" name="country" /></div>
            <div className="field">
              <label>Stakeholder group (optional)</label>
              <select className="select" name="stakeholderGroup" defaultValue="">
                <option value="">Any</option>
                <option value="Facility">Facility</option>
                <option value="Business Partner">Business Partner</option>
              </select>
            </div>
            <label className="helper" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
              <input type="checkbox" name="allLearners" /> Assign to all active/invited learners
            </label>
            <button className="btn">Run bulk assign</button>
          </form>
          <form className="card" onSubmit={unassign}>
            <h2>Unassign a course</h2>
            <p className="helper">Remove a course assignment from one learner (progress for that assignment is deleted).</p>
            <div className="field">
              <label>Learner</label>
              <select className="select" name="userId" required defaultValue="">
                <option value="" disabled>Select learner</option>
                {learners.map((item) => (
                  <option value={item.id} key={item.id}>{item.name} — {item.entity}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Course</label>
              <select className="select" name="courseId" required defaultValue="">
                <option value="" disabled>Select course</option>
                {scormCourses.map((item) => (
                  <option value={item.id} key={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
            <button className="btn secondary">Unassign course</button>
          </form>
        </div>
      ) : null}

      {canUpload && editing && (
        <form className="card" onSubmit={saveCourse} key={editing.id}>
          <h2>Edit SCORM course</h2>
          <p className="helper">Update title/description, or choose a new ZIP to replace the package.</p>
          <div className="field">
            <label>Course title</label>
            <input className="input" name="title" defaultValue={editing.title} required />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="textarea" name="description" defaultValue={editing.description} />
          </div>
          <div className="field">
            <label>Replace SCORM ZIP (optional)</label>
            <input className="input" type="file" name="file" accept=".zip,application/zip" />
          </div>
          <div className="actions">
            <button className="btn" type="submit">Save changes</button>
            <button className="btn secondary" type="button" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </form>
      )}

      <ListControls
        query={list.query}
        onQueryChange={list.setQuery}
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        searchPlaceholder="Search courses by title, description, or type…"
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Type</th>
              <th>Description</th>
              {canUpload && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.pageItems.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.title}</strong></td>
                <td><span className="badge">{item.type}</span></td>
                <td>{item.description || "—"}</td>
                {canUpload && (
                  <td>
                    <div className="actions">
                      {item.type === "SCORM_12" ? (
                        <button className="btn secondary small" type="button" onClick={() => setEditingId(item.id)}>Edit</button>
                      ) : (
                        <span className="helper">Link courses unsupported — remove</span>
                      )}
                      <button className="btn danger small" type="button" onClick={() => void removeCourse(item)}>Remove</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!list.pageItems.length && (
              <tr>
                <td colSpan={canUpload ? 4 : 3}>
                  {courses.length ? "No courses match this search." : "No published courses yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
