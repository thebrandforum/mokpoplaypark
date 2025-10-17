'use client'

import BaseLayout from '../../components/base-layout'
import CommonBanner from '../../components/common-banner'
import { useState, useEffect } from 'react'
import { MegaphoneIcon, CalendarIcon, EyeIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface Notice {
  id: number
  title: string
  content: string
  author: string
  date: string
  important: boolean
  displayNumber?: number | null
}

// 샘플 공지사항 데이터 - API 연동시 제거됨
const sampleNotices: Notice[] = []

export default function CommunityPage() {
  const [isClient, setIsClient] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalNotices, setTotalNotices] = useState(0)  // 추가
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const noticesPerPage = 10

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      loadNotices()
    }
  }, [isClient, currentPage])

  // API에서 공지사항 로드
  const loadNotices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/community?type=notices&page=${currentPage}&limit=${noticesPerPage}&orderBy=createdAt&order=desc`)
      const result = await response.json()

      if (result.success) {
        setNotices(result.data.notices || [])
        setTotalNotices(result.data.noticesTotal || 0)  // 추가
        setTotalPages(Math.ceil(result.data.noticesTotal / noticesPerPage))
      } else {
        console.error('공지사항 로드 실패:', result.message)
        setNotices([])
      }
    } catch (error) {
      console.error('공지사항 로드 실패:', error)
      setNotices([])
    } finally {
      setIsLoading(false)
    }
  }

  // 현재 페이지에 해당하는 공지사항 가져오기
  const getCurrentNotices = () => {
    return notices // API에서 이미 페이지네이션된 데이터
  }

  // 공지사항 클릭 핸들러
  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice)
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
            <p className="text-gray-600">공지사항을 불러오는 중...</p>
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
              className="text-orange-500 border-b-2 border-orange-500 pb-1 px-3 sm:px-4 text-sm sm:text-base flex-shrink-0"
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
              className="text-gray-600 hover:text-orange-500 px-3 sm:px-4 text-sm sm:text-base flex-shrink-0"
            >
              이벤트
            </a>
          </div>
        </div>
      </section>

      {/* 공지사항 컨텐츠 - 모바일 반응형 */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* 상세보기가 열려있을 때 */}
          {selectedNotice ? (
            <div>
              {/* 뒤로가기 버튼 */}
              <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="text-gray-600 hover:text-orange-500 text-sm"
                >
                  ← 목록으로 돌아가기
                </button>
              </div>
              
              {/* 공지사항 상세 내용 - 모바일 반응형 */}
              <div className="px-4 sm:px-6 py-6 sm:py-8">
                <div className="border-b pb-4 mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4">{selectedNotice.title}</h2>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-600 space-y-1 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row">
                      <span>작성자: {selectedNotice.author}</span>
                      <span className="hidden sm:inline mx-4">|</span>
                      <span>작성일: {selectedNotice.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {selectedNotice.content}
                </div>
              </div>
            </div>
          ) : (
            /* 목록보기 - 모바일 반응형 */
            <>
              {/* 데스크톱용 테이블 헤더 */}
              <div className="hidden md:block bg-gray-100 px-6 py-4 border-b">
                <div className="grid grid-cols-10 text-sm font-medium text-gray-700">
                  <div className="col-span-1 text-center">번호</div>
                  <div className="col-span-7 text-center">제목</div>
                  <div className="col-span-1 text-center">작성자</div>
                  <div className="col-span-1 text-center">날짜</div>
                </div>
              </div>

              {/* 공지사항 리스트 - 모바일/데스크톱 반응형 */}
              <div className="divide-y">
                {getCurrentNotices().map((notice, index) => (
                  <div 
                    key={notice.id}
                    className={`px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      notice.important ? 'bg-yellow-50 hover:bg-yellow-100' : ''
                    }`}
                    onClick={() => handleNoticeClick(notice)}
                  >
                    {/* 모바일용 카드 형태 */}
                    <div className="block md:hidden">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {notice.important ? (
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">공지</span>
                          ) : (
                            <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded">
                              {totalNotices - ((currentPage - 1) * noticesPerPage) - index}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{notice.date}</div>
                      </div>
                      <div className={`text-sm sm:text-base mb-1 ${notice.important ? 'font-medium' : ''}`}>
                        {notice.title}
                      </div>
                      <div className="text-xs text-gray-600">작성자: {notice.author}</div>
                    </div>

                    {/* 데스크톱용 테이블 형태 */}
                    <div className="hidden md:grid grid-cols-10 text-sm items-center">
                      <div className="col-span-1 text-center">
                        {notice.important ? (
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">공지</span>
                        ) : (
                          <span className="text-gray-600">
                            {totalNotices - ((currentPage - 1) * noticesPerPage) - index}
                          </span>
                        )}
                      </div>
                      <div className={`col-span-7 ${notice.important ? 'font-medium' : ''}`}>
                        {notice.title}
                      </div>
                      <div className="col-span-1 text-center text-gray-600">{notice.author}</div>
                      <div className="col-span-1 text-center text-gray-600">{notice.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 - 모바일 반응형 */}
              <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
                <div className="flex justify-center">
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
              </div>
            </>
          )}

        </div>
      </section>
    </BaseLayout>
  )
}