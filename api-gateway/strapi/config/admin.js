/**
 * 🎭 The Admin Panel Configuration - The Digital Canvas
 * 
 * "Where creators paint their digital masterpieces"
 */

export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  url: env('PUBLIC_ADMIN_URL', '/admin'),
  serveAdminPanel: env.bool('SERVE_ADMIN_PANEL', true),
});
