// 🎭 Webpack Configuration - The Build Orchestrator
// "Where development magic meets build optimization"

const path = require('path');

module.exports = (config, webpack) => {
  // 🌟 Add our debug login enhancement
  if (process.env.NODE_ENV === 'development') {
    console.log('🐛 Webpack: Adding development debug enhancements');
    
    // 🔮 Add alias for our extensions
    config.resolve.alias = {
      ...config.resolve.alias,
      '@debug': path.resolve(__dirname, 'extensions'),
    };
  }

  return config;
};
