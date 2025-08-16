/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removido output: 'export' para permitir APIs dinámicas
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Configuración para mejorar la estabilidad
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Configuración de headers para CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Configuración de webpack para ignorar warnings específicos
  webpack: (config) => {
    // Ignorar el warning de dependencia crítica de Supabase Realtime
    config.ignoreWarnings = [
      { message: /Critical dependency: the request of a dependency is an expression/ }
    ];
    return config;
  },
};

module.exports = nextConfig;
