/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/images/:type/:id',
        destination: '/api/data-dragon?type=:type&id=:id',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ddragon.leagueoflegends.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.communitydragon.org',
        pathname: '/**',
      }
    ],
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /@supabase\/realtime-js/, message: /Critical dependency/ },
    ];
    return config;
  },
}

module.exports = nextConfig