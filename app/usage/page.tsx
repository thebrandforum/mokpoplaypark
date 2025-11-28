'use client'

import BaseLayout from '../../components/base-layout'
import CommonBanner from '../../components/common-banner'
import { useState, useEffect } from 'react'
import { ClockIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline'

export default function UsagePage() {
  const [isClient, setIsClient] = useState(false)
  const [usageData, setUsageData] = useState(null)
  const [operationSettings, setOperationSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    loadPageData()
  }, [])

  const loadPageData = async () => {
    try {
      setLoading(true)
      
      // 이용안내 데이터와 운영 설정 데이터를 동시에 가져오기
      const [usageResponse, settingsResponse] = await Promise.all([
        fetch('/api/admin/usage-info?section=usage'),
        fetch('/api/settings')
      ])

      const usageResult = await usageResponse.json()
      const settingsResult = await settingsResponse.json()

      if (usageResult.success) {
        setUsageData(usageResult.data)
      }

      if (settingsResult.success) {
        setOperationSettings(settingsResult.data.operation_settings)
      }

    } catch (error) {
      console.error('페이지 데이터 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 휴무일 텍스트 변환 (월~일 순서로 정렬)
  const getClosedDaysText = (closedDays) => {
    if (!closedDays || closedDays.length === 0) return '없음'
    
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    
    // 요일 번호 순서대로 정렬 (일요일=0, 월요일=1, ..., 토요일=6)
    const sortedDays = [...closedDays].sort((a, b) => {
      // 일요일(0)을 마지막으로 정렬하기 위해 0을 7로 변환
      const dayA = a === 0 ? 7 : a
      const dayB = b === 0 ? 7 : b
      return dayA - dayB
    })
    
    return '매주 ' + sortedDays.map(day => dayNames[day]).join(', ')
  }

  // 운영 요일 텍스트 변환 (하드코딩)
  const getOperatingDaysText = (closedDays) => {
    return '화 ~ 일요일 운영'
  }

  // 입장마감시간 계산 (운영종료 1시간 전)
  const getLastEntryTime = (closeTime) => {
    if (!closeTime) return '20:00'
    
    const [hours, minutes] = closeTime.split(':').map(Number)
    const lastEntryHour = hours - 1
    return `${lastEntryHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
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
            <p className="text-gray-600">이용안내 정보를 불러오는 중...</p>
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

      {/* 2x2 네비게이션 메뉴 */}
      <section className="bg-white py-4">
        <div className="text-center px-4">
          <div className="bg-white/90 px-4 sm:px-8 py-4 rounded inline-flex">
            {/* 모바일: 2x2 그리드, 데스크톱: 한 줄 */}
            <div className="grid grid-cols-1 md:flex md:items-center md:space-x-2">
              {/* 모바일 첫 번째 줄 / 데스크톱 전체 */}
              <div className="flex justify-center items-center mb-2 md:mb-0">
                <a href="/usage" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap">
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
                <a href="/restrictions" className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap">
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

      {/* 이용안내 카드 섹션 - 모바일 반응형 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="space-y-8 sm:space-y-10">
          
          {usageData?.sections?.map((section, index) => {
            console.log(`렌더링 섹션 ${index}:`, section.title, section.id) // 디버깅용
            
            return (
              <div key={`${section.id}-${index}`} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col lg:flex-row">
                  {/* 컬러 패널 - 모바일에서 상단으로 */}
                  <div className={`text-white p-6 sm:p-8 text-center flex flex-col justify-center items-center lg:w-48 ${
                    section.title.includes('이용시간') ? 'bg-blue-500' :
                    section.title.includes('이용약관') ? 'bg-green-500' :
                    (section.title.includes('고객센터') || section.title.includes('예약센터') || (section.content && typeof section.content === 'object' && !Array.isArray(section.content) && section.content.phone)) ? 'bg-orange-500' : 'bg-gray-500'
                  }`}>
                    {section.title.includes('이용시간') && <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />}
                    {section.title.includes('이용약관') && <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />}
                    {(section.title.includes('고객센터') || section.title.includes('예약센터') || (section.content && typeof section.content === 'object' && !Array.isArray(section.content) && section.content.phone)) && <PhoneIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />}
                    
                    <div className="text-2xl sm:text-3xl font-bold mb-2">{String(index + 1).padStart(2, '0')}</div>
                    <div className="text-base sm:text-lg font-medium whitespace-pre-line">{section.title}</div>
                  </div>

                  {/* 콘텐츠 영역 */}
                  <div className="flex-1 p-6 sm:p-8">
                    {/* 이용시간 섹션 - 모바일 테이블 최적화 */}
                    {section.title.includes('이용시간') && (
                      <div>
                        {/* 데스크톱 테이블 */}
                        <div className="hidden lg:block">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-4 font-bold text-gray-800">운영시간</th>
                                <th className="text-left py-4 font-bold text-gray-800">입장마감시간</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="py-4">
                                  <div className="flex items-center gap-4">
                                    <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full font-medium">
                                      {getOperatingDaysText(operationSettings?.closedDays)}
                                    </span>
                                    <span className="bg-green-100 text-green-800 px-3 py-2 rounded-full font-bold">
                                      {operationSettings?.openTime || '10:00'} ~ {operationSettings?.closeTime || '21:00'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <span className="bg-orange-100 text-orange-800 px-3 py-2 rounded-full font-bold">
                                    {getLastEntryTime(operationSettings?.closeTime)}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* 모바일 카드 형태 */}
                        <div className="lg:hidden space-y-4">
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-bold text-gray-800 mb-3">운영시간</h4>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full font-medium text-sm">
                                {getOperatingDaysText(operationSettings?.closedDays)}
                              </span>
                              <span className="bg-green-100 text-green-800 px-3 py-2 rounded-full font-bold text-sm">
                                {operationSettings?.openTime || '10:00'} ~ {operationSettings?.closeTime || '21:00'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-bold text-gray-800 mb-2">입장마감시간</h4>
                            <span className="bg-orange-100 text-orange-800 px-3 py-2 rounded-full font-bold text-sm">
                              {getLastEntryTime(operationSettings?.closeTime)}
                            </span>
                          </div>
                        </div>

                        {/* 안내 문구 추가 */}
                        <div className="mt-4 space-y-2">
                          <p className="text-xs sm:text-sm text-gray-600">
                            • 시설 운영 시간은 목포 플레이파크 사정에 따라 변경될 수 있습니다.
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            • 휴관일 : {getClosedDaysText(operationSettings?.closedDays)} (공휴일인 경우 익일), 신정, 설날 및 추석 연휴, 그 밖에 시설 운영상 필요한 날
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 이용약관 섹션 */}
                    {section.title.includes('이용약관') && Array.isArray(section.content) && (
                      <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700">
                        {section.content.map((item, itemIndex) => (
                          <li key={`${section.id}-item-${itemIndex}`} className="flex items-start">
                            <span className="bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                              {itemIndex + 1}
                            </span>
                            <span className="whitespace-pre-line">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* 고객센터 섹션 */}
                    {(section.title.includes('고객센터') || section.title.includes('예약센터') || (section.content && typeof section.content === 'object' && !Array.isArray(section.content) && section.content.phone)) && section.content && (
                      <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700">
                        <li>
                          <div className="flex items-start">
                            <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-gray-800">
                                고객센터(이용문의) 안내 : 전화 {section.content.phone || '000-000-0000'}
                              </span><br/>
                              <span className="text-gray-600">
                                (근무시간 | {section.content.hours || '10:00~18:00'}, 점심시간 | {section.content.lunch || '12:00~13:00'})
                              </span>
                            </div>
                          </div>
                        </li>
                        {section.content.weekday && (
                          <li>
                            <div className="flex items-start">
                              <span className="text-orange-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                              <span className="font-medium">평일 상담 안내 : {section.content.weekday}</span>
                            </div>
                          </li>
                        )}
                        {section.content.weekend && (
                          <li>
                            <div className="flex items-start">
                              <span className="text-orange-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                              <span className="font-medium">토, 일 및 공휴일 : {section.content.weekend}</span>
                            </div>
                          </li>
                        )}
                      </ul>
                    )}

                    {/* 기타 섹션 (리스트 형태) */}
                    {!section.title.includes('이용시간') && !section.title.includes('이용약관') && !section.title.includes('고객센터') && Array.isArray(section.content) && (
                      <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700">
                        {section.content.map((item, itemIndex) => (
                          <li key={`${section.id}-item-${itemIndex}`} className="flex items-start">
                            <span className="bg-gray-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                              {itemIndex + 1}
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* 데이터가 없을 때 */}
          {(!usageData?.sections || usageData.sections.length === 0) && (
            <div className="text-center py-12 sm:py-20">
              <p className="text-gray-500 text-base sm:text-lg">이용안내 정보가 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </BaseLayout>
  )
}