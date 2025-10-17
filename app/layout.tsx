import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '목포 플레이파크',
  description: '목포플레이파크 입장권 온라인 예약 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* PWA 설정 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* PWA 아이콘 설정 */}
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* iOS Safari PWA 설정 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QR 스캐너" />
        
        {/* Android Chrome PWA 설정 */}
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 보안 및 성능 최적화 */}
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* 카메라 권한을 위한 설정 */}
        <meta httpEquiv="Permissions-Policy" content="camera=*, microphone=*, geolocation=*" />
      </head>
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  )
}