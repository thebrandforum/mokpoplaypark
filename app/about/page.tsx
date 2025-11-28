'use client'

import BaseLayout from '../../components/base-layout'
import CommonBanner from '../../components/common-banner'
import { useState, useEffect } from 'react'

export default function AboutPage() {
  const [isClient, setIsClient] = useState(false)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    loadContent()
  }, [])

  // API에서 콘텐츠 로드
  const loadContent = async () => {
    try {
      const response = await fetch('/api/admin/content')
      const result = await response.json()
      
      if (result.success && result.data && result.data.about) {
        setContent(result.data.about)
      }
    } catch (error) {
      console.error('콘텐츠 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isClient || loading) {
    return (
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">페이지를 불러오는 중...</p>
          </div>
        </div>
      </BaseLayout>
    )
  }

  // 기본값 설정 (API 응답이 없을 경우)
  const aboutData = content || {
    title: '목포플레이파크',
    subtitle1: '전남 최초의 실내 모험 스포츠 테마파크',
    subtitle2: '13종의 모험스포츠 어트랙션',
    subtitle3: '남녀노소 즐기는 스릴과 넘치는 도전',
    description1: '스포츠클라이밍, 서바이벌 체험을 위한 최고의 모험 스포츠를 즐기며...',
    description2: '총 13종류의 모험스포츠 체험이 내일 아침 가능한 아드레날린 스포츠를 위한...',
    description3: '놀이 아임의 새로운 경험 스포츠 이상의 무시의! 무시의 정점을...',
    images: ['', '', '']
  }

  return (
    <BaseLayout>
      {/* 공용 배너 컴포넌트 - 그라데이션 제거, 설정에서 이미지 로드 */}
      <CommonBanner 
      />
		  
      {/* 배너와 탭메뉴 사이 여백 추가 */}
      <div className="h-6 sm:h-8 lg:h-10"></div>
	  <div className="h-6 sm:h-8 lg:h-10"></div>
		  
      {/* 탭 메뉴 - 모바일 스크롤 가능 */}
      <section className="bg-white py-4">
        <div className="text-center px-4">
          <div className="bg-white/90 px-4 sm:px-8 py-4 rounded inline-flex overflow-x-auto whitespace-nowrap">
            <a href="/about" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-2 sm:px-4 text-sm sm:text-base">
              목포 플레이파크 소개
            </a>
            <span className="text-gray-400 px-1 sm:px-2">|</span>
            <a href="/gallery" className="text-gray-600 hover:text-orange-500 px-2 sm:px-4 text-sm sm:text-base">갤러리</a>
            <span className="text-gray-400 px-1 sm:px-2">|</span>
            <a href="/location" className="text-gray-600 hover:text-orange-500 px-2 sm:px-4 text-sm sm:text-base">오시는길</a>
          </div>
        </div>
      </section>
		  
	  <div className="h-8 sm:h-10 lg:h-12"></div>


      {/* 타이틀 섹션 - 모바일 반응형 */}
      <section className="py-12 sm:py-16 lg:py-20 text-center bg-white px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-widest text-gray-900">
          {aboutData.title.toUpperCase()}
        </h1>
      </section>

      {/* 소개 카드 섹션 - 모바일 반응형 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* 카드 1 */}
          <div className="bg-gray-50 p-6 sm:p-8 lg:p-10 rounded-lg hover:shadow-lg transition-shadow">
            <div className="w-full h-40 sm:h-48 lg:h-56 mx-auto mb-6 sm:mb-8 bg-gray-50 flex items-center justify-center overflow-hidden rounded-lg">
              {aboutData.images && aboutData.images[0] ? (
                <img 
                  src={aboutData.images[0]} 
                  alt="이미지 1"
                  className="max-w-full max-h-full object-contain"
                  style={{ borderRadius: '6px' }}
                />
              ) : (
                <span className="text-gray-500 text-sm">이미지</span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 leading-relaxed text-center whitespace-pre-line">
              {aboutData.subtitle1}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed text-left whitespace-pre-line sm:px-4 lg:px-0">
              {aboutData.description1}
            </p>
          </div>

          {/* 카드 2 */}
          <div className="bg-gray-50 p-6 sm:p-8 lg:p-10 rounded-lg hover:shadow-lg transition-shadow">
            <div className="w-full h-40 sm:h-48 lg:h-56 mx-auto mb-6 sm:mb-8 bg-gray-50 flex items-center justify-center overflow-hidden rounded-lg">
              {aboutData.images && aboutData.images[1] ? (
                <img 
                  src={aboutData.images[1]} 
                  alt="이미지 2"
                  className="max-w-full max-h-full object-contain"
                  style={{ borderRadius: '6px' }}
                />
              ) : (
                <span className="text-gray-500 text-sm">이미지</span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-center whitespace-pre-line">
              {aboutData.subtitle2}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed text-left whitespace-pre-line">
              {aboutData.description2}
            </p>
          </div>

          {/* 카드 3 */}
          <div className="bg-gray-50 p-6 sm:p-8 lg:p-10 rounded-lg hover:shadow-lg transition-shadow">
            <div className="w-full h-40 sm:h-48 lg:h-56 mx-auto mb-6 sm:mb-8 bg-gray-50 flex items-center justify-center overflow-hidden rounded-lg">
              {aboutData.images && aboutData.images[2] ? (
                <img 
                  src={aboutData.images[2]} 
                  alt="이미지 3"
                  className="max-w-full max-h-full object-contain"
                  style={{ borderRadius: '6px' }}
                />
              ) : (
                <span className="text-gray-500 text-sm">이미지</span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 leading-relaxed text-center whitespace-pre-line">
              {aboutData.subtitle3}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed text-left whitespace-pre-line">
              {aboutData.description3}
            </p>
          </div>
        </div>
      </section>
    </BaseLayout>
  )
}