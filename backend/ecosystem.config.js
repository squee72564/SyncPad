export default {
  apps: [{
    name: "syncpad",
    script: "./dist/server.js",
    instances: 2,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    },
    // PM2 handles log rotation
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    max_memory_restart: "500M"
  }]
};
