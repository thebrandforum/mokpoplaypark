/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
  scope: '/',
  sw: 'sw.js',
})

const nextConfig = {
  // 실험적 기능들
  experimental: {
    // 필요시 추가
  },
  
  // 이미지 최적화
  images: {
    unoptimized: true, // 구름IDE 호환성을 위해
  },
  
  // Webpack 설정 - Supabase 경고 해결
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  
  // 보안 헤더 설정
  async headers() {
    return [
      // 결제 완료 페이지는 iframe에서 표시 허용
      {
        source: '/api/payment/return',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
      // 나머지 모든 페이지는 기존 보안 설정 유지
      {
        source: '/((?!api/payment/return).*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // 카메라 접근을 위한 권한 정책
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=*',
          },
        ],
      },
    ]
  },
  
  // 리다이렉트 설정
  async redirects() {
    return [
      // 필요시 리다이렉트 규칙 추가
    ]
  },
  
  // 리라이트 설정 - PHP 서버 프록시 추가
  async rewrites() {
    return [
      {
        source: '/gogo/:path*',
        destination: 'http://localhost:3001/gogo/:path*', // PHP 서버로 프록시
      },
    ]
  },
}

module.exports = withPWA(nextConfig)