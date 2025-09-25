// 🌟 Next.js Configuration - The Cosmic Conductor of Our Digital Symphony 🎼
/** @type {import('next').NextConfig} */

// 🎨 Parse comma-separated image domains from env variable - our visual realms' gatekeepers
const imageDomains = (process.env.NEXT_PUBLIC_IMAGE_DOMAINS || 'artfularchivestudio.local,artfularchivesstudio.com,tjkpliasdjpgunbhsiza.supabase.co,chatgpt.com,example.com')
  .split(',')
  .map(domain => domain.trim());

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    // Allow unoptimized images for data URLs and blob URLs in development
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      // WordPress content
      {
        protocol: 'http',
        hostname: 'artfularchivestudio.local',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'artfularchivesstudio.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      // Allow access to all domains in our environment variable
      ...imageDomains.map(domain => ({
        protocol: domain.startsWith('localhost') ? 'http' : 'https', // FIXED: use https for non-localhost
        hostname: domain,
        port: domain.startsWith('localhost') ? '1337' : '',
        pathname: '/**',
      })),
      // Add the app's own domain to allow loading images from the same origin
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/**',
      },
    ]
  },
  // Add content security policy to allow WordPress styles
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              style-src 'self' 'unsafe-inline' http://artfularchivestudio.local https://artfularchivesstudio.com https://fonts.googleapis.com;
              img-src 'self' http://artfularchivestudio.local https://artfularchivesstudio.com ${imageDomains.map(domain =>
                (domain.startsWith('localhost') ? `http://${domain}` : `https://${domain}`)
              ).join(' ')} data: blob: https://tjkpliasdjpgunbhsiza.supabase.co;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
};

export default nextConfig;