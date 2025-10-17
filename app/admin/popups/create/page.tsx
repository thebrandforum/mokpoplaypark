'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { createClient } from '@supabase/supabase-js'
import { PhotoIcon } from '@heroicons/react/24/outline'

// Supabase 클라이언트 초기화
const supabase = createClient(
  'https://rplkcijqbksheqcnvjlf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
)

export default function CreatePopupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    show_title: true,
    show_content: true,
    show_image: true,
    start_date: '',
    end_date: '',
    position: 'center', // 고정값
    device_type: 'all', // 고정값
    is_active: true
  })

  // 이미지 업로드 처리
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 10MB 이하여야 합니다.')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      setUploadingImage(true)

      const formData = new FormData()
      formData.append('image', file)
      formData.append('type', 'popup')

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setFormData(prev => ({ ...prev, image_url: result.imageUrl }))
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

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.start_date || !formData.end_date) {
      alert('표시 기간을 설정해주세요.')
      return
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert('종료 날짜는 시작 날짜보다 늦어야 합니다.')
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('popups')
        .insert([{
          ...formData,
          start_date: formData.start_date + 'T00:00:00',
          end_date: formData.end_date + 'T23:59:59'
        }])
        .select()

      if (error) throw error

      alert('팝업이 성공적으로 생성되었습니다!')
      router.push('/admin/popups')

    } catch (error) {
      console.error('팝업 생성 실패:', error)
      alert('팝업 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">새 팝업 만들기</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이미지 업로드 */}
          <div className="bg-white shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">팝업 이미지</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_image: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">이미지 표시</span>
              </label>

              {formData.image_url ? (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="팝업 이미지"
                    className="max-w-md w-full border"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 text-sm hover:bg-red-600"
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 p-8 text-center hover:border-orange-500 transition-colors">
                    <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">클릭하여 이미지를 업로드하세요</p>
                    <p className="text-sm text-gray-500 mt-1">최대 10MB, JPG/PNG/GIF 형식</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              )}

              {uploadingImage && (
                <div className="text-center">
                  <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent animate-spin"></div>
                  <p className="text-sm text-gray-600 mt-2">업로드 중...</p>
                </div>
              )}
            </div>
          </div>

          {/* 텍스트 내용 */}
          <div className="bg-white shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">팝업 내용</h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.show_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_title: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">제목 표시</span>
                </label>
                <input
                  type="text"
                  placeholder="팝업 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.show_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_content: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">내용 표시</span>
                </label>
                <textarea
                  placeholder="팝업 내용을 입력하세요"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 표시 설정 */}
          <div className="bg-white shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">표시 설정</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 빠른 선택 버튼 */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  const tomorrow = new Date(today)
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  
                  setFormData(prev => ({
                    ...prev,
                    start_date: today.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0]
                  }))
                }}
                className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50"
              >
                하루
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  const nextWeek = new Date(today)
                  nextWeek.setDate(nextWeek.getDate() + 6)
                  
                  setFormData(prev => ({
                    ...prev,
                    start_date: today.toISOString().split('T')[0],
                    end_date: nextWeek.toISOString().split('T')[0]
                  }))
                }}
                className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50"
              >
                일주일
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  const nextMonth = new Date(today)
                  nextMonth.setMonth(nextMonth.getMonth() + 1)
                  
                  setFormData(prev => ({
                    ...prev,
                    start_date: today.toISOString().split('T')[0],
                    end_date: nextMonth.toISOString().split('T')[0]
                  }))
                }}
                className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50"
              >
                한달
              </button>
            </div>

            <label className="flex items-center mt-4">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">생성 후 바로 활성화</span>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/popups')}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:bg-gray-400"
            >
              {loading ? '저장 중...' : '팝업 생성'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}