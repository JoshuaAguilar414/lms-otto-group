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
    }
  ]
};
