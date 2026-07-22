# Azure VM deployment without Docker

This deployment runs Next.js directly with PM2, MongoDB as a Linux service, Nginx as the reverse proxy, and Certbot for HTTPS.

## 1. Create the Azure VM

Recommended pilot configuration:

- Ubuntu Server 24.04 LTS
- Standard B2s or larger
- 64 GB or larger Premium SSD
- Static public IP
- Port 22 restricted to administrator IPs
- Ports 80 and 443 open to the internet

## 2. Install Node.js, PM2, Nginx, Git, and Certbot

Connect over SSH, then install Node.js 22 using your approved NodeSource, nvm, or enterprise package-management method. Confirm `node --version` reports version 22 or newer.

```bash
sudo apt update
sudo apt install -y nginx git certbot python3-certbot-nginx
sudo npm install -g pm2
```

## 3. Install MongoDB

Install MongoDB Community Edition using MongoDB's official Ubuntu 24.04 apt instructions. Start and enable it:

```bash
sudo systemctl enable --now mongod
sudo systemctl status mongod
```

Keep MongoDB bound to `127.0.0.1`; do not expose port 27017 in the Azure Network Security Group.

For a stronger production setup, use MongoDB Atlas instead and place its connection string in `MONGODB_URI`.

## 4. Install the application

```bash
sudo mkdir -p /var/www/otto-lms /var/lib/otto-lms/courses
sudo chown -R "$USER":"$USER" /var/www/otto-lms /var/lib/otto-lms

git clone YOUR_REPOSITORY_URL /var/www/otto-lms
cd /var/www/otto-lms
cp .env.example .env
nano .env
```

Use production values similar to:

```env
NODE_ENV=production
APP_URL=https://academy.ottogroup.com
AUTH_SECRET=GENERATE_A_LONG_RANDOM_SECRET
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=otto_lms
COURSE_STORAGE_DIR=/var/lib/otto-lms/courses
MAX_SCORM_UPLOAD_MB=500
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

Generate the authentication secret with:

```bash
openssl rand -base64 48
```

Protect the environment file:

```bash
chmod 600 .env
```

## 5. Build, seed, and run with PM2

```bash
npm ci
npm run typecheck
npm run build
npm run seed
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

`pm2 startup` prints one additional command. Run that command with `sudo`, then run `pm2 save` again. This restores the LMS after a VM reboot.

Useful commands:

```bash
pm2 status
pm2 logs otto-lms
pm2 restart otto-lms
curl http://127.0.0.1:3000/api/health
```

## 6. Configure Nginx

```bash
sudo cp deploy/nginx-otto-lms.conf /etc/nginx/sites-available/otto-lms
sudo ln -s /etc/nginx/sites-available/otto-lms /etc/nginx/sites-enabled/otto-lms
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Change `server_name` in the Nginx file if the final hostname differs from `academy.ottogroup.com`.

## 7. Configure DNS and HTTPS

Create this DNS record after the Azure public IP is static:

- Type: `A`
- Name: `academy`
- Value: Azure VM public IP

After DNS resolves:

```bash
sudo certbot --nginx -d academy.ottogroup.com
sudo certbot renew --dry-run
```

Otto Group normally does not need to provide an SSL certificate file. Its IT team may need to authorize the certificate authority if restrictive CAA records or internal certificate policies are configured.

## 8. Deploy updates

The repository includes `deploy/update-app.sh`:

```bash
cd /var/www/otto-lms
./deploy/update-app.sh
```

It pulls the latest code, installs locked dependencies, validates TypeScript, builds the application, and reloads PM2.

## 9. Backup

At minimum, schedule backups of:

```bash
mongodump --db otto_lms --out /secure-backups/mongodb/$(date +%F)
tar -czf /secure-backups/courses-$(date +%F).tar.gz /var/lib/otto-lms/courses
```

Copy backups to Azure Blob Storage or another off-VM location. Keeping the only backup on the same VM is not sufficient.
