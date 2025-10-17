'use client'

import BaseLayout from '../../../components/base-layout'
import CommonBanner from '../../../components/common-banner'
import { useEffect, useState } from 'react'

export default function AmenitiesPage() {
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
      const response = await fetch('/api/admin/facility?section=amenities')
      const result = await response.json()

      if (result.success) {
        setFacilityData(result.data)
      } else {
        console.error('시설 데이터 로드 실패:', result.message)
        // 기본값 설정
        setFacilityData({
          title: '편의시설',
          subtitle: '편안하고 안전한 시설 이용을 위한 다양한 편의시설',
          items: []
        })
      }
    } catch (error) {
      console.error('시설 데이터 로드 중 오류:', error)
      // 기본값 설정
      setFacilityData({
        title: '편의시설',
        subtitle: '편안하고 안전한 시설 이용을 위한 다양한 편의시설',
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
      <CommonBanner 
      />
		  
	  <div className="h-6 sm:h-8 lg:h-10"></div>	  

      {/* 메인 콘텐츠 섹션 - 모바일 반응형 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 pt-8 sm:pt-12">
        {/* 어트랙션 구성|편의시설 탭 - 왼쪽 위 */}
        <div className="mb-8 sm:mb-12">
          <div className="inline-flex overflow-x-auto whitespace-nowrap">
            <a href="/facility" className="text-gray-600 hover:text-orange-500 px-2 sm:px-4 font-medium text-sm sm:text-base">
              어트랙션 구성
            </a>
            <span className="text-gray-400 px-1 sm:px-2">|</span>
            <a href="/facility/amenities" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-2 sm:px-4 font-medium text-sm sm:text-base">편의시설</a>
          </div>
        </div>
		  
		<div className="h-6 sm:h-8 lg:h-10"></div>  

        {/* 상단 설명 */}
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4">
            {facilityData?.subtitle || '편안하고 안전한 시설 이용을 위한 다양한 편의시설'}
          </h2>
        </div>
		
		<div className="h-6 sm:h-8 lg:h-10"></div>
		<div className="h-6 sm:h-8 lg:h-10"></div>  

        {/* 층별 편의시설 구분 */}
        <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12">
          {/* 1층 섹션 */}
          <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-100">
            <div className="flex gap-6">
              <div className="flex-shrink-0 flex items-start mr-4">
                <div className="text-3xl lg:text-4xl font-black text-gray-900">1F</div>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {facilityData?.items?.filter(facility => facility.floor === '1F' || facility.floor === 1 || !facility.floor).map((facility, index) => (
                  <div key={facility.id || index} className="text-center">
                    {/* 이미지 영역 */}
                    <div className="aspect-square bg-gray-200 rounded-lg mb-2 sm:mb-3 flex items-center justify-center overflow-hidden">
                      {facility.image ? (
                        <img 
                          src={facility.image} 
                          alt={facility.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 text-xs sm:text-sm">{facility.name} 이미지</span>
                      )}
                    </div>
                    {/* 제목 */}
                    <h4 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{facility.name}</h4>
                    {/* 설명 */}
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                      {facility.description}
                    </p>
                    {/* 제한사항 (있을 경우) */}
                    {facility.requirements && facility.requirements.length > 0 && (
                      <div className="mt-1 sm:mt-2 text-xs text-gray-500">
                        {facility.requirements.slice(0, 2).map((req, reqIndex) => (
                          <p key={reqIndex}>{req}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        
          {/* 2층 섹션 - 2층 데이터가 있을 때만 표시 */}
          {facilityData?.items?.some(facility => facility.floor === '2F' || facility.floor === 2) && (
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <div className="flex gap-6">
                <div className="flex-shrink-0 flex items-start mr-4">
                  <div className="text-3xl lg:text-4xl font-black text-gray-900">2F</div>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {facilityData?.items?.filter(facility => facility.floor === '2F' || facility.floor === 2).map((facility, index) => (
                    <div key={facility.id || index} className="text-center">
                      {/* 이미지 영역 */}
                      <div className="aspect-square bg-gray-200 rounded-lg mb-2 sm:mb-3 flex items-center justify-center overflow-hidden">
                        {facility.image ? (
                          <img 
                            src={facility.image} 
                            alt={facility.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-xs sm:text-sm">{facility.name} 이미지</span>
                        )}
                      </div>
                      {/* 제목 */}
                      <h4 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{facility.name}</h4>
                      {/* 설명 */}
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                        {facility.description}
                      </p>
                      {/* 제한사항 (있을 경우) */}
                      {facility.requirements && facility.requirements.length > 0 && (
                        <div className="mt-1 sm:mt-2 text-xs text-gray-500">
                          {facility.requirements.slice(0, 2).map((req, reqIndex) => (
                            <p key={reqIndex}>{req}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 시설이 없을 때 메시지 */}
        {(!facilityData?.items || facilityData.items.length === 0) && (
          <div className="text-center py-12 sm:py-20">
            <p className="text-gray-500 text-base sm:text-lg">등록된 편의시설이 없습니다.</p>
          </div>
        )}
      </section>
    </BaseLayout>
  )
}