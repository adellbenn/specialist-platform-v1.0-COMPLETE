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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    return [{ source: '/api/v1/:path*', destination: `${apiUrl}/:path*` }];
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
