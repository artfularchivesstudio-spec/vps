/**
 * 🎭 The Database Configuration - Where Digital Wisdom Resides
 * 
 * "The foundation where all our content finds its eternal home"
 */

export default ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: env('DATABASE_FILENAME', '.tmp/data.db'),
    },
    useNullAsDefault: true,
  },
});
