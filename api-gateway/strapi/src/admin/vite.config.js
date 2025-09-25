// 🌟 The Strapi Admin Vite Configuration - Admin Panel Magic
const { mergeConfig } = require('vite');

module.exports = (config) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      allowedHosts: true, // 🔮 Allow all hosts to prevent blocking issues
    },
  });
};
