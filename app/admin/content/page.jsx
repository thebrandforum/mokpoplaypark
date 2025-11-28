'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '../../../components/admin/admin-layout'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState('about')
  const [isLoading, setIsLoading] = useState(false)
  const [savedSection, setSavedSection] = useState('')

  // 콘텐츠 데이터
  const [content, setContent] = useState({
    about: {
      title: '목포플레이파크',
      subtitle1: '전남 최초의 실내 모험 스포츠 테마파크',
      subtitle2: '13종의 모험스포츠 어트랙션',
      subtitle3: '남녀노소 즐기는 스릴과 넘치는 도전',
      description1: '스포츠클라이밍, 서바이벌 체험을 위한 최고의 모험 스포츠를 즐기며 서바이벌과 클라이머들을 꿈꾸는 청소년 성인 700평 구성을 서바이벌 모험 스포츠 테마파크로 구성',
      description2: '총 13종류의 모험스포츠 체험이 내일 아침 가능한 아드레날린 스포츠를 위한 가장 최적의 등반을 소개한 스포츠들 수 있는 내룡을 체험을 만날 수 있습니다. 당 시설을 코스와의 성단은 기반의 강화 시범에 남녀노소 체험수 다양한 는 스릴을 체험을 만날 수 있는 내룡을 체험을 만날 수 있습니다.',
      description3: '놀이 아임의 새로운 경험 스포츠 이상의 무시의! 무시의 정점을 는 본능을 개발을 스포츠에서 시험 아동 장치를 뒤어올 수 정확을 시간을 시각을 쇼케이스.',
      images: ['', '', '']
    },
    gallery: {
      title: '갤러리',
      description: '목포 플레이파크의 생생한 모습들',
      images: []
    },
    location: {
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
        train: '목포역 하차 → 버스 66번 탑승 → 이로동주민센터 하차 또는 시내버스 88번 탑승 → 문화예술회관 하차',
        bus: '목포종합버스터미널 하차 → 버스 66-1번 탑승 → 목포고용노동부 하차',
        taxi: '목포역 및 목포종합버스터미널에서 약 9분 소요 (약 6,000원)'
      }
    }
  })

  // 설정 불러오기
  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      console.log('콘텐츠 로딩 시작...')
      const response = await fetch('/api/admin/content')
      const result = await response.json()
      
      console.log('API 응답:', result)
      
      if (result.success && result.data) {
        console.log('데이터 설정:', result.data)
        // 기존 데이터와 병합하여 누락된 필드 보완
        setContent(prev => ({
          about: { ...prev.about, ...result.data.about },
          gallery: { ...prev.gallery, ...result.data.gallery },
          location: { ...prev.location, ...result.data.location }
        }))
      }
    } catch (error) {
      console.error('콘텐츠 로드 실패:', error)
    }
  }

  // 이미지 리사이즈 함수 추가 - 고품질 버전
  const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.5) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // 원본 크기
        let { width, height } = img
        
        // 비율 계산하여 리사이즈
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        // 캔버스 크기 설정
        canvas.width = width
        canvas.height = height
        
        // 고품질 렌더링 설정
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height)
        
        // blob으로 변환 (최적화된 품질!)
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // About 섹션 이미지 업로드
  const handleImageUpload = async (event, index) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      console.log(`이미지 ${index + 1} 업로드 시작...`)
      
      // 이미지 리사이즈 (고품질)
      const resizedFile = await resizeImage(file, 600, 400, 0.6)
      
      // 파일명 생성 (중복 방지)
      const fileExt = file.name.split('.').pop()
      const fileName = `about/image_${index + 1}_${Date.now()}.${fileExt}`
      
      // Supabase Storage 업로드 (리사이즈된 파일 사용)
      const { data, error } = await supabase.storage
        .from('content-images')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // 업로드된 이미지의 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName)

      // 상태 업데이트
      const newImages = [...(content.about.images || ['', '', ''])]
      
      // 기존 이미지가 있으면 삭제
      if (newImages[index] && newImages[index].includes('supabase')) {
        const oldFileName = newImages[index].split('/').pop()
        await supabase.storage
          .from('content-images')
          .remove([`about/${oldFileName}`])
      }
      
      newImages[index] = publicUrl
      setContent(prev => ({
        ...prev,
        about: { ...prev.about, images: newImages }
      }))

      console.log(`이미지 ${index + 1} 업로드 완료:`, publicUrl)

    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert(`이미지 업로드에 실패했습니다: ${error.message}`)
    }
  }

  // 갤러리 이미지 업로드
  const handleGalleryImageUpload = async (event, index) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      console.log(`갤러리 이미지 ${index + 1} 업로드 시작...`)
      
      // 이미지 리사이즈 (갤러리는 최고 품질)
      const resizedFile = await resizeImage(file, 600, 400, 0.6)
      
      // 파일명 생성
      const fileExt = file.name.split('.').pop()
      const fileName = `gallery/gallery_${Date.now()}_${index}.${fileExt}`
      
      // Supabase Storage 업로드 (리사이즈된 파일 사용)
      const { data, error } = await supabase.storage
        .from('content-images')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName)

      // 상태 업데이트
      const newImages = [...content.gallery.images]
      
      // 기존 이미지가 있으면 삭제
      if (newImages[index] && newImages[index].url && newImages[index].url.includes('supabase')) {
        const oldFileName = newImages[index].url.split('/').pop()
        await supabase.storage
          .from('content-images')
          .remove([`gallery/${oldFileName}`])
      }
      
      newImages[index] = { ...newImages[index], url: publicUrl }
      setContent(prev => ({
        ...prev,
        gallery: { ...prev.gallery, images: newImages }
      }))

      console.log(`갤러리 이미지 ${index + 1} 업로드 완료:`, publicUrl)

    } catch (error) {
      console.error('갤러리 이미지 업로드 실패:', error)
      alert(`이미지 업로드에 실패했습니다: ${error.message}`)
    }
  }

  // 메인 슬라이드 이미지 업로드 함수 (새로 추가)
  const handleMainImageUpload = async (event, index) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      console.log(`메인 이미지 ${index + 1} 업로드 시작...`)
      
      // 메인 슬라이드는 최고 화질 (전체 화면용)
      const resizedFile = await resizeImage(file, 600, 400, 0.6)
      
      // 파일명 생성
      const fileExt = file.name.split('.').pop()
      const fileName = `main/main_${Date.now()}_${index}.${fileExt}`
      
      // Supabase Storage 업로드
      const { data, error } = await supabase.storage
        .from('content-images')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName)

      // 상태 업데이트 (메인 이미지 배열이 있다면)
      const newMainImages = [...(content.main?.images || [])]
      
      // 기존 이미지가 있으면 삭제
      if (newMainImages[index] && newMainImages[index].includes('supabase')) {
        const oldFileName = newMainImages[index].split('/').pop()
        await supabase.storage
          .from('content-images')
          .remove([`main/${oldFileName}`])
      }
      
      newMainImages[index] = publicUrl
      setContent(prev => ({
        ...prev,
        main: { ...prev.main, images: newMainImages }
      }))

      console.log(`메인 이미지 ${index + 1} 업로드 완료:`, publicUrl)

    } catch (error) {
      console.error('메인 이미지 업로드 실패:', error)
      alert(`이미지 업로드에 실패했습니다: ${error.message}`)
    }
  }

  // 이미지 삭제 함수
  const handleImageDelete = async (imageUrl, index, section = 'about') => {
    try {
      if (imageUrl && imageUrl.includes('supabase')) {
        // 파일명 추출
        const fileName = imageUrl.split('/').pop()
        const folderName = section === 'about' ? 'about' : 'gallery'
        
        // Storage에서 삭제
        const { error } = await supabase.storage
          .from('content-images')
          .remove([`${folderName}/${fileName}`])

        if (error) {
          console.error('Storage 삭제 오류:', error)
        }
      }

      // 상태에서 제거
      if (section === 'about') {
        const newImages = [...(content.about.images || ['', '', ''])]
        newImages[index] = ''
        setContent(prev => ({
          ...prev,
          about: { ...prev.about, images: newImages }
        }))
      }

      console.log('이미지 삭제 완료')

    } catch (error) {
      console.error('이미지 삭제 실패:', error)
    }
  }

  // 콘텐츠 저장
  const handleSave = async () => {
    setIsLoading(true)
    setSavedSection('')

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section: activeTab, data: content[activeTab] })
      })

      const result = await response.json()

      if (result.success) {
        setSavedSection(activeTab)
        alert(`${getTabDisplayName(activeTab)} 콘텐츠가 저장되었습니다.`)
        setTimeout(() => setSavedSection(''), 3000)
      } else {
        alert(result.message || '저장에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('콘텐츠 저장 실패:', error)
      alert('콘텐츠 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const getTabDisplayName = (tab) => {
    const names = {
      about: '소개',
      gallery: '갤러리',
      location: '오시는길'
    }
    return names[tab] || tab
  }

  const tabs = [
    { id: 'about', name: '소개', icon: '' },
    { id: 'gallery', name: '갤러리', icon: '' },
    { id: 'location', name: '오시는길', icon: '' }
  ]

  return (
    <AdminLayout>
      <div className="p-2 sm:p-4 md:p-6 lg:p-4 xl:p-6">
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-5 xl:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl font-bold text-gray-900">목포플레이파크 관리</h1>
        </div>

        {/* 탭 메뉴 - 4단계 반응형 */}
        <div className="bg-white rounded-lg shadow border mb-4 sm:mb-5 md:mb-6 lg:mb-5 xl:mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 sm:space-x-6 md:space-x-8 lg:space-x-6 xl:space-x-8 px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5 px-1 border-b-2 font-medium text-xs sm:text-sm md:text-base lg:text-sm xl:text-base transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                  {savedSection === tab.id && (
                    <span className="ml-1 sm:ml-2 text-green-600 text-xs">✓ 저장됨</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6">
            {/* 목포플레이파크 페이지 콘텐츠 */}
            {activeTab === 'about' && (
              <div className="space-y-6 sm:space-y-7 md:space-y-8 lg:space-y-7 xl:space-y-8">
                {/* 메인 제목 */}
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">메인 제목</label>
                  <input
                    type="text"
                    value={content.about?.title || ''}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      about: { ...prev.about, title: e.target.value }
                    }))}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
            
                {/* 이미지, 부제목, 설명문 세트들 - 반응형 그리드 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-5 xl:gap-6">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="bg-gray-50 p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 rounded-lg space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                      <h3 className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg font-medium text-gray-900 text-center">{index + 1}번째 콘텐츠</h3>
                      
                      {/* 이미지 업로드 */}
                      <div>
                        <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">{index + 1}번째 이미지</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-3 md:p-4 lg:p-3 xl:p-4 text-center">
                          {content.about?.images && content.about?.images[index] ? (
                            <div className="relative">
                              <img 
                                src={content.about.images[index]} 
                                alt={`소개 이미지 ${index + 1}`}
                                className="w-full h-24 sm:h-28 md:h-32 lg:h-28 xl:h-32 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => handleImageDelete(content.about.images[index], index, 'about')}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="w-full h-24 sm:h-28 md:h-32 lg:h-28 xl:h-32 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">이미지 {index + 1}</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="mt-1.5 sm:mt-2 md:mt-3 lg:mt-2 xl:mt-3 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-500 file:mr-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                              />
                            </div>
                          )}
                        </div>
                      </div>
            
                      {/* 부제목 */}
                      <div>
                        <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">{index + 1}번째 부제목</label>
                        <textarea
                          value={content.about?.[`subtitle${index + 1}`] || ''}
                          onChange={(e) => setContent(prev => ({
                            ...prev,
                            about: { ...prev.about, [`subtitle${index + 1}`]: e.target.value }
                          }))}
                          rows={2}
                          className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
                          placeholder={
                            index === 0 ? "전남 최초의 실내 모험 스포츠 테마파크" :
                            index === 1 ? "13종의 모험스포츠 어트랙션" :
                            "남녀노소 즐기는 스릴과 넘치는 도전"
                          }
                        />
                      </div>
            
                      {/* 설명문 */}
                      <div>
                        <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">{index + 1}번째 설명문</label>
                        <textarea
                          value={content.about?.[`description${index + 1}`] || ''}
                          onChange={(e) => setContent(prev => ({
                            ...prev,
                            about: { ...prev.about, [`description${index + 1}`]: e.target.value }
                          }))}
                          rows={6}
                          className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
                          placeholder={
                            index === 0 ? "스포츠클라이밍, 서바이벌 체험을 위한 최고의 모험 스포츠를 즐기며..." :
                            index === 1 ? "총 13종류의 모험스포츠 체험이 내일 아침 가능한 아드레날린 스포츠를 위한..." :
                            "놀이 아임의 새로운 경험 스포츠 이상의 무시의! 무시의 정점을..."
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 갤러리 페이지 콘텐츠 */}
            {activeTab === 'gallery' && (
              <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-5 xl:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">페이지 제목</label>
                  <input
                    type="text"
                    value={content.gallery?.title || ''}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      gallery: { ...prev.gallery, title: e.target.value }
                    }))}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">설명</label>
                  <textarea
                    value={content.gallery?.description || ''}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      gallery: { ...prev.gallery, description: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* 갤러리 이미지 관리 */}
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 md:mb-5 lg:mb-4 xl:mb-5 space-y-2 sm:space-y-0">
                    <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700">갤러리 이미지</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...(content.gallery?.images || [])]
                        newImages.push({ url: '', title: '', description: '' })
                        setContent(prev => ({
                          ...prev,
                          gallery: { ...prev.gallery, images: newImages }
                        }))
                      }}
                      className="px-3 sm:px-4 md:px-5 lg:px-4 xl:px-5 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-orange-500 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-orange-600 transition"
                    >
                      + 이미지 추가
                    </button>
                  </div>

                  {/* 이미지 그리드 - 반응형 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-4 xl:gap-5">
                    {(content.gallery?.images || []).map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5">
                        <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-3 xl:space-y-4">
                          {/* 이미지 미리보기/업로드 */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-2 xl:p-3 text-center">
                            {image?.url ? (
                              <div className="relative">
                                <img 
                                  src={image.url} 
                                  alt={image.title || `이미지 ${index + 1}`}
                                  className="w-full h-24 sm:h-28 md:h-32 lg:h-28 xl:h-32 object-cover rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newImages = [...(content.gallery?.images || [])]
                                    newImages[index] = { ...newImages[index], url: '' }
                                    setContent(prev => ({
                                      ...prev,
                                      gallery: { ...prev.gallery, images: newImages }
                                    }))
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="w-full h-24 sm:h-28 md:h-32 lg:h-28 xl:h-32 bg-gray-100 rounded flex items-center justify-center">
                                  <span className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">이미지 {index + 1}</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleGalleryImageUpload(e, index)}
                                  className="mt-1.5 sm:mt-2 md:mt-3 lg:mt-2 xl:mt-3 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-500 file:mr-1 sm:file:mr-2 file:py-1 file:px-1 sm:file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                />
                              </div>
                            )}
                          </div>

                          {/* 이미지 제목 */}
                          <input
                            type="text"
                            placeholder="이미지 제목"
                            value={image?.title || ''}
                            onChange={(e) => {
                              const newImages = [...(content.gallery?.images || [])]
                              newImages[index] = { ...newImages[index], title: e.target.value }
                              setContent(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, images: newImages }
                              }))
                            }}
                            className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1 sm:py-1.5 md:py-2 lg:py-1.5 xl:py-2 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          />

                          {/* 이미지 설명 */}
                          <textarea
                            placeholder="이미지 설명"
                            value={image?.description || ''}
                            onChange={(e) => {
                              const newImages = [...(content.gallery?.images || [])]
                              newImages[index] = { ...newImages[index], description: e.target.value }
                              setContent(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, images: newImages }
                              }))
                            }}
                            rows={2}
                            className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1 sm:py-1.5 md:py-2 lg:py-1.5 xl:py-2 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          />

                          {/* 삭제 버튼 */}
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = (content.gallery?.images || []).filter((_, i) => i !== index)
                              setContent(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, images: newImages }
                              }))
                            }}
                            className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1 sm:py-1.5 md:py-2 lg:py-1.5 xl:py-2 bg-red-100 text-red-700 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded hover:bg-red-200 transition"
                          >
                            이미지 삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(content.gallery?.images || []).length === 0 && (
                    <div className="text-center py-6 sm:py-8 md:py-10 lg:py-8 xl:py-12 text-gray-500">
                      <p className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg">등록된 이미지가 없습니다.</p>
                      <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">위의 "이미지 추가" 버튼을 클릭해서 이미지를 추가해보세요.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 오시는길 페이지 콘텐츠 */}
            {activeTab === 'location' && (
              <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-5 xl:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">페이지 제목</label>
                  <input
                    type="text"
                    value={content.location?.title || '오시는길'}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      location: { ...prev.location, title: e.target.value }
                    }))}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">주소</label>
                  <input
                    type="text"
                    value={content.location?.address || ''}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value }
                    }))}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* 자가용 이용 안내 */}
                <div className="bg-gray-50 p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 md:mb-4 lg:mb-3 xl:mb-4 text-sm sm:text-base md:text-lg lg:text-base xl:text-lg">자가용으로 오시는 길</h4>
                  
                  <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-3 xl:space-y-4">
                    {(content.location.driving?.routes || []).map((route, index) => (
                      <div key={index}>
                        <input
                          type="text"
                          value={route}
                          onChange={(e) => {
                            const newRoutes = [...(content.location.driving?.routes || [])]
                            newRoutes[index] = e.target.value
                            setContent(prev => ({
                              ...prev,
                              location: {
                                ...prev.location,
                                driving: {
                                  ...prev.location.driving,
                                  routes: newRoutes
                                }
                              }
                            }))
                          }}
                          className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          placeholder="경로를 입력하세요"
                        />
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newRoutes = [...(content.location.driving?.routes || []), '']
                        setContent(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            driving: {
                              ...prev.location.driving,
                              routes: newRoutes
                            }
                          }
                        }))
                      }}
                      className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-orange-600 hover:text-orange-700"
                    >
                      + 경로 추가
                    </button>
                  </div>

                  <div className="mt-3 sm:mt-4 md:mt-5 lg:mt-4 xl:mt-5">
                    <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">네비게이션 검색</label>
                    <input
                      type="text"
                      value={content.location.driving?.navigation || ''}
                      onChange={(e) => setContent(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          driving: {
                            ...prev.location.driving,
                            navigation: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 대중교통 이용 안내 */}
                <div className="bg-gray-50 p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 md:mb-4 lg:mb-3 xl:mb-4 text-sm sm:text-base md:text-lg lg:text-base xl:text-lg">대중교통으로 오시는 길</h4>
                  
                  <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-3 xl:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5 xl:mb-2">기차 이용 시</label>
                      <textarea
                        value={content.location.publicTransport?.train || ''}
                        onChange={(e) => setContent(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            publicTransport: {
                              ...prev.location.publicTransport,
                              train: e.target.value
                            }
                          }
                        }))}
                        rows={2}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5 xl:mb-2">시외버스 이용 시</label>
                      <textarea
                        value={content.location.publicTransport?.bus || ''}
                        onChange={(e) => setContent(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            publicTransport: {
                              ...prev.location.publicTransport,
                              bus: e.target.value
                            }
                          }
                        }))}
                        rows={2}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5 xl:mb-2">택시 이용 시</label>
                      <input
                        type="text"
                        value={content.location.publicTransport?.taxi || ''}
                        onChange={(e) => setContent(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            publicTransport: {
                              ...prev.location.publicTransport,
                              taxi: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 저장 버튼 - 4단계 반응형 */}
            <div className="flex justify-end mt-6 sm:mt-7 md:mt-8 lg:mt-7 xl:mt-8 pt-4 sm:pt-5 md:pt-6 lg:pt-5 xl:pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 sm:px-5 md:px-6 lg:px-5 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-orange-600 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition"
                style={{ backgroundColor: isLoading ? '#d1d5db' : '#ea580c' }}
              >
                {isLoading ? '저장 중...' : `${getTabDisplayName(activeTab)} 콘텐츠 저장`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}