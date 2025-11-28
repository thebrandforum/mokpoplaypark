'use client'

import BaseLayout from '../../../components/base-layout'
import CommonBanner from '../../../components/common-banner'
import { useState, useEffect } from 'react'
import { CalendarIcon, TagIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface Event {
  id: number
  title: string
  description: string
  image: string
  startDate: string
  endDate: string
  status: 'ongoing' | 'upcoming' | 'ended'
}

export default function EventPage() {
  const [isClient, setIsClient] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 화면 크기에 따른 페이지당 이벤트 수
  const getEventsPerPage = () => {
    return isMobile ? 6 : 9
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      loadEvents()
    }
  }, [isClient, currentPage, isMobile])

  // API에서 이벤트 로드
  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const eventsPerPage = getEventsPerPage()
      const response = await fetch(`/api/community?type=events&page=${currentPage}&limit=${eventsPerPage}`)
      const result = await response.json()

      if (result.success) {
        setEvents(result.data.events || [])
        setTotalPages(Math.ceil(result.data.eventsTotal / eventsPerPage))
      } else {
        console.error('이벤트 로드 실패:', result.message)
        setEvents([])
      }
    } catch (error) {
      console.error('이벤트 로드 실패:', error)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  // 현재 페이지에 해당하는 이벤트 가져오기
  const getCurrentEvents = () => {
    return events // API에서 이미 페이지네이션된 데이터
  }

  // 이벤트 클릭 핸들러
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 페이지 변경 시 화면 크기가 바뀌었을 경우 1페이지로 리셋
    if (page === 1) {
      setCurrentPage(1)
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

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">이벤트를 불러오는 중...</p>
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

      {/* 탭 메뉴 - 모바일 반응형 */}
      <section className="bg-white py-4">
        <div className="text-center px-4">
          <div className="bg-white/90 px-4 sm:px-8 py-4 rounded inline-flex overflow-x-auto whitespace-nowrap">
            <a 
              href="/community"
              className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base flex-shrink-0"
            >
              공지사항
            </a>
            <span className="text-gray-400 px-2">|</span>
            <a 
              href="/community/faq"
              className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base flex-shrink-0"
            >
              자주하는 질문
            </a>
            <span className="text-gray-400 px-2">|</span>
            <a 
              href="/community/event"
              className="text-orange-500 border-b-2 border-orange-500 pb-1 px-3 sm:px-4 text-sm sm:text-base flex-shrink-0"
            >
              이벤트
            </a>
          </div>
        </div>
      </section>

      {/* 이벤트 컨텐츠 - 모바일 반응형 */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* 상세보기가 열려있을 때 */}
        {selectedEvent ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* 뒤로가기 버튼 */}
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-600 hover:text-orange-500 text-sm"
              >
                ← 이벤트 목록으로 돌아가기
              </button>
            </div>
            
            {/* 이벤트 상세 내용 - 모바일 반응형 */}
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6">
                <div className={`inline-block px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 ${
                  selectedEvent.status === 'ongoing' ? 'bg-green-500 text-white' : 
                  selectedEvent.status === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {selectedEvent.status === 'ongoing' ? '진행중' : 
                   selectedEvent.status === 'upcoming' ? '예정' : '종료'}
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">{selectedEvent.title}</h2>
                <div className="flex items-center text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="break-all">{selectedEvent.startDate} ~ {selectedEvent.endDate}</span>
                </div>
              </div>
              
              <div className="mb-6 sm:mb-8">
                <div className="w-full h-48 sm:h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  <TagIcon className="w-16 h-16 sm:w-24 sm:h-24" />
                </div>
              </div>
              
              <div className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
                {selectedEvent.description}
                <br /><br />
                자세한 이벤트 내용과 참여 방법은 현장에서 안내드립니다. 
                많은 참여 부탁드립니다!
              </div>
            </div>
          </div>
        ) : (
          /* 목록보기 - 모바일 반응형 */
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {getCurrentEvents().map((event) => (
                <div 
                  key={event.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => handleEventClick(event)}
                >
                  {/* 이벤트 이미지 - 모바일 반응형 */}
                  <div className="relative h-40 sm:h-48 bg-gray-200">
                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 text-white">
                      <div className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                        event.status === 'ongoing' ? 'bg-green-500' : 
                        event.status === 'upcoming' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {event.status === 'ongoing' ? '진행중' : 
                         event.status === 'upcoming' ? '예정' : '종료'}
                      </div>
                    </div>
                    {/* 실제 이미지가 없으므로 플레이스홀더 */}
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <TagIcon className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                  </div>

                  {/* 이벤트 정보 - 모바일 반응형 */}
                  <div className="p-3 sm:p-4 lg:p-6">
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 lg:mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                      <div className="flex items-center">
                        <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{event.startDate}</span>
                      </div>
                      <span className="hidden sm:inline mx-2">~</span>
                      <span className="truncate">{event.endDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 - 모바일 반응형 */}
            <div className="mt-8 sm:mt-12 flex justify-center">
              <div className="flex space-x-1">
                <button 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded ${
                      currentPage === page
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </BaseLayout>
  )
}