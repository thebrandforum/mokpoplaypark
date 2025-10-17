'use client'

import BaseLayout from '../../../components/base-layout'
import CommonBanner from '../../../components/common-banner'
import { useEffect, useState } from 'react'

export default function ExtremeFacilityPage() {
  const [isClient, setIsClient] = useState(false)
  const [facilityData, setFacilityData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    loadFacilityData()
  }, [])

  const loadFacilityData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/facility?section=extreme')
      const result = await response.json()

      if (result.success) {
        setFacilityData(result.data)
      } else {
        console.error('시설 데이터 로드 실패:', result.message)
        // 기본값 설정
        setFacilityData({
          title: '익스트림코스',
          subtitle: '짜릿한 익사이팅 어트랙션에서 극한의 즐거움을 느낄 수 있는 익스트림코스',
          items: []
        })
      }
    } catch (error) {
      console.error('시설 데이터 로드 중 오류:', error)
      // 기본값 설정
      setFacilityData({
        title: '익스트림코스',
        subtitle: '짜릿한 익사이팅 어트랙션에서 극한의 즐거움을 느낄 수 있는 익스트림코스',
        items: []
      })
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
            <p className="text-gray-600">시설 정보를 불러오는 중...</p>
          </div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      {/* CommonBanner 적용 */}
      <CommonBanner />
      
      <div className="h-6 sm:h-8 lg:h-10"></div>      

      {/* 메인 콘텐츠 섹션 - 모바일 반응형 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 pt-8 sm:pt-12">
        {/* 어트랙션 구성|편의시설 탭 - 왼쪽 위 */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex overflow-x-auto whitespace-nowrap">
            <a href="/facility" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-2 sm:px-4 font-medium text-sm sm:text-base">
              어트랙션 구성
            </a>
            <span className="text-gray-400 px-1 sm:px-2">|</span>
            <a href="/facility/amenities" className="text-gray-600 hover:text-orange-500 px-2 sm:px-4 font-medium text-sm sm:text-base">편의시설</a>
          </div>
        </div>
          
        <div className="h-6 sm:h-8 lg:h-10"></div>  

        {/* 이지코스|어드벤처코스|익스트림코스 탭 - 정렬 개선 */}
        <div className="max-w-5xl mx-auto mb-6 sm:mb-8">
          <div className="text-center md:text-left">
            <div className="inline-flex space-x-4 sm:space-x-8 overflow-x-auto whitespace-nowrap">
              <a href="/facility" className="text-gray-600 hover:text-orange-500 px-2 font-medium text-sm sm:text-base">
                이지코스
              </a>
              <a href="/facility/adventure" className="text-gray-600 hover:text-orange-500 px-2 font-medium text-sm sm:text-base">어드벤처코스</a>
              <a href="/facility/extreme" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-2 font-medium text-sm sm:text-base">익스트림코스</a>
            </div>
          </div>
        </div>
          
        <div className="h-6 sm:h-8 lg:h-10"></div>
        <div className="h-6 sm:h-8 lg:h-10"></div>  

        {/* 상단 설명 - 컨테이너 너비 통일 */}
        <div className="max-w-5xl mx-auto mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl md:text-lg lg:text-2xl font-bold text-gray-900 mb-4 text-center md:text-left">
            {facilityData?.subtitle || '짜릿한 익사이팅 어트랙션에서 극한의 즐거움을 느낄 수 있는 익스트림코스'}
          </h2>
        </div>

        {/* 시설 목록 - 모바일 반응형 */}
        <div className="max-w-5xl mx-auto">
          <div className="space-y-12 sm:space-y-16">
            {facilityData?.items?.map((item, index) => (
              <div key={item.id || index}>
                {/* 반응형 그리드 - 모바일 1열, 태블릿/데스크톱 2열 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
                  {/* 이미지 영역 */}
                  <div className="flex items-center justify-center">
                    <div className="w-full h-56 sm:h-64 md:h-52 lg:h-72 bg-white rounded-md flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="max-w-full max-h-full object-contain"
                          style={{ borderRadius: '6px' }}
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <p className="text-base md:text-lg lg:text-xl font-medium">{item.name}</p>
                          <p className="text-sm mt-2">이미지 준비 중</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 정보 및 버튼 영역 */}
                  <div className="space-y-4 md:space-y-3 lg:space-y-5 px-8 sm:px-10 md:px-0">
                    <div className="space-y-3 text-gray-700">
                      <h4 className="text-xl sm:text-2xl md:text-lg lg:text-2xl font-bold text-gray-900">{item.name}</h4>
                      <div className="text-base sm:text-lg md:text-sm lg:text-lg font-medium whitespace-pre-line">
                        {item.description}
                      </div>
                      
                      {item.requirements && item.requirements.length > 0 && (
                        <div className="space-y-1.5 md:space-y-1 lg:space-y-2 text-xs sm:text-sm md:text-xs lg:text-sm">
                          {item.requirements.map((req, reqIndex) => (
                            <p key={reqIndex}>{req}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 시설이 없을 때 메시지 */}
        {(!facilityData?.items || facilityData.items.length === 0) && (
          <div className="text-center py-12 sm:py-20">
            <p className="text-gray-500 text-base sm:text-lg">등록된 시설이 없습니다.</p>
          </div>
        )}

        {/* 이용권 구매 + 이용안내 버튼 - 페이지 맨 아래 추가 */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <a href="/reservation" className="inline-block bg-orange-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-orange-600 transition text-base sm:text-lg">
              이용권 구매
            </a>
            <a href="/usage" className="inline-block bg-blue-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-600 transition text-base sm:text-lg">
              이용안내
            </a>
          </div>
        </div>
      </section>
    </BaseLayout>
  )
}