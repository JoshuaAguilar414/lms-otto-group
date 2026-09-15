module.exports = {
  apps: [
    {
      name: "otto-lms",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3050",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "otto-lms-reminders",
      script: "scripts/send-reminders.mjs",
      interpreter: "node",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: false,
      watch: false,
      cron_restart: "0 8 * * *",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
