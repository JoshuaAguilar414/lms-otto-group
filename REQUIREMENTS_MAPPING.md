# Otto LMS Requirements Mapping

## Covered in this MVP

| Requirement | Implementation |
|---|---|
| Registered-user authentication | Email/password login, invitation token, activation, logout, inactive-user blocking |
| Learner spreadsheet | CSV import with first name, last name, corporate email, and entity/company |
| At least 90 learners | MongoDB-backed user model; no fixed learner limit |
| Learner dashboard | Assigned courses, status, progress, score, start/continue/review action |
| SCORM delivery | SCORM 1.2 ZIP upload, manifest detection, secure same-origin content serving |
| Resume and completion | SCORM bookmark, suspend data, lesson status, score, last activity, completion date |
| Mindsmith (authoring) | Export as SCORM 1.2 ZIP and upload to LMS (published links are not supported) |
| Administration | Users, activation/deactivation, course upload, course assignment |
| Reporting | On-screen report and CSV export |
| Responsive UI | Desktop and mobile layouts |
| Azure VM deployment | Direct Node.js deployment with PM2, local or Atlas MongoDB, Nginx reverse proxy, and Certbot HTTPS instructions |
| Optional invitations | SMTP or Resend; activation / password-reset emails required for account setup |

## Important limitations and production follow-up

1. The built-in runtime targets common SCORM 1.2 packages. It is not a certified SCORM engine and does not implement SCORM 2004 sequencing/navigation.
2. This LMS accepts **SCORM 1.2 packages only**. Author in Mindsmith if needed, then export SCORM 1.2 — published Mindsmith URLs are not supported.
3. A same-VM MongoDB service is suitable for a pilot. Production should preferably use MongoDB Atlas or a separately protected and backed-up database host.
4. Add formal audit logging, data-retention rules, privacy documentation, monitoring, automated backups, and disaster-recovery testing before a broad rollout.
5. Add antivirus/malware scanning if SCORM uploads will be accepted from untrusted administrators.
6. For Otto-originated email, complete SPF, DKIM, DMARC, and sender authorization with the Otto IT team.
7. Password reset and resend-invite are supported in-app; configure SMTP/Resend before go-live.
