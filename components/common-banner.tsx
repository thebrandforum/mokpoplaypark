// components/common-banner.tsx
'use client'
import { useState, useEffect } from 'react'

interface CommonBannerProps {
  title?: string
  subtitle?: string
  className?: string
}

export default function CommonBanner({ title, subtitle, className = '' }: CommonBannerProps) {
  const [bannerImage, setBannerImage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // 설정에서 배너 이미지 불러오기
  useEffect(() => {
    const loadBannerSettings = async () => {
      try {
        console.log('🔍 배너 설정 로드 시작...')
        // API 경로 수정: /api/settings → /api/admin/settings
        const response = await fetch('/api/admin/settings')
        const result = await response.json()
        
        console.log('📡 전체 API 응답:', result)
        console.log('🗂️ banner_settings:', result.data?.banner_settings)
        console.log('🖼️ commonBanner:', result.data?.banner_settings?.commonBanner)
        
        if (result.success && result.data?.banner_settings?.commonBanner) {
          console.log('✅ 이미지 설정 성공:', result.data.banner_settings.commonBanner)
          setBannerImage(result.data.banner_settings.commonBanner)
        } else {
          console.log('❌ 이미지 설정 실패 - 조건 불만족')
        }
      } catch (error) {
        console.error('❌ API 호출 에러:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBannerSettings()
  }, [])

  return (
    <section 
      className={`h-64 sm:h-80 lg:h-96 bg-gray-300 relative flex items-center justify-center ${className}`}
      style={bannerImage ? {
        backgroundImage: `url("${bannerImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        imageRendering: '-webkit-optimize-contrast',
        WebkitImageRendering: '-webkit-optimize-contrast',
        msImageRendering: '-ms-interpolation-mode: bicubic',
        imageOptimization: 'optimizeQuality',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden'
      } as React.CSSProperties : {}}
    >
		  
      {/* 중앙 제목 */}
      {title && (
        <div className="relative text-center px-4">
          <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white text-sm sm:text-base lg:text-lg mt-2 drop-shadow-lg">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* 오른쪽 아래 MOKPO PLAYPARK */}
      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8">
        <h2 className="text-white text-sm sm:text-2xl lg:text-4xl font-black tracking-widest opacity-80 drop-shadow-lg">
          MOKPO PLAYPARK
        </h2>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </section>
  )
}