'use client'

import BaseLayout from '../../components/base-layout'
import CommonBanner from '../../components/common-banner'
import { useState, useEffect } from 'react'
import { ExclamationCircleIcon, NoSymbolIcon } from '@heroicons/react/24/outline'

export default function RestrictionsPage() {
  const [isClient, setIsClient] = useState(false)
  const [restrictionsData, setRestrictionsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    loadRestrictionsData()
  }, [])

  const loadRestrictionsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/usage-info?section=restrictions')
      const result = await response.json()

      if (result.success) {
        setRestrictionsData(result.data)
      } else {
        console.error('제한사항 데이터 로드 실패:', result.message)
      }
    } catch (error) {
      console.error('제한사항 데이터 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) {
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

  if (loading) {
    return (
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">제한사항 정보를 불러오는 중...</p>
          </div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      {/* CommonBanner 적용 */}
      <CommonBanner 
      />
		  
	  <div className="h-6 sm:h-8 lg:h-10"></div>	  

      {/* 2x2 네비게이션 메뉴 - 반응형 (/restrictions 활성화) */}
      <section className="bg-white py-4">
        <div className="text-center px-4">
          <div className="bg-white/90 px-4 sm:px-8 py-4 rounded inline-flex">
            {/* 모바일: 2x2 그리드, 데스크톱: 한 줄 */}
            <div className="grid grid-cols-1 md:flex md:items-center md:space-x-2">
              {/* 모바일 첫 번째 줄 / 데스크톱 전체 */}
              <div className="flex justify-center items-center mb-2 md:mb-0">
                <a href="/usage" className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap">
                  시설이용안내
                </a>
                <span className="text-gray-400 px-2">|</span>
                <a href="/safety" className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap">
                  이용안전수칙
                </a>
                <span className="hidden md:inline text-gray-400 px-2">|</span>
              </div>
              
              {/* 모바일 두 번째 줄 / 데스크톱 이어서 */}
              <div className="flex justify-center items-center">
                <a href="/restrictions" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap">
                  이용제한 및 유의사항
                </a>
                <span className="text-gray-400 px-2">|</span>
                <a href="/pricing" className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap">
                  요금안내
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 유의사항 카드 섹션 - 모바일 반응형 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="space-y-8 sm:space-y-10">
          
          {restrictionsData?.sections?.map((section, index) => (
            <div key={section.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row">
                {/* 컬러 패널 - 모바일에서 상단으로 */}
                <div className={`text-white p-6 sm:p-8 text-center flex flex-col justify-center items-center lg:w-48 ${
                  section.title.includes('이용시 유의사항') || section.title.includes('유의사항') ? 'bg-yellow-500' :
                  section.title.includes('이용제한 안내') || section.title.includes('이용제한') ? 'bg-purple-500' : 'bg-gray-500'
                }`}>
                  {(section.title.includes('이용시 유의사항') || section.title.includes('유의사항')) && <ExclamationCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />}
                  {(section.title.includes('이용제한 안내') || section.title.includes('이용제한')) && <NoSymbolIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />}
                  
                  <div className="text-2xl sm:text-3xl font-bold mb-2">{String(index + 1).padStart(2, '0')}</div>
                  <div className="text-base sm:text-lg font-medium text-center whitespace-pre-line">{section.title}</div>
                </div>

                {/* 콘텐츠 영역 */}
                <div className="flex-1 p-6 sm:p-8">
                  {Array.isArray(section.content) && (
                    <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start">
                          <span className={`text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0 ${
                            section.title.includes('이용시 유의사항') || section.title.includes('유의사항') ? 'bg-yellow-500' :
                            section.title.includes('이용제한 안내') || section.title.includes('이용제한') ? 'bg-purple-500' : 'bg-gray-500'
                          }`}>
                            {itemIndex + 1}
                          </span>
                          <span className="whitespace-pre-line">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 데이터가 없을 때 */}
          {(!restrictionsData?.sections || restrictionsData.sections.length === 0) && (
            <div className="text-center py-12 sm:py-20">
              <p className="text-gray-500 text-base sm:text-lg">제한사항 정보가 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </BaseLayout>
  )
}