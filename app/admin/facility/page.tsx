'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
// AdminLayout import 수정
import { AdminLayout } from '../../../components/admin/admin-layout'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

function FacilityManagementPage() {
  const [activeTab, setActiveTab] = useState('easy')
  const [isLoading, setIsLoading] = useState(false)
  const [savedSection, setSavedSection] = useState('')
  const [facilities, setFacilities] = useState({})

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    loadFacilityData()
  }, [])

  // 시설 데이터 불러오기
  const loadFacilityData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/facility')
      const result = await response.json()

      if (result.success) {
        setFacilities(result.data || getDefaultFacilities())
      } else {
        console.error('시설 데이터 로드 실패:', result.message)
        setFacilities(getDefaultFacilities())
      }
    } catch (error) {
      console.error('시설 데이터 로드 중 오류:', error)
      setFacilities(getDefaultFacilities())
    } finally {
      setIsLoading(false)
    }
  }

  // 기본 시설 데이터
  const getDefaultFacilities = () => ({
    easy: {
      title: '이지코스',
      subtitle: '남녀노소 누구나 즐길 수 있는 신나는 모험의 시작되는 이지코스',
      items: [
        {
          id: 1,
          name: '멀티 트램폴린 1, 2',
          description: '어른도 아이도 모두 좋아하는 방방',
          requirements: [
            '필수 착용: 미끄럼방지 양말, 바지',
            '신장 제한: 최소 100cm 이상',
            '동시 체험 가능 인원: 6명'
          ],
          image: ''
        }
      ]
    },
    adventure: {
      title: '어드벤처코스',
      subtitle: '스릴 만점 모험의 정점을 찍는 어드벤처코스',
      items: [
        {
          id: 1,
          name: '스카이로프 (RCI)',
          description: '출렁이는 바닥, 흔들리는 내 마음\n아래가 한눈에 내려다보이는 높이에서 장애물을 건너는 스릴을 경험해보세요',
          requirements: [
            '필수 착용: 미끄럼방지 양말, 바지',
            '신장 제한: 최소 122cm 이상 최대 200cm 이하',
            '몸무게 제한: 최대 136kg 이하',
            '동시 체험 가능 인원: 30명'
          ],
          image: ''
        }
      ]
    },
    extreme: {
      title: '익스트림코스',
      subtitle: '짜릿한 익사이팅 어트랙션에서 극한의 즐거움을 느낄 수 있는 익스트림코스',
      items: [
        {
          id: 1,
          name: '점핑타워',
          description: '높은 타워에서 샌드백을 향해 점프!\n용기를 내서 샌드백을 향해 힘껏 뛰어보세요',
          requirements: [
            '필수 착용: 운동화, 바지, 헬멧, 하네스',
            '신장 제한: 최소 100cm 이상',
            '몸무게 제한: 최소 15kg 이상 최대 140kg 이하',
            '연령 제한: 5세 이상'
          ],
          image: ''
        }
      ]
    },
    amenities: {
      title: '편의시설',
      subtitle: '편안하고 안전한 시설 이용을 위한 다양한 편의시설',
      items: [
        {
          id: 1,
          name: '보관함',
          description: '소지품을 안전하게 보관할 수 있는 개인 사물함',
          requirements: [],
          image: ''
        }
      ]
    }
  })

  // 시설 저장
  const handleSave = async () => {
    setIsLoading(true)
    setSavedSection('')

    try {
      const response = await fetch('/api/admin/facility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section: activeTab, data: facilities[activeTab] })
      })

      const result = await response.json()

      if (result.success) {
        setSavedSection(activeTab)
        alert(`${getTabDisplayName(activeTab)} 시설 정보가 저장되었습니다.`)
        setTimeout(() => setSavedSection(''), 3000)
      } else {
        alert(result.message || '저장에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('시설 정보 저장 실패:', error)
      alert('시설 정보 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 새 시설 추가
  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      name: activeTab === 'amenities' ? '새 편의시설' : '새 시설',
      description: activeTab === 'amenities' ? '편의시설 설명을 입력하세요' : '시설 설명을 입력하세요',
      requirements: activeTab === 'amenities' ? [] : [],
	  floor: activeTab === 'amenities' ? '1F' : undefined,	
      image: ''
    }

    setFacilities(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        items: [...(prev[activeTab]?.items || []), newItem]
      }
    }))
  }

  // 시설 삭제
  const handleDeleteItem = async (itemIndex) => {
    if (!confirm('이 시설을 삭제하시겠습니까?')) return

    const currentFacility = facilities[activeTab]
    if (!currentFacility || !currentFacility.items) return

    const item = currentFacility.items[itemIndex]
    if (!item) return
    
    // 이미지가 있으면 삭제
    if (item.image && item.image.includes('supabase')) {
      try {
        await fetch(`/api/admin/facility?imageUrl=${encodeURIComponent(item.image)}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('이미지 삭제 실패:', error)
      }
    }

    setFacilities(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        items: (prev[activeTab]?.items || []).filter((_, index) => index !== itemIndex)
      }
    }))
  }
  
  const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.5) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        let { width, height } = img
        
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
        
        canvas.width = width
        canvas.height = height
        
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // 시설 이미지 업로드
  const handleImageUpload = async (event, itemIndex) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      console.log(`시설 이미지 업로드 시작...`)
      
      // ✅ 이 부분을 추가하세요!
      console.log('🖼️ 시설 이미지 최적화 시작...')
      const resizedFile = await resizeImage(file, 600, 400, 0.6) as Blob
      console.log('📊 원본:', Math.round(file.size / 1024), 'KB → 최적화:', Math.round((resizedFile as Blob).size / 1024), 'KB')

      
      const fileExt = file.name.split('.').pop()
      const fileName = `facility/${activeTab}_${itemIndex}_${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
          .from('content-images')
          .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName)

      // 기존 이미지 삭제
      const currentFacility = facilities[activeTab]
      if (currentFacility && currentFacility.items && currentFacility.items[itemIndex]) {
        const currentItem = currentFacility.items[itemIndex]
        if (currentItem.image && currentItem.image.includes('supabase')) {
          const oldFileName = currentItem.image.split('/').pop()
          await supabase.storage
            .from('content-images')
            .remove([`facility/${oldFileName}`])
        }
      }

      // 상태 업데이트
      setFacilities(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          items: (prev[activeTab]?.items || []).map((item, index) => 
            index === itemIndex ? { ...item, image: publicUrl } : item
          )
        }
      }))

      console.log(`시설 이미지 업로드 완료:`, publicUrl)

    } catch (error) {
      console.error('시설 이미지 업로드 실패:', error)
      alert(`이미지 업로드에 실패했습니다: ${error.message}`)
    }
  }

  const getTabDisplayName = (tab) => {
    const names = {
      easy: '이지코스',
      adventure: '어드벤처코스',
      extreme: '익스트림코스',
      amenities: '편의시설'
    }
    return names[tab] || tab
  }

  const tabs = [
    { id: 'easy', name: '이지코스' },
    { id: 'adventure', name: '어드벤처코스' },
    { id: 'extreme', name: '익스트림코스' },
    { id: 'amenities', name: '편의시설' }
  ]

  if (isLoading && Object.keys(facilities).length === 0) {
    return (
      <AdminLayout>
        <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-14 lg:h-14 xl:w-16 xl:h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-base xl:text-lg">시설 데이터를 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-2 sm:p-4 md:p-6 lg:p-4 xl:p-6">
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-5 xl:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl font-bold text-gray-900">시설 안내 관리</h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">웹사이트 시설 정보를 관리합니다</p>
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
            {/* 코스/시설 기본 정보 - 4단계 반응형 */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-5 xl:space-y-6 mb-6 sm:mb-7 md:mb-8 lg:mb-7 xl:mb-8">
              <div>
                <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">
                  {activeTab === 'amenities' ? '시설 카테고리' : '코스 제목'}
                </label>
                <input
                  type="text"
                  value={facilities[activeTab]?.title || ''}
                  onChange={(e) => setFacilities(prev => ({
                    ...prev,
                    [activeTab]: { ...prev[activeTab], title: e.target.value }
                  }))}
                  className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* 편의시설이 아닐 때만 설명 표시 */}
              {activeTab !== 'amenities' && (
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">코스 설명</label>
                  <textarea
                    value={facilities[activeTab]?.subtitle || ''}
                    onChange={(e) => setFacilities(prev => ({
                      ...prev,
                      [activeTab]: { ...prev[activeTab], subtitle: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* 시설 추가 버튼 - 4단계 반응형 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 md:mb-6 lg:mb-5 xl:mb-6 space-y-2 sm:space-y-0">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg font-semibold text-gray-900">
                {activeTab === 'amenities' ? '편의시설 목록' : '시설 목록'}
              </h3>
              <button
                onClick={handleAddItem}
                className="px-3 sm:px-4 md:px-5 lg:px-4 xl:px-5 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-xs sm:text-sm md:text-base lg:text-sm xl:text-base"
              >
                + {activeTab === 'amenities' ? '편의시설 추가' : '시설 추가'}
              </button>
            </div>

            {/* 시설 목록 - 4단계 반응형 */}
            <div className="space-y-6 sm:space-y-7 md:space-y-8 lg:space-y-7 xl:space-y-8">
              {/* 편의시설일 때 반응형 그리드 레이아웃 */}
              {activeTab === 'amenities' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-5 xl:gap-6">
                  {facilities[activeTab]?.items?.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 relative">
                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleDeleteItem(index)}
                        className="absolute top-1.5 sm:top-2 md:top-3 lg:top-2 xl:top-3 right-1.5 sm:right-2 md:right-3 lg:right-2 xl:right-3 text-red-500 hover:text-red-700 text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl z-10"
                        title="편의시설 삭제"
                      >
                        ×
                      </button>

                      <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                        {/* 이미지 */}
                        <div>
                          <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">편의시설 이미지</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-3 md:p-4 lg:p-3 xl:p-4 text-center">
                            {item.image ? (
                              <div className="relative">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-24 sm:h-28 md:h-32 lg:h-28 xl:h-32 object-cover rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFacilities(prev => ({
                                      ...prev,
                                      [activeTab]: {
                                        ...prev[activeTab],
                                        items: (prev[activeTab]?.items || []).map((it, idx) => 
                                          idx === index ? { ...it, image: '' } : it
                                        )
                                      }
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
                                  <span className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">이미지</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, index)}
                                  className="mt-1.5 sm:mt-2 md:mt-3 lg:mt-2 xl:mt-3 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-500 file:mr-1 sm:file:mr-2 file:py-1 file:px-1 sm:file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 편의시설명 */}
                        <div>
                          <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">편의시설명</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => setFacilities(prev => ({
                              ...prev,
                              [activeTab]: {
                                ...prev[activeTab],
                                items: (prev[activeTab]?.items || []).map((it, idx) => 
                                  idx === index ? { ...it, name: e.target.value } : it
                                )
                              }
                            }))}
                            className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
						  
						{/* 층 선택 - 새로 추가 */}
						<div>
						  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">층</label>
						  <select
						    value={item.floor || '1F'}
						    onChange={(e) => setFacilities(prev => ({
						      ...prev,
						      [activeTab]: {
						        ...prev[activeTab],
						        items: (prev[activeTab]?.items || []).map((it, idx) => 
						          idx === index ? { ...it, floor: e.target.value } : it
						        )
						      }
						    }))}
						    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
						  >
						    <option value="1F">1층</option>
						    <option value="2F">2층</option>
						  </select>
						</div>  

                        {/* 설명 */}
                        <div>
                          <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">설명</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => setFacilities(prev => ({
                              ...prev,
                              [activeTab]: {
                                ...prev[activeTab],
                                items: (prev[activeTab]?.items || []).map((it, idx) => 
                                  idx === index ? { ...it, description: e.target.value } : it
                                )
                              }
                            }))}
                            rows={3}
                            className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 기존 시설 목록 (이지/어드벤처/익스트림 코스용) - 4단계 반응형 */
                facilities[activeTab]?.items?.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 lg:p-5 xl:p-6 relative">
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDeleteItem(index)}
                      className="absolute top-3 sm:top-4 md:top-5 lg:top-4 xl:top-5 right-3 sm:right-4 md:right-5 lg:right-4 xl:right-5 text-red-500 hover:text-red-700 text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl"
                      title="시설 삭제"
                    >
                      ×
                    </button>

                    {/* 모바일/태블릿: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-5 xl:gap-6">
                      {/* 이미지 */}
                      <div>
                        <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">시설 이미지</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 text-center">
                          {item.image ? (
                            <div className="relative">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-32 sm:h-36 md:h-48 lg:h-40 xl:h-48 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFacilities(prev => ({
                                    ...prev,
                                    [activeTab]: {
                                      ...prev[activeTab],
                                      items: (prev[activeTab]?.items || []).map((it, idx) => 
                                        idx === index ? { ...it, image: '' } : it
                                      )
                                    }
                                  }))
                                }}
                                className="absolute top-1.5 sm:top-2 md:top-3 lg:top-2 xl:top-3 right-1.5 sm:right-2 md:right-3 lg:right-2 xl:right-3 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-6 lg:h-6 xl:w-7 xl:h-7 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="w-full h-32 sm:h-36 md:h-48 lg:h-40 xl:h-48 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">{item.name} 이미지</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="mt-2 sm:mt-3 md:mt-4 lg:mt-3 xl:mt-4 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-500 file:mr-2 sm:file:mr-3 md:file:mr-4 lg:file:mr-3 xl:file:mr-4 file:py-1 sm:file:py-1.5 md:file:py-2 lg:file:py-1.5 xl:file:py-2 file:px-2 sm:file:px-3 md:file:px-4 lg:file:px-3 xl:file:px-4 file:rounded file:border-0 file:text-xs sm:file:text-sm md:file:text-base lg:file:text-sm xl:file:text-base file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 정보 */}
                      <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                        <div>
                          <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">시설명</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => setFacilities(prev => ({
                              ...prev,
                              [activeTab]: {
                                ...prev[activeTab],
                                items: (prev[activeTab]?.items || []).map((it, idx) => 
                                  idx === index ? { ...it, name: e.target.value } : it
                                )
                              }
                            }))}
                            className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">설명</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => setFacilities(prev => ({
                              ...prev,
                              [activeTab]: {
                                ...prev[activeTab],
                                items: (prev[activeTab]?.items || []).map((it, idx) => 
                                  idx === index ? { ...it, description: e.target.value } : it
                                )
                              }
                            }))}
                            rows={3}
                            className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>

                        {/* 이용 제한사항 */}
                        <div>
                          <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">이용 제한사항</label>
                          {item.requirements?.map((req, reqIndex) => (
                            <div key={reqIndex} className="flex items-start space-x-2 mb-2">
                              <input
                                type="text"
                                value={req}
                                onChange={(e) => {
                                  const newReqs = [...(item.requirements || [])]
                                  newReqs[reqIndex] = e.target.value
                                  setFacilities(prev => ({
                                    ...prev,
                                    [activeTab]: {
                                      ...prev[activeTab],
                                      items: (prev[activeTab]?.items || []).map((it, idx) => 
                                        idx === index ? { ...it, requirements: newReqs } : it
                                      )
                                    }
                                  }))
                                }}
                                className="flex-1 px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newReqs = (item.requirements || []).filter((_, i) => i !== reqIndex)
                                  setFacilities(prev => ({
                                    ...prev,
                                    [activeTab]: {
                                      ...prev[activeTab],
                                      items: (prev[activeTab]?.items || []).map((it, idx) => 
                                        idx === index ? { ...it, requirements: newReqs } : it
                                      )
                                    }
                                  }))
                                }}
                                className="text-red-500 hover:text-red-700 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 px-2"
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newReqs = [...(item.requirements || []), '']
                              setFacilities(prev => ({
                                ...prev,
                                [activeTab]: {
                                  ...prev[activeTab],
                                  items: (prev[activeTab]?.items || []).map((it, idx) => 
                                    idx === index ? { ...it, requirements: newReqs } : it
                                  )
                                }
                              }))
                            }}
                            className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-orange-600 hover:text-orange-700"
                          >
                            + 제한사항 추가
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 저장 버튼 - 4단계 반응형 */}
            <div className="flex justify-end mt-6 sm:mt-7 md:mt-8 lg:mt-7 xl:mt-8 pt-4 sm:pt-5 md:pt-6 lg:pt-5 xl:pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 sm:px-5 md:px-6 lg:px-5 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-orange-600 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition"
              >
                {isLoading ? '저장 중...' : `${getTabDisplayName(activeTab)} 저장`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default FacilityManagementPage