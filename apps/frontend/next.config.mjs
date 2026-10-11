/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
  output: 'standalone',
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  async rewrites() {
    /* وكيل نفس الأصل: الواجهة تطلب /api/v1 و /uploads من نفس أصلها،
       فيعيد Next توجيهها داخليًا إلى الخادم. لا عنوان IP مُثبّت في المتصفح. */
    const backendApiUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001/api/v1';
    const backendOrigin = backendApiUrl.replace(/\/api\/v1\/?$/, '');
    return [
      { source: '/api/v1/:path*', destination: `${backendApiUrl}/:path*` },
      { source: '/uploads/:path*', destination: `${backendOrigin}/uploads/:path*` },
    ];
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '192.168.*' },
    ],
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
