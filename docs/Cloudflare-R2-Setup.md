# Cloudflare R2 setup (free SCORM storage for Render)

Use Cloudflare R2 so SCORM packages survive Render free-tier restarts. When `R2_*` env vars are set, the LMS stores and serves course files from R2 instead of local disk.

## 1. Create an R2 bucket (Cloudflare dashboard)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**
2. **Create bucket** — e.g. `otto-lms-courses`
3. Leave public access **off** (the LMS reads files with API credentials)

## 2. Create an API token

1. R2 → **Manage R2 API Tokens** (or Account API Tokens)
2. Create a token with **Object Read & Write** on your bucket
3. Copy:
   - **Access Key ID**
   - **Secret Access Key**
4. Note your **Account ID** (R2 overview page, right sidebar)

## 3. Set environment variables

### Local `.env`

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=otto-lms-courses
R2_PREFIX=courses
```

### Render

In the Render dashboard → your web service → **Environment**, add the same five variables, then **redeploy**.

You can leave `COURSE_STORAGE_DIR` unset on Render when R2 is configured (local disk is only the fallback).

## 4. Verify

```bash
curl https://YOUR-APP.onrender.com/api/health
```

Expect:

```json
{
  "status": "ok",
  "storageBackend": "r2",
  "storageOk": true,
  "storageDetail": "r2://otto-lms-courses/courses"
}
```

## 5. Re-upload SCORM packages

Courses created before R2 was configured still point at missing local files. In **Admin → Courses**, upload (or replace) each SCORM ZIP again.

## How it works

| Without R2 | With R2 |
|------------|---------|
| Files under `COURSE_STORAGE_DIR` | Files under `r2://BUCKET/PREFIX/courseId/...` |
| Lost on Render free restart | Persists on Cloudflare |

The LMS still serves content through `/api/scorm/.../content/...` (same-origin, auth-checked). Browsers never talk to R2 directly.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `storageBackend: "local"` | All four of `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` must be set |
| `storageOk: false` | Token permissions, account ID, bucket name |
| Upload succeeds, launch 404 | Re-upload ZIP after enabling R2 |
| Upload timeout | Large ZIP — raise `MAX_SCORM_UPLOAD_MB` and Render request limits if needed |
