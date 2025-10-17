'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '../../../components/admin/admin-layout'
import { PhotoIcon, PhoneIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function AdminHomepagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // 메인 이미지 상태
  const [mainImages, setMainImages] = useState([
    { id: 1, url: '/images/hero/main1.jpg', file: null }
  ])
  
  // 연락처 정보 상태
  const [contactInfo, setContactInfo] = useState({
    fieldPhone: '',      // 현장 문의
  })

  // 상담시간 정보 상태 (점심시간 제거)
  const [consultationHours, setConsultationHours] = useState({
    start: '',
    end: ''
  })

  // 초기 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 홈페이지 설정 로드
      const response = await fetch('/api/admin/homepage-settings')
      const result = await response.json()
      
      if (result.success && result.data) {
        // 이미지 데이터 설정
        if (result.data.mainImages) {
          setMainImages(result.data.mainImages)
        }
        
        // 연락처 정보 설정
        if (result.data.contactInfo) {
          setContactInfo(result.data.contactInfo)
        }

        // 상담시간 정보 설정
        if (result.data.consultationHours) {
          setConsultationHours(result.data.consultationHours)
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
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

  // 이미지 업로드 처리
  const handleImageUpload = async (event, index) => {
    const file = event.target.files[0]
    if (!file) return

    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 10MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      setUploadingImage(true)
    
      // 1️⃣ 먼저 이미지 리사이즈
      console.log('🖼️ 이미지 최적화 시작...')
      const resizedFile = await resizeImage(file, 1920, 1080, 0.9) as Blob
      console.log('📊 원본:', Math.round(file.size / 1024), 'KB → 최적화:', Math.round((resizedFile as Blob).size / 1024), 'KB')

    
      // 2️⃣ 그 다음 FormData 생성  
      const formData = new FormData()
      formData.append('image', resizedFile, file.name)  // ✅ 파일명 유지
      formData.append('type', 'hero')
      formData.append('index', index.toString())
    
      // 3️⃣ 서버에 업로드
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // 이미지 URL 업데이트
        const newImages = [...mainImages]
        newImages[index] = { 
          ...newImages[index], 
          url: result.imageUrl,
          file: file.name 
        }
        setMainImages(newImages)
        
        alert('이미지가 성공적으로 업로드되었습니다!')
      } else {
        alert(result.message || '이미지 업로드에 실패했습니다.')
      }

    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingImage(false)
    }
  }

  // 이미지 삭제 (목록에서 완전 제거)
  const handleImageDelete = (index) => {
    if (mainImages.length <= 1) {
      alert('최소 1개의 이미지는 필요합니다.')
      return
    }
    
    if (confirm('이미지를 삭제하시겠습니까?')) {
      const newImages = mainImages.filter((_, i) => i !== index)
      setMainImages(newImages)
    }
  }

  // 이미지 추가
  const handleAddImage = () => {
    if (mainImages.length >= 10) {
      alert('최대 10개까지 추가 가능합니다.')
      return
    }
    
    const newId = Math.max(...mainImages.map(img => img.id), 0) + 1
    setMainImages([...mainImages, { 
      id: newId, 
      url: '', 
      file: null 
    }])
  }

  // 전체 저장
  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/admin/homepage-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mainImages,
          contactInfo,
          consultationHours
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('설정이 성공적으로 저장되었습니다!')
      } else {
        alert(result.message || '저장에 실패했습니다.')
      }

    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">홈페이지 관리</h1>

        {/* 메인 슬라이더 이미지 관리 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <PhotoIcon className="w-5 h-5 mr-2 text-orange-500" />
            메인 슬라이더 이미지
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mainImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  {image.url ? (
                    <img 
                      src={image.url} 
                      alt={`메인 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* 호버 시 표시되는 버튼들 */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="bg-orange-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-600 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, index)}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? '업로드 중...' : '이미지 변경'}
                    </label>
                    
                    <button
                      onClick={() => handleImageDelete(index)}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                      title="삭제"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-2 text-center">
                  이미지 {index + 1}
                </p>
              </div>
            ))}
            
            {/* 이미지 추가 버튼 */}
            {mainImages.length < 10 && (
              <div 
                onClick={handleAddImage}
                className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl text-orange-500">+</span>
                  </div>
                  <p className="text-sm text-gray-600">이미지 추가</p>
                  <p className="text-xs text-gray-400 mt-1">최대 10개</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 연락처 정보 관리 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <PhoneIcon className="w-5 h-5 mr-2 text-blue-500" />
            연락처 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현장 문의
              </label>
              <input
                type="tel"
                value={contactInfo.fieldPhone}
                onChange={(e) => setContactInfo({ ...contactInfo, fieldPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="예: 061-123-4567"
              />
              <p className="text-xs text-gray-500 mt-1">
                홈페이지에 표시되는 현장 문의 전화번호입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 상담시간 정보 관리 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-green-500" />
            상담시간
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상담 시작 시간
              </label>
              <input
                type="time"
                value={consultationHours.start}
                onChange={(e) => setConsultationHours({ ...consultationHours, start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상담 종료 시간
              </label>
              <input
                type="time"
                value={consultationHours.end}
                onChange={(e) => setConsultationHours({ ...consultationHours, end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
              </p>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploadingImage}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}