#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/otto-lms}"
cd "$APP_DIR"

git pull --ff-only
npm ci
npm run typecheck
npm run build
pm2 reload ecosystem.config.cjs --update-env
pm2 save
