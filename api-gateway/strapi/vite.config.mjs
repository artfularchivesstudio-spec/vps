// 🌟 The Cosmic Vite Configuration - Development Mode Magic
import { mergeConfig } from 'vite';

export default (config) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      host: '0.0.0.0',
      port: 1337,
      strictPort: false,
      allowedHosts: true, // 🔮 Allow all hosts to prevent blocking issues
      hmr: {
        host: 'api-router.cloud'
      }
    },
    preview: {
      host: '0.0.0.0',
      port: 1337
    }
  });
};
