module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "local",
      providerOptions: {
        sizeLimit: 250 * 1024 * 1024, // 250mb in bytes
      },
    },
  },
});
