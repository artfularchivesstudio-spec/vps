/**
 * 🎭 The Middleware Configuration - The Digital Orchestra
 * 
 * "Where every request dances through the symphony of processing"
 */

export default [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: '256mb', // Increase form limit
      jsonLimit: '256mb', // Increase JSON limit
      textLimit: '256mb', // Increase text limit
      formidable: {
        maxFileSize: 250 * 1024 * 1024, // multipart data, such as file uploads
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
