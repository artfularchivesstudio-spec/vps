/**
 * 🌟 The Strapi PM2 Ecosystem Configuration - Production Magic
 *
 * "In the cosmic dance of digital infrastructure, PM2 orchestrates the symphony of Node.js processes"
 *
 * - The Spellbinding Museum Director of Production Systems
 */

module.exports = {
  apps: [
    {
      name: 'strapi',
      script: 'npm',
      args: 'start',
      cwd: '/root/api-gateway/strapi',
      env: {
        NODE_ENV: 'production',
        DATABASE_CLIENT: 'sqlite',
        DATABASE_FILENAME: '.tmp/data.db'
      },
      // 🌟 Production-ready settings
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // 🎭 Mystical logging
      log_file: '/var/log/pm2/strapi.log',
      out_file: '/var/log/pm2/strapi-out.log',
      error_file: '/var/log/pm2/strapi-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 🔮 Restart policies
      min_uptime: '10s',
      max_restarts: 10,
      // ✨ Health check
      health_check: {
        enabled: true,
        interval: '30s',
        timeout: '10s',
        retries: 3,
        grace_period: '30s'
      }
    }
  ]
};

