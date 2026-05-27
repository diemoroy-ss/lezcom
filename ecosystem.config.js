module.exports = {
  apps: [
    {
      name: "lezcom-landing",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        PORT: 3004,
        NODE_ENV: "production"
      }
    }
  ]
};
