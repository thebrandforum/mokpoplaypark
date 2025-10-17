'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { createClient } from '@supabase/supabase-js'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'

// Supabase 클라이언트 초기화
const supabase = createClient(
  'https://rplkcijqbksheqcnvjlf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
)

export default function AdminPopupsPage() {
  const router = useRouter()
  const [popups, setPopups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 팝업 목록 불러오기
  useEffect(() => {
    fetchPopups()
  }, [])

  const fetchPopups = async () => {
    try {
      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPopups(data || [])
    } catch (error) {
      console.error('팝업 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 팝업 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 팝업을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      alert('팝업이 삭제되었습니다.')
      fetchPopups()
    } catch (error) {
      console.error('팝업 삭제 실패:', error)
      alert('팝업 삭제에 실패했습니다.')
    }
  }

  // 활성화/비활성화 토글
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('popups')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchPopups()
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 상태 체크
  const getPopupStatus = (popup: any) => {
    const now = new Date()
    const start = new Date(popup.start_date)
    const end = new Date(popup.end_date)

    if (!popup.is_active) return '비활성'
    if (now < start) return '예약'
    if (now > end) return '종료'
    return '진행중'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">팝업 관리</h1>
          <button
            onClick={() => router.push('/admin/popups/create')}
            className="flex items-center px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            새 팝업 만들기
          </button>
        </div>

        {/* 팝업 목록 테이블 */}
        <div className="bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  팝업 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  표시 기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {popups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    등록된 팝업이 없습니다.
                  </td>
                </tr>
              ) : (
                popups.map((popup) => {
                  const status = getPopupStatus(popup)
                  return (
                    <tr key={popup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {popup.image_url && (
                            <img
                              src={popup.image_url}
                              alt={popup.title}
                              className="w-16 h-16 object-cover mr-4"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {popup.title || '제목 없음'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {popup.content ? popup.content.substring(0, 50) + '...' : '내용 없음'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{formatDate(popup.start_date)}</p>
                          <p className="text-gray-500">~ {formatDate(popup.end_date)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs ${
                            status === '진행중' ? 'bg-green-100 text-green-800' :
                            status === '예약' ? 'bg-blue-100 text-blue-800' :
                            status === '종료' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status}
                          </span>
                          <button
                            onClick={() => handleToggleActive(popup.id, popup.is_active)}
                            className={`text-xs ${
                              popup.is_active ? 'text-green-600' : 'text-gray-500'
                            } hover:underline`}
                          >
                            {popup.is_active ? '활성화됨' : '비활성화됨'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => window.open(`/?preview_popup=${popup.id}`, '_blank')}
                            className="p-2 text-gray-400 hover:text-gray-600"
                            title="미리보기"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/popups/edit/${popup.id}`)}
                            className="p-2 text-blue-400 hover:text-blue-600"
                            title="수정"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(popup.id)}
                            className="p-2 text-red-400 hover:text-red-600"
                            title="삭제"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}