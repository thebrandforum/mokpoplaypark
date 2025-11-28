'use client'

import BaseLayout from '../../components/base-layout'
import CommonBanner from '../../components/common-banner'
import { useState, useEffect } from 'react'
import { TicketIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const [isClient, setIsClient] = useState(false)
  const [settings, setSettings] = useState({
    price_settings: {
      adult1Hour: 17000,
      child1Hour: 12000,
      adult2Hour: 25000,  // 추가
      child2Hour: 18000,  // 추가
      guardian: 3000,
      guardian1Hour: 3000,  // 추가
      guardian2Hour: 3000,  // 추가
      groupDiscount: 10,
      minGroupSize: 20,
      remark1Hour: '',  // 추가
      remark2Hour: '',   // 추가
      discount_child_1hour: 10000,  // 감면 요금 추가
      discount_adult_1hour: 15000,  // 감면 요금 추가
      discount_child_2hour: 20000,  // 감면 요금 추가
      discount_adult_2hour: 30000   // 감면 요금 추가
    },
    operation_settings: {
      closeTime: '21:00'
    }
  })
  
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      const result = await response.json()

      if (result.success && result.data) {
        setSettings(result.data)
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 금액 포맷팅 함수
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
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

  return (
    <BaseLayout>
      {/* CommonBanner 적용 */}
      <CommonBanner 
      />
		  
	  <div className="h-6 sm:h-8 lg:h-10"></div>	  

      {/* 2x2 네비게이션 메뉴 - 반응형 (/pricing 활성화) */}
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
                <a href="/restrictions" className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap">
                  이용제한 및 유의사항
                </a>
                <span className="text-gray-400 px-2">|</span>
                <a href="/pricing" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap">
                  요금안내
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
		  
	  <div className="h-6 sm:h-8 lg:h-10"></div>	  

      {/* 요금 안내 섹션 - 모바일 반응형 */}
      <section id="price" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 섹션 타이틀 - 모바일 반응형 */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 sm:px-4 py-2 rounded-full text-blue-600 text-xs sm:text-sm font-medium mb-4">
              <TicketIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>PRICE INFORMATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-gray-900 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">이용요금</span>
            </h2>
          </div>
      
          {/* 요금표 - 모바일 반응형 */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6" style={{background: 'linear-gradient(90deg, #0060AF 0%, #0080DF 100%)'}}>
              <h3 className="text-white text-lg sm:text-xl font-bold text-center">이용요금</h3>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8">
              {/* 모바일용 요금표 - 간단한 테이블 형태 */}
              <div className="block md:hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 rounded-lg text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300">
                        <th className="border-r border-gray-300 p-2 text-center">시간</th>
                        <th className="border-r border-gray-300 p-2 text-center">어린이</th>
                        <th className="border-r border-gray-300 p-2 text-center">성인</th>
                        <th className="border-r border-gray-300 p-2 text-center">보호자</th>
                        <th className="p-2 text-center">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td colSpan={5} className="p-2 text-center font-bold">일반 요금</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="border-r border-gray-300 p-2 text-center font-medium">1시간</td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings.child1Hour)}
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings.adult1Hour)}
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings?.guardian1Hour || settings.price_settings?.guardian || 3000)}
                        </td>
                        <td className="p-2 text-center text-xs">{settings?.price_settings?.remark1Hour || '20:00 마감'}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="border-r border-gray-300 p-2 text-center font-medium">2시간</td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings.child2Hour)}
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings.adult2Hour)}
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings?.guardian2Hour || settings.price_settings?.guardian || 3000)}
                        </td>
                        <td className="p-2 text-center text-xs">{settings?.price_settings?.remark2Hour || '19:00 마감'}</td>
                      </tr>
                      {/* 감면 요금 추가 */}
                      <tr className="border-b border-gray-300">
                        <td colSpan={5} className="p-2 text-center font-bold">감면 요금</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="border-r border-gray-300 p-2 text-center font-medium">1시간</td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings.discount_child_1hour || 10000)}
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings.discount_adult_1hour || 15000)}
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings?.guardian1Hour || settings.price_settings?.guardian || 3000)}
                        </td>
                        <td className="p-2 text-center text-xs">{settings?.price_settings?.remark1Hour || '20:00 마감'}</td>
                      </tr>
                      <tr>
                        <td className="border-r border-gray-300 p-2 text-center font-medium">2시간</td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings.discount_child_2hour || 20000)}
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings.discount_adult_2hour || 30000)}
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">
                          {formatMoney(settings.price_settings?.guardian2Hour || settings.price_settings?.guardian || 3000)}
                        </td>
                        <td className="p-2 text-center text-xs">{settings?.price_settings?.remark2Hour || '19:00 마감'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* 모바일용 연령 구분 안내 */}
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <div>• 어린이: 만7세~만13세 미만</div>
                  <div>• 성인: 만13세 이상</div>
                  <div>• 보호자: 놀이시설 이용불가</div>
                </div>
              </div>
              
              {/* 태블릿/PC용 요금표 - 기존 테이블 형태 */}
              <div className="hidden md:block">
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300">
                        <th rowSpan={2} className="border-r border-gray-300 p-4 text-center">종류</th>
                        <th rowSpan={2} className="border-r border-gray-300 p-4 text-center">이용시간</th>
                        <th colSpan={3} className="border-b border-gray-300 p-2 text-center">이용요금</th>
                        <th rowSpan={2} className="border-l border-gray-300 p-4 text-center">비고</th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-300">
                        <th className="border-r border-gray-300 p-2 text-center text-sm">
                          어린이<br />
                          <span className="font-normal text-xs">(만7세~만13세 미만)</span>
                        </th>
                        <th className="border-r border-gray-300 p-2 text-center text-sm">
                          청소년 및 성인<br />
                          <span className="font-normal text-xs">(만13세 이상)</span>
                        </th>
                        <th className="p-2 text-center text-sm">
                          보호자<br />
                          <span className="font-normal text-xs">(놀이시설 이용불가)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td rowSpan={2} className="border-r border-gray-300 p-4 text-center">일반<br />요금</td>
                        <td className="border-r border-gray-300 p-4 text-center">1시간</td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings.child1Hour)}
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings.adult1Hour)}
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings?.guardian1Hour || settings.price_settings?.guardian || 3000)}
                        </td>
                        <td className="p-4 text-center">
                          {settings?.price_settings?.remark1Hour || '20:00 발권마감'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="border-r border-gray-300 p-4 text-center">2시간</td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings.child2Hour)}
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings.adult2Hour)}
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings?.guardian2Hour || settings.price_settings?.guardian || 3000)}
                        </td>
                        <td className="p-4 text-center">
                          {settings?.price_settings?.remark2Hour || '19:00 발권마감'}
                        </td>
                      </tr>
                      {/* 감면 요금 추가 */}
                      <tr className="border-b border-gray-300">
                        <td rowSpan={2} className="border-r border-gray-300 p-4 text-center">감면<br />요금</td>
                        <td className="border-r border-gray-300 p-4 text-center">1시간</td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings.discount_child_1hour || 10000)}
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings.discount_adult_1hour || 15000)}
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings?.guardian1Hour || settings.price_settings?.guardian || 3000)}
                        </td>
                        <td className="p-4 text-center">
                          {settings?.price_settings?.remark1Hour || '20:00 발권마감'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-r border-gray-300 p-4 text-center">2시간</td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings.discount_child_2hour || 20000)}
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings.discount_adult_2hour || 30000)}
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center font-bold">
                          {formatMoney(settings.price_settings?.guardian2Hour || settings.price_settings?.guardian || 3000)}
                        </td>
                        <td className="p-4 text-center">
                          {settings?.price_settings?.remark2Hour || '19:00 발권마감'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* 감면 요금 대상자 안내 - 모바일 반응형 */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6" style={{background: 'linear-gradient(90deg, #0060AF 0%, #0080DF 100%)'}}>
              <h3 className="text-white text-lg sm:text-xl font-bold text-center">감면 요금 대상자</h3>
              <p className="text-white/90 text-sm text-center mt-1">(입장 시 현장에서 해당하는 서류 확인 필수)</p>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5">•</span>
                  <span className="text-sm sm:text-base">목포시 관내에 주민등록이 되어있는 목포 시민</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5">•</span>
                  <span className="text-sm sm:text-base">'국가유공자 등 예우 및 지원에 관한 법률'에 따른 국가유공자와 그 유족</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5">•</span>
                  <span className="text-sm sm:text-base">'장애인복지법' 제2조에 따른 장애인</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5">•</span>
                  <span className="text-sm sm:text-base">'국민기초생활 보장법' 제2조에 따른 국민기초생활수급자</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-0.5">•</span>
                  <span className="text-sm sm:text-base">'한부모가족지원법' 제4조에 따른 한부모가족 감면대상자</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 이용권 구매하러 가기 버튼 - 모바일 반응형 */}
          <div className="text-center mt-8 sm:mt-12">
            <button
              onClick={() => router.push('/reservation')}
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base sm:text-lg rounded-full hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg w-full sm:w-auto"
            >
              <TicketIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              이용권 구매하러 가기
            </button>
          </div>
        </div>
      </section>
    </BaseLayout>
  )
}