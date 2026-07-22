# Mindsmith vs SCORM — Progress Tracking Briefing

**Product:** Otto Group Academy LMS  
**Audience:** VECTRA International / Otto Group stakeholders  
**Purpose:** Clarify how course progress %, score, and completion are tracked when content is authored in Mindsmith

---

## 1. Executive summary

To track **real progress percentage**, **score**, and **completion** inside the Otto Group Academy LMS, Mindsmith content must be delivered as a **SCORM 1.2 package (ZIP)**, not as a Mindsmith published web link.

| Delivery method | Suitable for operational reporting? |
|-----------------|-------------------------------------|
| Mindsmith published URL | No — open/start only |
| Mindsmith SCORM 1.2 export | Yes — status, score, completion |

**Recommendation:** Author in Mindsmith if needed; deliver into the LMS **only** via **SCORM 1.2 export**. The LMS does not support Mindsmith published links.

---

## 2. Option A — Mindsmith published link

The LMS embeds the published Mindsmith URL in an iframe (or opens it in a new tab).

### What works

- Learner can open and take the course
- LMS can mark the assignment as **In progress** when opened (~10%)

### What does not work

| Capability | Supported? |
|------------|------------|
| Progress % while learning (e.g. 25%, 50%, 75%) | No |
| Score | No |
| Automatic **Completed** when the learner finishes | No |
| Resume / bookmark from last position in LMS | No |

### Why

Mindsmith’s hosted page does not send SCORM (or equivalent) progress data back to the LMS. The LMS only knows that the learner opened the link.

**Use case:** Preview / informal viewing only — not for compliance or completion reporting.

---

## 3. Option B — Mindsmith exported as SCORM 1.2 (recommended)

Mindsmith exports a SCORM 1.2 ZIP. An administrator uploads that ZIP in **Admin → Courses**. Learners launch the package inside the LMS SCORM player.

### What works

| Capability | Supported? |
|------------|------------|
| Open course in LMS | Yes |
| **Not started / In progress / Completed** status | Yes |
| Score (when the package reports it) | Yes |
| Completion when learner finishes or passes | Yes |
| Resume / bookmark (SCORM lesson location / suspend data) | Yes |
| Fine-grained mid-course % (25 / 50 / 75) | Only if the SCORM package reports usable progress or score values |

### Delivery steps (content / ops)

1. In **Mindsmith**: Export / Download as **SCORM 1.2** (ZIP).
2. In **LMS Admin → Courses**: Upload the SCORM ZIP.
3. Assign the course to learners (or rely on auto-assign rules where configured).
4. Export progress reports from **Admin → Reports** as training completes.

---

## 4. How the LMS maps SCORM progress today

| Learner state | Typical progress shown in LMS |
|---------------|-------------------------------|
| Not opened | **0%** |
| Started / in progress | **~10%** (until completion) |
| Completed or passed | **100%** |

### What this means for reporting

- Reliable for **started vs completed**
- Reliable for **score** when Mindsmith’s SCORM export includes score
- Mid-course percentages (25% / 50% / 75%) appear only when the package reports additional SCORM data and the LMS is configured to map it

This is sufficient for most training completion and audit needs (who started, who finished, score if applicable).

---

## 5. Recommendation for Otto / VECTRA

1. Use **Mindsmith** to author the Freely Chosen Employment (or other) course.
2. Deliver the course into Otto Group Academy as **SCORM 1.2**, not as a published URL.
3. Use LMS dashboards and **CSV report export** for training evidence.
4. Mindsmith published links are **not supported** in this LMS.

---

## 6. FAQ

**Q: Can we track progress % with only a Mindsmith link?**  
A: No. The LMS cannot read percent from inside Mindsmith’s iframe.

**Q: Do we need to rebuild the course outside Mindsmith?**  
A: No. Keep authoring in Mindsmith; export SCORM 1.2 for LMS delivery.

**Q: Will learners still see the same Mindsmith look and feel?**  
A: Yes — SCORM packages contain the Mindsmith course content, launched inside the LMS player.

**Q: Is SCORM 2004 required?**  
A: No. This LMS implements **SCORM 1.2**, which is the format Mindsmith should export for this project.

**Q: What if we only have a published link today?**  
A: Learners can still take the course, but admin reports will not show true completion or score until a SCORM package is uploaded and assigned.

---

## 7. Related LMS docs

- `README.md` — product overview and local setup  
- `REQUIREMENTS_MAPPING.md` — workflow / requirements mapping  
- Admin UI note: “SCORM export is preferred for progress tracking”

---

*Document version: 1.0 — Otto Group Academy LMS*
