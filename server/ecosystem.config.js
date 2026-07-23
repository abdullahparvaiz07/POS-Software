module.exports = {
  apps: [
    {
      name: "pos-api",
      script: "dist/server.js",
      instances: "max", // Run as many instances as there are CPU cores
      exec_mode: "cluster", // Enables zero-downtime clustering
      autorestart: true,
      watch: false,
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      // Graceful shutdown strategy
      kill_timeout: 10000, // Wait 10 seconds before forcefully killing
      listen_timeout: 8000, // Wait 8s for app to emit 'ready'
    },
    {
      name: "pos-worker",
      script: "dist/worker.js",
      instances: 2, // Dedicated 2 instances for BullMQ background jobs
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      kill_timeout: 15000, // Give workers extra time to finish active jobs
    },
  ],
};
