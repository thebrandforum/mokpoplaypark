'use client'

import BaseLayout from '../../components/base-layout'
import CommonBanner from '../../components/common-banner'
import { useEffect, useState } from 'react'

export default function LocationPage() {
  const [isClient, setIsClient] = useState(false)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    loadContent()
  }, [])

  // 카카오맵 초기화를 별도 useEffect로 분리
  useEffect(() => {
    if (!isClient || loading) return

    // 카카오맵 스크립트 로드
    const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || 'ecb6f0ad15a6499e8c0e12c06aa3d04a'
    console.log('카카오맵 API 키:', KAKAO_MAP_KEY)
    
    const script = document.createElement('script')
    script.async = true
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`
    document.head.appendChild(script)

    script.onload = () => {
      console.log('스크립트 로드 완료')
      if ((window as any).kakao && (window as any).kakao.maps) {
        (window as any).kakao.maps.load(() => {
          console.log('카카오맵 로드 완료')
          
          // 약간의 지연을 추가하여 DOM이 완전히 렌더링될 때까지 기다림
          setTimeout(() => {
            const container = document.getElementById('map')
            console.log('지도 컨테이너:', container)
            
            if (container) {
              const options = {
                center: new (window as any).kakao.maps.LatLng(34.794730, 126.419175),
                level: 3
              }
              const map = new (window as any).kakao.maps.Map(container, options)

              // 마커 생성
              const markerPosition = new (window as any).kakao.maps.LatLng(34.794730, 126.419175)
              const marker = new (window as any).kakao.maps.Marker({
                position: markerPosition
              })
              marker.setMap(map)

              // 인포윈도우 생성 - 깔끔한 디자인과 버튼 추가
              const infowindow = new (window as any).kakao.maps.InfoWindow({
                content: `
                  <div style="padding:10px; min-width:180px;">
                    <div style="font-weight:bold; font-size:14px; margin-bottom:5px;">목포 플레이파크</div>
                    <div style="text-align:center;">
                      <a href="https://map.kakao.com/link/map/목포플레이파크,34.794730,126.419175" 
                         target="_blank" 
                         style="display:inline-block; padding:5px 12px; background:#555; color:white; text-decoration:none; font-size:12px; border-radius:3px;">
                        큰 지도 보기
                      </a>
                    </div>
                  </div>
                `
              })
              infowindow.open(map, marker)
              
              console.log('지도 생성 완료')
            } else {
              console.error('지도 컨테이너를 찾을 수 없습니다')
            }
          }, 500) // 지연 시간을 500ms로 늘림
        })
      }
    }

    script.onerror = () => {
      console.error('카카오맵 스크립트 로드 실패')
    }

    return () => {
      const existingScript = document.querySelector(`script[src*="dapi.kakao.com"]`)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [isClient, loading]) // isClient와 loading 상태에 의존

  // API에서 위치 콘텐츠 로드
  const loadContent = async () => {
    try {
      const response = await fetch('/api/admin/content')
      const result = await response.json()
      
      if (result.success && result.data && result.data.location) {
        setContent(result.data.location)
      }
    } catch (error) {
      console.error('위치 콘텐츠 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 기본값 설정 (API 응답이 없을 경우)
  const locationData = content || {
    title: '오시는길',
    address: '전라남도 목포시 용해동 7-20 목포 플레이파크',
    driving: {
      title: '자가용으로 오시는 길',
      routes: [
        '서울에서 출발: 경부고속도로 → 서해안고속도로 → 목포IC → 목포플레이파크',
        '광주에서 출발: 무안광주고속도로 → 서해안고속도로 → 목포IC → 목포플레이파크',
        '대구에서 출발: 광주대구고속도로 → 무안광주고속도로 → 서해안고속도로 → 목포플레이파크',
        '부산에서 출발: 남해고속도로 → 호남고속도로 → 무안광주고속도로 → 목포플레이파크',
        '진주에서 출발: 남해고속도로 → 충무공로 → 남해고속도로 → 목포플레이파크'
      ],
      navigation: '전라남도 목포시 용해동 7-20'
    },
    publicTransport: {
      title: '대중교통으로 오시는 길',
      train: '목포역 하차 → 버스 66번 탑승 → 이로동주민센터 하차\n                     ↳ 시내버스 88번 탑승 → 문화예술회관 하차',
      bus: '목포종합버스터미널 하차 → 버스 66-1번 탑승 → 목포고용노동부 하차',
      taxi: '목포역 및 목포종합버스터미널에서 약 9분 소요 (약 6,000원)'
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

  return (
    <BaseLayout>
      {/* CommonBanner 적용 */}
      <CommonBanner 
      />
		  
	 <div className="h-6 sm:h-8 lg:h-10"></div>
     <div className="h-6 sm:h-8 lg:h-10"></div>
	  

      {/* 탭 메뉴 - 모바일 스크롤 가능 */}
      <section className="bg-white py-4">
        <div className="text-center px-4">
          <div className="bg-white/90 px-4 sm:px-8 py-4 rounded inline-flex overflow-x-auto whitespace-nowrap">
            <a href="/about" className="text-gray-600 hover:text-orange-500 px-2 sm:px-4 text-sm sm:text-base">
              목포 플레이파크 소개
            </a>
            <span className="text-gray-400 px-1 sm:px-2">|</span>
            <a href="/gallery" className="text-gray-600 hover:text-orange-500 px-2 sm:px-4 text-sm sm:text-base">갤러리</a>
            <span className="text-gray-400 px-1 sm:px-2">|</span>
            <a href="/location" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-2 sm:px-4 text-sm sm:text-base">오시는길</a>
          </div>
        </div>
      </section>
	 
	  <div className="h-6 sm:h-8 lg:h-10"></div>


      {/* 지도 및 정보 섹션 - 모바일 반응형 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 pt-8 sm:pt-12">
        {/* 지도 영역 - 반응형 높이 */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-gray-200 rounded-lg overflow-hidden shadow-lg h-64 sm:h-80 lg:h-96">
            <div id="map" className="w-full h-full"></div>
          </div>
        </div>

        {/* 주소 - API 연동 */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 px-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4">{locationData.address}</h2>
        </div>

        {/* 찾아오시는 길 - 모바일 반응형 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* 왼쪽 위: 자가용 제목 */}
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 lg:mb-8">
              {locationData.driving?.title || '자가용으로 오시는 길'}
            </h3>
          </div>

          {/* 오른쪽 위: 자가용 내용 */}
          <div className="space-y-3 sm:space-y-4 text-gray-700">
            {locationData.driving?.routes && locationData.driving.routes.map((route, index) => (
              <div key={index} className="flex items-start">
                <span className="text-orange-500 mr-2 font-bold text-sm sm:text-base">▶</span>
                <p className="leading-relaxed text-sm sm:text-base">{route}</p>
              </div>
            ))}
            
            {locationData.driving?.navigation && (
              <div className="mt-6 lg:mt-8 text-xs sm:text-sm text-gray-600">
                <span className="font-semibold">네비게이션 검색:</span> {locationData.driving.navigation}
              </div>
            )}
          </div>

          {/* 왼쪽 아래: 대중교통 제목 */}
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 lg:mb-8">
              {locationData.publicTransport?.title || '대중교통으로 오시는 길'}
            </h3>
          </div>

          {/* 오른쪽 아래: 대중교통 내용 */}
          <div className="space-y-4 sm:space-y-6 text-gray-700">
            {locationData.publicTransport?.train && (
              <div>
                <h4 className="font-bold mb-2 text-base sm:text-lg">기차 이용 시</h4>
                <p className="ml-2 sm:ml-4 leading-relaxed whitespace-pre-line text-sm sm:text-base">{locationData.publicTransport.train}</p>
              </div>
            )}
            
            {locationData.publicTransport?.bus && (
              <div>
                <h4 className="font-bold mb-2 text-base sm:text-lg">시외버스 이용 시</h4>
                <p className="ml-2 sm:ml-4 leading-relaxed text-sm sm:text-base">{locationData.publicTransport.bus}</p>
              </div>
            )}
            
            {locationData.publicTransport?.taxi && (
              <div>
                <h4 className="font-bold mb-2 text-base sm:text-lg">택시 이용 시</h4>
                <p className="ml-2 sm:ml-4 leading-relaxed text-sm sm:text-base">{locationData.publicTransport.taxi}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </BaseLayout>
  )
}