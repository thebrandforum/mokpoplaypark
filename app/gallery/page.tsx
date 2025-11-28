'use client'

import BaseLayout from '../../components/base-layout'
import CommonBanner from '../../components/common-banner'
import { useState, useEffect } from 'react'

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 9 // 3x3 그리드

  useEffect(() => {
    loadContent()
  }, [])

  // API에서 갤러리 콘텐츠 로드
  const loadContent = async () => {
    try {
      const response = await fetch('/api/admin/content')
      const result = await response.json()
      
      if (result.success && result.data && result.data.gallery) {
        setContent(result.data.gallery)
      }
    } catch (error) {
      console.error('갤러리 콘텐츠 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 기본값 설정 (API 응답이 없을 경우)
  const galleryData = content || {
    title: '갤러리',
    description: '목포 플레이파크의 생생한 모습들',
    images: []
  }

  // 이미지 데이터 처리
  const galleryImages = galleryData.images && galleryData.images.length > 0 
    ? galleryData.images.map((img, index) => ({
        id: index + 1,
        src: img.url || '/images/gallery/placeholder.jpg',
        title: img.title || `이미지 ${index + 1}`,
        description: img.description || '',
        date: new Date().toLocaleDateString('ko-KR')
      }))
    : []

  // 페이지네이션 계산
  const totalPages = Math.ceil(galleryImages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentImages = galleryImages.slice(startIndex, endIndex)

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">갤러리를 불러오는 중...</p>
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
            <a href="/gallery" className="text-orange-500 border-b-2 border-orange-500 pb-1 px-2 sm:px-4 text-sm sm:text-base">갤러리</a>
            <span className="text-gray-400 px-1 sm:px-2">|</span>
            <a href="/location" className="text-gray-600 hover:text-orange-500 px-2 sm:px-4 text-sm sm:text-base">오시는길</a>
          </div>
        </div>
      </section>
	
	  <div className="h-6 sm:h-8 lg:h-10"></div>	  
	  <div className="h-6 sm:h-8 lg:h-10"></div>
	 	  

      {/* 갤러리 섹션 - 모바일 반응형 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">
        <div className="bg-gray-50 p-6 sm:p-8 lg:p-10 rounded-lg">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{galleryData.title}</h2>
            <p className="text-gray-600 text-sm sm:text-base">{galleryData.description}</p>
          </div>

          {/* 갤러리가 비어있을 때 */}
          {galleryImages.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">아직 등록된 사진이 없습니다</h3>
              <p className="text-gray-600 text-sm sm:text-base">관리자가 갤러리 사진을 업로드하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <>
              {/* 반응형 그리드: 모바일 2열, 태블릿 3열, 데스크톱 3열 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto">
                {currentImages.map((image) => (
                  <div 
                    key={image.id}
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden relative">
                      {image.src && image.src !== '/images/gallery/placeholder.jpg' ? (
                        <img 
                          src={image.src} 
                          alt={image.title}
                          className="absolute inset-0 w-full h-full object-contain group-hover:scale-110 transition-transform"
                          style={{ objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform text-xs sm:text-sm">
                          이미지 {image.id}
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <h3 className="font-medium text-gray-900 truncate text-xs sm:text-sm">{image.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{image.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 - 모바일 최적화 */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-1 sm:space-x-2 mb-4">
                  {/* 이전 페이지 버튼 */}
                  {currentPage > 1 && (
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-2 sm:px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
                    >
                      ‹
                    </button>
                  )}

                  {/* 페이지 번호들 - 모바일에서 일부만 표시 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // 모바일에서는 현재 페이지 주변만 표시
                      if (typeof window !== 'undefined' && window.innerWidth < 640) {
                        return Math.abs(page - currentPage) <= 2
                      }
                      return true
                    })
                    .map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 sm:px-3 py-2 rounded transition text-sm ${
                        page === currentPage
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* 다음 페이지 버튼 */}
                  {currentPage < totalPages && (
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-2 sm:px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
                    >
                      ›
                    </button>
                  )}
                </div>
              )}

              {/* 페이지 정보 */}
              <div className="text-center text-gray-600 text-xs sm:text-sm">
                총 {galleryImages.length}개의 사진 | {currentPage}/{totalPages} 페이지
              </div>
            </>
          )}
        </div>
      </section>

      {/* 이미지 모달 - 모바일 최적화 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {selectedImage.src && selectedImage.src !== '/images/gallery/placeholder.jpg' ? (
                <img 
                  src={selectedImage.src} 
                  alt={selectedImage.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-500 text-lg sm:text-2xl">큰 이미지 {selectedImage.id}</span>
              )}
            </div>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-2">{selectedImage.title}</h3>
              {selectedImage.description && (
                <p className="text-gray-600 mb-2 text-sm sm:text-base">{selectedImage.description}</p>
              )}
              <p className="text-gray-500 text-xs sm:text-sm">{selectedImage.date}</p>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  )
}