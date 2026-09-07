# Otto Group Academy LMS
## Features & Capabilities Reference

**Product:** Otto Group Academy Learning Management System  
**Audience:** VECTRA International / Otto Group stakeholders, administrators, and technical teams  
**Version:** Current MVP (as of August 2026)  
**Stack:** Next.js · React · TypeScript · MongoDB · SCORM 1.2  

---

## 1. Executive summary

Otto Group Academy LMS is a full-stack learning platform built for VECTRA International and Otto Group. It delivers SCORM 1.2 training to facility and business partner learners, tracks progress and completion, and gives administrators tools to manage rosters, users, courses, assignments, and compliance reporting.

The system supports self-registration and admin invitation flows, both gated by an approved participant roster. Content is authored externally (e.g. Mindsmith) and uploaded as SCORM 1.2 ZIP packages for reliable progress, score, and completion tracking.

---

## 2. User roles & permissions

| Role | Access level |
|------|--------------|
| **Learner** | Dashboard, assigned courses, SCORM player, profile (name), password management |
| **Coordinator** | Admin console: learners, courses, assignments, reports. Cannot manage participant roster, create staff, or remove users |
| **Admin** | Full system control including participant roster, staff accounts, user removal, and all coordinator capabilities |

### Stakeholder groups (learners)

- **Facility** — organization linked to a facility training site
- **Business Partner** — company-level participation on the VECTRA roster

Registration and invitations require a valid **Company ID** and **stakeholder group** that match an entry on the approved participant roster.

---

## 3. Authentication & account management

| Feature | Description |
|---------|-------------|
| Email/password login | Secure sign-in with HTTP-only session cookies (12-hour sessions) |
| Self-registration | Learners register with corporate email, name, Company ID, stakeholder group, and organizational name |
| Roster validation | Registration succeeds only when Company ID, stakeholder group, and organizational name match the approved roster |
| Invitation flow | Admins/coordinators create users; system sends activation email with secure link |
| Account activation | Invited users set password via activation link (7-day token expiry) |
| Forgot / reset password | Email-based password recovery |
| User statuses | **Invited**, **Active**, **Inactive** |
| Resend invitation | Resend activation email to invited users |
| Bootstrap admins | System administrator accounts auto-provisioned from environment configuration |
| Logout | Secure session termination |

### Email delivery

Supports multiple providers (environment-driven):

- Resend API
- SendGrid API
- SMTP (Nodemailer)

Used for invitations, activation, and password reset. Activation links are never displayed in the admin UI.

---

## 4. Participant roster (approved organizations)

The participant roster is the source of truth for which organizations and Company IDs may register or be invited.

| Feature | Admin | Coordinator |
|---------|-------|-------------|
| View roster | Yes | Yes (read-only) |
| Add organization | Yes | No |
| Edit organization | Yes | No |
| Remove organization | Yes | No |
| Import CSV / XLSX | Yes | No |
| Bulk remove selected | Yes | No |

### Roster fields

| Field | Description |
|-------|-------------|
| Stakeholder group | Facility or Business Partner |
| Company ID | Unique identifier used at registration |
| Organization name | Official name on the roster |
| Belongs to BP | Business partner affiliation (if applicable) |
| Country | Organization country |
| Topic | Training topic (e.g. Freely Chosen Employment) |
| Nominated provider | Training provider (VECTRA normalized to uppercase) |

### Import formats

- **CSV** — comma-separated values with header row
- **XLSX** — Excel spreadsheet (first worksheet used)

Required import headers: `Stakeholder`, `ID`, `Name`, `Belongs to BP`, `Country`, `Topic`, `Nominated Provider`.

### List features

- Search across company ID, name, country, and other fields
- Filter by stakeholder group and country
- Pagination (10 / 25 / 50 per page)
- Summary stats: total organizations, facilities, business partners

---

## 5. User management (learners & staff)

| Feature | Admin | Coordinator |
|---------|-------|-------------|
| Create & invite learner | Yes | Yes |
| Create staff (Coordinator / Admin) | Yes | No |
| Import learners (CSV / XLSX) | Yes | Yes |
| Edit user profile | Yes | Learners only |
| Activate / deactivate | Yes | Learners only |
| Resend invite | Yes | Yes (learners) |
| Remove user (single) | Yes | No |
| Bulk remove selected | Yes | No |

### Learner import formats

- **CSV** and **XLSX** supported
- Required headers: `First Name`, `Last Name`, `Corporate Email`, `Company ID`, `Stakeholder Group`, `Organizational Name`
- Company ID and stakeholder group must match the participant roster
- Invalid rows are skipped with error summary (up to 20 errors returned)

### User list features

- Search by name, email, company ID, entity, role, status
- Filter by status (Invited, Active, Inactive) and role (Learner, Coordinator, Admin)
- Pagination
- Bulk selection with checkbox (select all on current page; selection persists across pages)

### Protections

- Cannot remove your own account
- Bootstrap administrator accounts cannot be removed
- Duplicate email addresses rejected

---

## 6. Course management

| Feature | Description |
|---------|-------------|
| Upload SCORM 1.2 ZIP | Upload packaged course with title and description |
| Edit course | Update title and description |
| Replace SCORM package | Upload new ZIP to replace content on existing course |
| Remove course | Deletes course and all learner assignments for that course |
| Course types | SCORM 1.2 (primary); Mindsmith link type defined in schema |

### SCORM package handling

- ZIP extraction and manifest launch path detection
- Secure same-origin content serving via API routes
- Storage backends:
  - **Local filesystem** — development and simple deployments
  - **Cloudflare R2** — persistent storage for cloud hosts (e.g. Render) where local disk is ephemeral

### Supported SCORM capabilities

| Capability | Supported |
|------------|-----------|
| ZIP upload & manifest launch | Yes |
| Lesson status / completion | Yes |
| Score tracking | Yes |
| Bookmark / suspend data / resume | Yes |
| Progress percentage | Yes |
| SCORM 2004 sequencing | No |

**Recommendation:** Author in Mindsmith → export as **SCORM 1.2 ZIP** → upload in Admin → Courses.

---

## 7. Course assignment

| Feature | Description |
|---------|-------------|
| Single assign | Assign one course to one learner |
| Unassign | Remove a course assignment from a learner |
| Bulk assign | Assign to multiple learners by filter |
| Auto-assign on registration | When learner registers, course with matching topic title is assigned automatically |

### Bulk assign filters

- All active and invited learners
- Company ID
- Country
- Stakeholder group (Facility / Business Partner)

---

## 8. Learner experience

### Dashboard (`/dashboard`)

- Welcome overview with assigned, in-progress, and completed course counts
- Progress summary bar
- Quick link to course list

### My courses (`/dashboard/courses`)

- List of assigned courses with status badges
- Progress indicators
- Actions: **Start course**, **Continue course**, **Review course**

### SCORM player (`/learn/[assignmentId]`)

- Full in-browser SCORM 1.2 runtime
- LMS API bridge (Initialize, GetValue, SetValue, Commit, Finish)
- Automatic progress save on commit and exit
- Resume from last bookmark / suspend data
- Mindsmith postMessage progress bridge support
- Assignment status updates: Not Started → In Progress → Completed

### Profile (`/dashboard/profile`)

- Update display name (no re-registration required)
- View read-only account details (email, entity, company ID, stakeholder group, role)

### Assignment statuses

| Status | Meaning |
|--------|---------|
| Not Started | Course assigned but not yet launched |
| In Progress | Learner has started; progress saved |
| Completed | Course finished per SCORM completion rules |

---

## 9. Reporting & analytics

### Progress reports (`/admin/reports`)

| Column | Description |
|--------|-------------|
| Learner name | Full name |
| Email | Corporate email |
| Entity | Organization |
| Country | Learner country |
| Course | Course title |
| Status | Not Started / In Progress / Completed |
| Progress | Percentage |
| Score | SCORM score (when available) |
| Last activity | Timestamp of last progress save |
| Completed at | Completion timestamp |

### Report features

- Filter by status, course, and country
- Search across learner name, email, entity, course
- Pagination (25 per page default)
- **Export CSV** — downloads filtered report matching current filters and search

### Admin dashboard stats

- Approved organizations count
- Active and invited learners count
- Assignment completion rate (%)

---

## 10. Admin console screens

| Path | Purpose |
|------|---------|
| `/admin` | Administration overview and onboarding checklist |
| `/admin/participants` | Participant roster management |
| `/admin/users` | Learner and staff management |
| `/admin/courses` | SCORM upload, course edit, assignment |
| `/admin/reports` | Progress reports and CSV export |

### Public / auth screens

| Path | Purpose |
|------|---------|
| `/login` | Sign in |
| `/register` | Self-register (roster-gated) |
| `/activate` | Account activation |
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password |

---

## 11. UI & branding

- Otto Group–styled application shell (header, footer, navigation)
- OTTO Group logo in header
- Partner logo strip: bonprix, OTTO, Crate&Barrel, Witt-Gruppe
- Responsive layout with mobile navigation menu
- Otto Group website search integration in header
- Branded login, registration, and activation pages

---

## 12. Technical architecture

```
Browser  ──HTTPS──►  Nginx (reverse proxy)
                          │
                     Next.js app (PM2 / Node 22)
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
      MongoDB        Course storage     Email
   (local/Atlas)   (local or R2)    (Resend/SendGrid/SMTP)
```

### Technology stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Database | MongoDB 7 driver |
| Authentication | jose (JWT) + HTTP-only cookies + bcrypt |
| Validation | Zod |
| SCORM | Custom SCORM 1.2 runtime + adm-zip |
| Spreadsheet import | csv-parse + xlsx (SheetJS) |
| Email | Nodemailer / Resend / SendGrid |
| Process manager | PM2 |
| Node.js | 22.x |

### Data collections

- **users** — accounts, roles, statuses, invite/reset tokens
- **participants** — approved organization roster
- **courses** — SCORM course metadata and launch paths
- **assignments** — learner–course links with progress and SCORM data

### API endpoints (summary)

27 REST API routes covering:

- Authentication (login, logout, register, activate, forgot/reset password)
- User profile and admin user management (including import and bulk delete)
- Participant roster (CRUD, import, bulk delete)
- Course management and SCORM upload
- Assignments (single, bulk, unassign)
- SCORM content serving and launch
- Progress persistence
- Reports CSV export
- Facilities lookup (registration validation)
- Health check

---

## 13. Deployment options

| Environment | Notes |
|-------------|-------|
| **Azure VM** | Recommended pilot path: Ubuntu, Node 22, PM2, Nginx, Certbot, MongoDB |
| **Render / cloud** | Supported with Cloudflare R2 for SCORM storage persistence |
| **Local development** | `npm run dev`; local filesystem for course storage |

See also: `AZURE_DEPLOYMENT.md`, `docs/RENDER-SCORM-Storage.md`, `docs/Cloudflare-R2-Setup.md`.

---

## 14. Requirements coverage

| Requirement | Status |
|-------------|--------|
| Registered-user authentication | Covered |
| Learner CSV / XLSX import | Covered |
| 90+ learners (no fixed cap) | Covered |
| Learner dashboard with status | Covered |
| SCORM 1.2 delivery + resume/completion | Covered |
| Mindsmith authoring path (via SCORM export) | Covered |
| Participant roster management | Covered |
| Administration (users, courses, assignments) | Covered |
| Reporting (UI + CSV export) | Covered |
| Bulk user/participant operations | Covered |
| Responsive UI | Covered |
| Azure VM deployment | Covered |
| Invitation email (SMTP / Resend / SendGrid) | Covered |
| Role-based access (Admin / Coordinator / Learner) | Covered |

---

## 15. Known limitations

1. **SCORM 1.2 only** — not a certified SCORM engine; no SCORM 2004 sequencing
2. **Mindsmith published URLs** — suitable for preview only; not for operational progress reporting
3. **Same-VM MongoDB** — acceptable for pilot; Atlas + backups recommended for production scale
4. **Email deliverability** — production requires SPF/DKIM/DMARC configuration with Otto IT
5. **Package scanning** — no malware scan on uploaded SCORM ZIP files (recommended for untrusted uploaders)
6. **Audit trail** — no formal audit log UI yet (recommended for production compliance)

---

## 16. Recommended onboarding sequence (admin)

1. Import the VECTRA participant roster (Facilities / Business Partners + Company IDs) via CSV or XLSX
2. Upload the Freely Chosen Employment SCORM 1.2 course
3. Learners self-register with an approved Company ID, or import a learner CSV/XLSX file
4. Assign the course (auto-assigned on registration when course title matches topic)
5. Export progress reports as training completes

---

## 17. Related documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Project setup and quick start |
| `docs/Otto-LMS-Presentation.md` | Slide-style project presentation |
| `docs/Learner-Guide.md` | End-user learner instructions |
| `docs/Mindsmith-SCORM-Progress-Tracking.md` | SCORM progress integration details |
| `docs/Mindsmith-SCORM-Delivery-Checklist.md` | Content delivery checklist |
| `docs/Cloudflare-R2-Setup.md` | R2 storage configuration |
| `docs/RENDER-SCORM-Storage.md` | Render deployment storage notes |
| `AZURE_DEPLOYMENT.md` | Azure VM deployment runbook |

---

**Otto Group Academy LMS** — Built for VECTRA International and Otto Group.

*Document version: August 2026*
