# Render deployment — SCORM course storage

## Why SCORM returns 404 after upload

Course **metadata** is stored in MongoDB. SCORM **ZIP files** must live in durable storage.

On Render’s **free** plan the local filesystem is **ephemeral**, so local/`/tmp` uploads disappear after restart.

## Recommended free fix: Cloudflare R2

1. Follow [`docs/Cloudflare-R2-Setup.md`](Cloudflare-R2-Setup.md)
2. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` on Render
3. Redeploy and confirm `/api/health` shows `"storageBackend": "r2"`
4. Re-upload each SCORM ZIP

## Paid alternative: Render persistent disk

If you prefer local disk instead of R2:

1. Upgrade to Starter+
2. Attach a disk mounted at `/var/data`
3. Set `COURSE_STORAGE_DIR=/var/data/otto-lms-courses`
4. Do **not** set `R2_*` (R2 takes priority when configured)
5. Re-upload SCORM packages

## Verify

```bash
curl https://YOUR-APP.onrender.com/api/health
```
