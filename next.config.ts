import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Add provider press-kit / CDN hosts here once image licensing is in place.
    remotePatterns: [],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Affiliate redirects must never be indexed or cached by shared caches.
      { source: '/go/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'private, no-store' }] },
    ];
  },
  async redirects() {
    return [
      // Common legacy/alias patterns -> canonical structure
      { source: '/slot/:provider/:slot', destination: '/slots/:provider/:slot', permanent: true },
      { source: '/provider/:provider', destination: '/providers/:provider', permanent: true },
      { source: '/category/:slug', destination: '/best/:slug', permanent: true },
    ];
  },
};

export default nextConfig;
