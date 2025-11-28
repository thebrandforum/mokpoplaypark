'use client'

import BaseLayout from '../../../components/base-layout'
import CommonBanner from '../../../components/common-banner'
import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
}

export default function FAQPage() {
  const [isClient, setIsClient] = useState(false)
  const [openItems, setOpenItems] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const faqsPerPage = 3

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      loadFaqs()
    }
  }, [isClient, currentPage])

  // API에서 FAQ 로드
  const loadFaqs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/community?type=faqs&page=${currentPage}&limit=${faqsPerPage}`)
      const result = await response.json()

      if (result.success) {
        setFaqs(result.data.faqs || [])
        setTotalPages(Math.ceil(result.data.faqsTotal / faqsPerPage))
      } else {
        console.error('FAQ 로드 실패:', result.message)
        setFaqs([])
      }
    } catch (error) {
      console.error('FAQ 로드 실패:', error)
      setFaqs([])
    } finally {
      setIsLoading(false)
    }
  }

  // 현재 페이지에 해당하는 FAQ 가져오기
  const getCurrentFAQs = () => {
    return faqs // API에서 이미 페이지네이션된 데이터
  }

  // 페이지 변경시 열린 아이템 초기화
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setOpenItems([]) // 페이지 변경시 모든 아이템 닫기
  }

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
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
            <p className="text-gray-600">FAQ를 불러오는 중...</p>
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
              className="text-orange-500 border-b-2 border-orange-500 pb-1 px-3 sm:px-4 text-sm sm:text-base flex-shrink-0"
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

      {/* FAQ 컨텐츠 - 모바일 반응형 */}
      <section className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {getCurrentFAQs().map((faq) => (
              <div key={faq.id} className="border-b border-gray-200">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-black text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                      Q
                    </div>
                    <span className="text-gray-800 text-sm sm:text-base break-words pr-2">{faq.question}</span>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {openItems.includes(faq.id) ? (
                      <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {openItems.includes(faq.id) && (
                  <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gray-50">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                        A
                      </div>
                      <div className="text-gray-700 whitespace-pre-line text-sm sm:text-base break-words">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                )}
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
        </div>
      </section>
    </BaseLayout>
  )
}