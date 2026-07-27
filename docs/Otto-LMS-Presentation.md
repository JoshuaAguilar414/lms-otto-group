# Otto Group Academy LMS  
### Project Presentation

**Audience:** VECTRA International / Otto Group stakeholders  
**Product:** Otto Group Academy Learning Management System (MVP)  
**Stack:** Next.js · React · TypeScript · MongoDB · Azure VM  

---

## Slide 1 — Title

# Otto Group Academy LMS

A full-stack learning platform for VECTRA International and Otto Group

Deliver SCORM courses · Track progress · Report completion

---

## Slide 2 — Agenda

1. Why this platform
2. What we built
3. Who uses it
4. Core capabilities
5. SCORM & Mindsmith
6. Architecture & deployment
7. Requirements coverage
8. Demo walkthrough
9. Limitations & next steps
10. Q&A

---

## Slide 3 — The challenge

Otto Group and VECTRA need a practical way to:

- Deliver training to **facility** and **business partner** learners
- Track **progress, score, and completion** reliably
- Manage **90+ learners** via roster and CSV import
- Report status for compliance and operations
- Host on **Azure** without a heavy container setup

Authoring can happen in Mindsmith — delivery and reporting must live in an LMS.

---

## Slide 4 — The solution

**Otto Group Academy LMS** — a runnable MVP that:

| Need | How we address it |
|------|-------------------|
| Secure access | Email/password + invitation activation |
| Scale learners | MongoDB users; CSV import; no hard learner cap |
| Course delivery | SCORM 1.2 ZIP upload and in-LMS player |
| Progress | Resume, bookmark, score, completion tracking |
| Admin control | Users, participants, courses, assignments |
| Reporting | On-screen progress + CSV export |
| Hosting | Direct Azure VM (Node, PM2, Nginx, MongoDB) |

---

## Slide 5 — Who uses the system

Three roles:

| Role | Primary job |
|------|-------------|
| **Admin** | Users, participants, courses, assignments, reports |
| **Coordinator** | Administrative support (same admin console access pattern) |
| **Learner** | Register/activate, take assigned courses, resume progress |

Stakeholder groups for learners:

- **Facility** — linked to facility training site
- **Business Partner** — company-level participation

Self-registration is gated by the **participant roster** (Company ID + stakeholder group).

---

## Slide 6 — Learner journey

```
Register / Invite  →  Activate account  →  Sign in
        ↓
   Learner dashboard
        ↓
 Start / Continue / Review course (SCORM player)
        ↓
 Progress saved (status, score, bookmark)
        ↓
 Completed → visible in admin reports
```

Dashboard states: **Not Started** · **In Progress** · **Completed**

Extras: forgot/reset password · responsive desktop & mobile UI

---

## Slide 7 — Admin capabilities

| Area | What admins can do |
|------|--------------------|
| **Users** | Create, invite, activate/deactivate, CSV import, resend invite |
| **Participants** | Import/manage facility & BP roster (organizations in scope) |
| **Courses** | Upload SCORM 1.2 ZIP, set title/description, activate |
| **Assignments** | Assign courses to learners |
| **Reports** | View progress table; export CSV |

Invitation emails via **Resend** or SMTP (activation link never shown in UI).

---

## Slide 8 — SCORM delivery (critical)

Courses are delivered as **SCORM 1.2 packages only**.

| Capability | Supported |
|------------|-----------|
| ZIP upload & manifest launch detection | Yes |
| Lesson status / completion | Yes |
| Score | Yes |
| Bookmark / suspend data / resume | Yes |
| Same-origin secure content serving | Yes |
| SCORM 2004 sequencing | No |
| Mindsmith published web links | Not for operational reporting |

**Recommendation:** Author in Mindsmith if needed → **export SCORM 1.2 ZIP** → upload in Admin → Courses.

---

## Slide 9 — Mindsmith: link vs SCORM

| Delivery | Open course | Progress % | Score | Auto-complete | Resume |
|----------|-------------|------------|-------|---------------|--------|
| Mindsmith published URL | Yes | No | No | No | No |
| **Mindsmith SCORM 1.2 export** | Yes | Yes | Yes | Yes | Yes |

Use published links only for informal preview — **not** for compliance reporting.

---

## Slide 10 — Architecture

```
┌─────────────┐     HTTPS      ┌──────────────┐
│   Browser   │ ─────────────► │    Nginx     │
└─────────────┘                └──────┬───────┘
                                      │
                               ┌──────▼───────┐
                               │  Next.js app │
                               │  (PM2 / Node │
                               │     22)      │
                               └──────┬───────┘
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              MongoDB            Course files       Email
           (local or Atlas)   (SCORM storage)   (Resend/SMTP)
```

**App:** Next.js App Router + React + TypeScript  
**Auth:** HTTP-only session cookies (jose)  
**Data:** MongoDB collections for users, participants, courses, assignments  
**Deploy:** Azure Ubuntu VM — no Docker required for the pilot path

---

## Slide 11 — Azure deployment (pilot)

Recommended pilot VM:

- Ubuntu Server 24.04 LTS
- Standard B2s (or larger)
- Premium SSD, static public IP
- Ports 80/443 open; SSH restricted

Runtime stack:

- **Node.js 22** + **PM2** (process manager)
- **Nginx** reverse proxy + **Certbot** HTTPS
- **MongoDB** on localhost (or Atlas for stronger production)

See `AZURE_DEPLOYMENT.md` for the full runbook.

---

## Slide 12 — Requirements coverage

| Requirement | Status |
|-------------|--------|
| Registered-user authentication | Covered |
| Learner spreadsheet / CSV import | Covered |
| 90+ learners | Covered (no fixed limit) |
| Learner dashboard + status | Covered |
| SCORM delivery + resume/completion | Covered (SCORM 1.2) |
| Mindsmith authoring path | Covered via SCORM export |
| Administration | Covered |
| Reporting (UI + CSV) | Covered |
| Responsive UI | Covered |
| Azure VM deployment | Covered |
| Optional invitation email | Covered (SMTP / Resend) |

---

## Slide 13 — Demo script (suggested)

1. **Login** as admin → Admin home  
2. **Participants** — show roster / import concept  
3. **Users** — create or import learner; show invite/resend  
4. **Courses** — upload SCORM 1.2 ZIP  
5. **Assign** course to learner  
6. **Learner view** — dashboard states; launch SCORM player  
7. **Progress** — resume, score, completion  
8. **Reports** — on-screen table + CSV download  

Demo accounts: use seeded admin from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

---

## Slide 14 — Known limitations

1. Practical SCORM 1.2 runtime — **not** a certified SCORM engine; no SCORM 2004 sequencing  
2. **SCORM 1.2 only** — Mindsmith published URLs are not for operational tracking  
3. Same-VM MongoDB is fine for **pilot**; prefer Atlas + backups for broader rollout  
4. Before wide production: audit logging, retention/privacy docs, monitoring, DR tests  
5. Add malware scanning if untrusted admins upload packages  
6. Otto-originated email needs SPF / DKIM / DMARC with Otto IT  

---

## Slide 15 — Recommended next steps

**Near term**

- Configure production SMTP/Resend and DNS email auth  
- Finalize participant roster and learner CSV  
- Upload production SCORM packages and dry-run reporting  

**Follow-up**

- MongoDB Atlas + automated backups  
- Monitoring / health alerts  
- Formal audit trail and privacy documentation  
- Broader UAT with facility and BP cohorts  

---

## Slide 16 — Closing

# Otto Group Academy LMS

Secure learner access · SCORM 1.2 delivery · Progress & completion reporting · Azure-ready MVP

**Built for VECTRA International and Otto Group**

Questions?

---

## Appendix A — Tech stack snapshot

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Database | MongoDB 7 driver |
| Auth | jose + HTTP-only cookies + bcrypt |
| Validation | Zod |
| Email | Nodemailer / Resend |
| SCORM | Custom 1.2 runtime + ZIP (adm-zip) |
| Process | PM2 (`ecosystem.config.cjs`) |
| Node | 22.x |

---

## Appendix B — Key screens

| Path | Purpose |
|------|---------|
| `/login` | Sign in |
| `/register` | Self-register (roster-gated) |
| `/activate` | Account activation |
| `/dashboard` | Learner courses & progress |
| `/learn/[assignmentId]` | SCORM player |
| `/admin` | Admin home |
| `/admin/users` | User management |
| `/admin/participants` | Organization roster |
| `/admin/courses` | SCORM upload & courses |
| `/admin/reports` | Progress & CSV export |

---

## Appendix C — Speaker notes (1-minute pitch)

> Otto Group Academy LMS is a focused MVP for VECTRA and Otto Group. It lets administrators invite rostered learners, upload Mindsmith content as SCORM 1.2, assign courses, and report real progress, scores, and completion. Learners get a simple dashboard with resume support on desktop and mobile. The system runs on a standard Azure VM with Node, PM2, Nginx, and MongoDB—ready for a pilot without Docker complexity. For dependable reporting, content must be SCORM 1.2, not a published Mindsmith link.

---

*Document generated for project presentation use. Supporting detail: `README.md`, `REQUIREMENTS_MAPPING.md`, `AZURE_DEPLOYMENT.md`, `docs/Mindsmith-SCORM-Progress-Tracking.md`.*
