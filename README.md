# Otto Group Academy LMS

A runnable full-stack LMS MVP for VECTRA International and Otto Group, built with Next.js, React, TypeScript, and MongoDB. It runs directly on a Linux server without Docker.

## Included functionality

- Secure email/password authentication with HTTP-only session cookies
- Invitation and account-activation links
- Optional SMTP invitation delivery
- User creation, CSV learner import, activation, and deactivation
- Entity/company field for learners
- SCORM 1.2 ZIP upload and manifest launch detection
- SCORM resume data, lesson status, score, bookmark, suspend-data, and completion tracking
- Learner dashboard with Not Started, In Progress, and Completed states
- Course assignment, progress table, and CSV report export
- Responsive desktop/mobile interface
- Direct Azure VM deployment with Node.js, PM2, Nginx, MongoDB, and Certbot

## SCORM scope

This project provides a practical SCORM 1.2 runtime for common course packages. It is not a certified SCORM engine and does not implement SCORM 2004 sequencing and navigation. Export Mindsmith content as SCORM 1.2 when dependable resume, score, and completion tracking are required.

## Local development without Docker

Install Node.js 22+ and a local MongoDB server, then run:

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Open `http://localhost:3000` and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `.env`.

The account `dev@vectra-intl.com` (see `BOOTSTRAP_ADMIN_EMAILS`) is always created as an active ADMIN when the app starts — no manual user create is required.

## Production commands

```bash
npm ci
npm run typecheck
npm run build
npm run seed
pm2 start ecosystem.config.cjs
pm2 save
```

See `AZURE_DEPLOYMENT.md` for the complete Azure VM setup.

## Learner CSV format

Must match organizations in `sample-participants.csv` (Company ID + Stakeholder Group).

```csv
First Name,Last Name,Corporate Email,Company ID,Stakeholder Group,Facility Training
Ayesha,Khan,ayesha.khan@knittex.example,25879550,Facility,Knittex Garments Unit 1
Rahul,Mehta,rahul.mehta@adamexports.example,20010395,Business Partner,
```

For Business Partner rows, leave Facility Training empty.

## Participant roster CSV format

Use the Vectra facility participant list (organizations in scope). Example headers:

```csv
Stakeholder,ID,Name,Belongs to BP,Country,Topic,Nominated Provider
Facility,25879550,Knittex Garments Unit 1,30000009 (Knittex Garments),Pakistan,Freely Chosen Employment,Vectra
```

Import via **Admin → Participants**, or seed locally:

```bash
npm run seed:participants
```

Learners can only self-register with a Company ID + stakeholder group present on this roster.

## Invitation email

Preferred free provider: [Resend](https://resend.com) (free tier).

```bash
RESEND_API_KEY=re_xxxxxxxxx
MAIL_FROM=Otto Group Academy <onboarding@resend.dev>
```

Self-registration and admin "Create user" both email the activation link only (it is never shown in the UI).
Configure `RESEND_API_KEY` or SMTP before inviting users.

Learners can use **Forgot password** on the login page. Admins can **Resend invite** for INVITED users.

## Mindsmith / SCORM progress tracking

This LMS delivers courses as **SCORM 1.2 only**. If content is authored in Mindsmith, export a SCORM 1.2 ZIP and upload it in Admin → Courses.

- Full briefing: [`docs/Mindsmith-SCORM-Progress-Tracking.md`](docs/Mindsmith-SCORM-Progress-Tracking.md)
- Ops checklist: [`docs/Mindsmith-SCORM-Delivery-Checklist.md`](docs/Mindsmith-SCORM-Delivery-Checklist.md)
