// 🎭 Debug Login Plugin - Main Entry Point
// "The mystical portal for development convenience"

import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import DebugLoginButton from './components/DebugLoginButton';

const name = pluginPkg.strapi.name;

export default {
  register(app) {
    // 🌟 Register our debug login component
    app.addComponents([
      {
        name: 'DebugLoginButton',
        Component: DebugLoginButton,
      }
    ]);

    // 🎯 Only show in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Debug Login Plugin: Development mode detected');
      
      // 🔮 Add debug login functionality to the login page
      app.addSettingsLink('global', {
        intlLabel: {
          id: `${pluginId}.plugin.name`,
          defaultMessage: 'Debug Login',
        },
        to: `/settings/${pluginId}`,
        Component: async () => {
          const component = await import('./pages/DebugLogin');
          return component;
        },
        permissions: [],
      });
    }

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });
  },

  bootstrap(app) {
    // 🌙 Bootstrap magic happens here
  },

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
