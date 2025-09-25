/**
 * 🎭 The Server Configuration - The Digital Theater's Foundation
 * 
 * "Where the magic begins and all requests find their destiny"
 */

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // 🌟 Allow external hosts in development mode
  url: env('PUBLIC_URL', 'https://api-router.cloud'),
  admin: {
    url: env('PUBLIC_ADMIN_URL', '/admin'),
    serveAdminPanel: env.bool('SERVE_ADMIN_PANEL', true),
  },
});
