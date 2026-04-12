module.exports = {
  apps: [
    {
      name: "vlu-backend",
      cwd: "./backend",
      script: "src/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        // Điền các cấu hình kết nối Database thật ở Debian vào file backend/.env trên host
      }
    },
    {
      name: "vlu-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run preview -- --port 3000 --host",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
