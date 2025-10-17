'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/admin-layout'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Notice {
  id: number
  title: string
  content: string
  author: string
  date: string
  important: boolean
}

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
}

interface Event {
  id: number
  title: string
  description: string
  startDate: string
  endDate: string
  status: 'ongoing' | 'upcoming' | 'ended'
}

export default function AdminCommunityPage() {
  const [activeTab, setActiveTab] = useState<'notices' | 'faqs' | 'events'>('notices')
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // 데이터 상태
  const [notices, setNotices] = useState<Notice[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [events, setEvents] = useState<Event[]>([])

  // 폼 데이터
  const [formData, setFormData] = useState<any>({})

  // 초기 데이터 로드
  useEffect(() => {
    loadCommunityData()
  }, [])

  // API에서 커뮤니티 데이터 로드
  const loadCommunityData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/community')
      const result = await response.json()

      if (result.success) {
        setNotices(result.data.notices || [])
        setFaqs(result.data.faqs || [])
        setEvents(result.data.events || [])
      } else {
        alert('데이터를 불러오는데 실패했습니다: ' + result.message)
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 새 항목 추가
  const handleAdd = () => {
    setEditingItem(null)
    setFormData({})
    setShowForm(true)
  }

  // 항목 수정
  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData(item)
    setShowForm(true)
  }

  // 항목 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/community?type=${activeTab}&id=${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 로컬 상태에서도 제거
        if (activeTab === 'notices') {
          setNotices(prev => prev.filter(item => item.id !== id))
        } else if (activeTab === 'faqs') {
          setFaqs(prev => prev.filter(item => item.id !== id))
        } else if (activeTab === 'events') {
          setEvents(prev => prev.filter(item => item.id !== id))
        }
        alert('삭제되었습니다.')
      } else {
        alert('삭제 실패: ' + result.message)
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 폼 저장
  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem 
        ? { type: activeTab, id: editingItem.id, data: formData }
        : { type: activeTab, data: formData }

      const response = await fetch('/api/admin/community', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        // 로컬 상태 업데이트
        if (activeTab === 'notices') {
          if (editingItem) {
            setNotices(prev => prev.map(item => 
              item.id === editingItem.id ? {
                ...result.data,
                date: new Date(result.data.created_at).toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1)
              } : item
            ))
          } else {
            const newNotice = {
              ...result.data,
              date: new Date(result.data.created_at).toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1)
            }
            setNotices(prev => [...prev, newNotice])
          }
        } else if (activeTab === 'faqs') {
          if (editingItem) {
            setFaqs(prev => prev.map(item => 
              item.id === editingItem.id ? result.data : item
            ))
          } else {
            setFaqs(prev => [...prev, result.data])
          }
        } else if (activeTab === 'events') {
          if (editingItem) {
            setEvents(prev => prev.map(item => 
              item.id === editingItem.id ? {
                ...result.data,
                startDate: result.data.start_date,
                endDate: result.data.end_date
              } : item
            ))
          } else {
            const newEvent = {
              ...result.data,
              startDate: result.data.start_date,
              endDate: result.data.end_date
            }
            setEvents(prev => [...prev, newEvent])
          }
        }

        setShowForm(false)
        setFormData({})
        setEditingItem(null)
        alert(editingItem ? '수정되었습니다.' : '추가되었습니다.')
      } else {
        alert('저장 실패: ' + result.message)
      }
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 중요 공지 토글 (공지사항만)
  const handleToggleImportant = async (notice: Notice) => {
    try {
      const updatedData = { ...notice, important: !notice.important }
      
      const response = await fetch('/api/admin/community', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notices',
          id: notice.id,
          data: updatedData
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setNotices(prev => prev.map(item => 
          item.id === notice.id 
            ? { ...item, important: !item.important }
            : item
        ))
      } else {
        alert('중요도 변경 실패: ' + result.message)
      }
    } catch (error) {
      console.error('중요도 변경 실패:', error)
      alert('중요도 변경 중 오류가 발생했습니다.')
    }
  }

  return (
    <AdminLayout>
      {/* 반응형 헤더 */}
      <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
            커뮤니티 관리
          </h1>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center px-3 sm:px-4 md:px-5 lg:px-4 xl:px-5 py-2 sm:py-2.5 md:py-3 lg:py-2 xl:py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm sm:text-base md:text-lg lg:text-base xl:text-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">새 항목 추가</span>
            <span className="sm:hidden">추가</span>
          </button>
        </div>

        {/* 반응형 탭 메뉴 */}
        <div className="flex space-x-1 mb-4 sm:mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('notices')}
            className={`flex-shrink-0 px-3 sm:px-4 md:px-5 lg:px-4 xl:px-5 py-2 sm:py-2.5 md:py-3 lg:py-2 xl:py-2.5 rounded-md font-medium transition-colors text-sm sm:text-base md:text-lg lg:text-base xl:text-lg whitespace-nowrap ${
              activeTab === 'notices'
                ? 'bg-white text-orange-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            공지사항
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`flex-shrink-0 px-3 sm:px-4 md:px-5 lg:px-4 xl:px-5 py-2 sm:py-2.5 md:py-3 lg:py-2 xl:py-2.5 rounded-md font-medium transition-colors text-sm sm:text-base md:text-lg lg:text-base xl:text-lg whitespace-nowrap ${
              activeTab === 'faqs'
                ? 'bg-white text-orange-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            자주하는 질문
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-shrink-0 px-3 sm:px-4 md:px-5 lg:px-4 xl:px-5 py-2 sm:py-2.5 md:py-3 lg:py-2 xl:py-2.5 rounded-md font-medium transition-colors text-sm sm:text-base md:text-lg lg:text-base xl:text-lg whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-white text-orange-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            이벤트
          </button>
        </div>

        {/* 반응형 폼 모달 */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md xl:max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-5 md:p-6 lg:p-5 xl:p-6">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-bold mb-3 sm:mb-4 md:mb-5 lg:mb-4 xl:mb-5">
                  {editingItem ? '수정' : '새 항목 추가'} - {
                    activeTab === 'notices' ? '공지사항' :
                    activeTab === 'faqs' ? 'FAQ' : '이벤트'
                  }
                </h3>

                {/* 공지사항 폼 */}
                {activeTab === 'notices' && (
                  <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">제목</label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg"
                        placeholder="공지사항 제목을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">내용</label>
                      <textarea
                        value={formData.content || ''}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        rows={3}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg resize-none"
                        placeholder="공지사항 내용을 입력하세요"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.important || false}
                        onChange={(e) => setFormData({...formData, important: e.target.checked})}
                        className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <label className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">중요 공지사항</label>
                    </div>
                  </div>
                )}

                {/* FAQ 폼 */}
                {activeTab === 'faqs' && (
                  <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">질문</label>
                      <input
                        type="text"
                        value={formData.question || ''}
                        onChange={(e) => setFormData({...formData, question: e.target.value})}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg"
                        placeholder="질문을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">답변</label>
                      <textarea
                        value={formData.answer || ''}
                        onChange={(e) => setFormData({...formData, answer: e.target.value})}
                        rows={3}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg resize-none"
                        placeholder="답변을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">카테고리</label>
                      <select
                        value={formData.category || ''}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg"
                      >
                        <option value="">카테고리 선택</option>
                        <option value="회원">회원</option>
                        <option value="예약">예약</option>
                        <option value="시설">시설</option>
                        <option value="이용">이용</option>
                        <option value="할인">할인</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 이벤트 폼 */}
                {activeTab === 'events' && (
                  <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">제목</label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg"
                        placeholder="이벤트 제목을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">설명</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg resize-none"
                        placeholder="이벤트 설명을 입력하세요"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">시작일</label>
                        <input
                          type="date"
                          value={formData.startDate || ''}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">종료일</label>
                        <input
                          type="date"
                          value={formData.endDate || ''}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium mb-1 sm:mb-2">상태</label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md text-sm sm:text-base md:text-lg lg:text-base xl:text-lg"
                      >
                        <option value="">상태 선택</option>
                        <option value="upcoming">예정</option>
                        <option value="ongoing">진행중</option>
                        <option value="ended">종료</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-6">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm sm:text-base transition-colors"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm sm:text-base transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 공지사항 목록 - 반응형 */}
        {activeTab === 'notices' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5 border-b">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-medium">공지사항 목록</h3>
            </div>
            <div className="divide-y">
              {notices
                .sort((a, b) => {
                  if (a.important && !b.important) return -1
                  if (!a.important && b.important) return 1
                  return b.id - a.id
                })
                .map((notice) => (
                <div key={notice.id} className={`px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5 ${
                  notice.important ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {notice.important && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">중요</span>
                        )}
                        <h4 className={`font-medium text-sm sm:text-base md:text-lg lg:text-base xl:text-lg break-words ${notice.important ? 'font-bold text-gray-900' : ''}`}>
                          {notice.title}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600 mb-1 break-words">{notice.content}</p>
                      <p className="text-xs text-gray-500">{notice.date} | {notice.author}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                      <button
                        onClick={() => handleToggleImportant(notice)}
                        className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                          notice.important 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={notice.important ? '중요 공지 해제' : '중요 공지로 설정'}
                        disabled={isLoading}
                      >
                        {notice.important ? '★ 중요' : '☆ 일반'}
                      </button>
                      
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(notice)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="수정"
                        >
                          <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="삭제"
                        >
                          <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ 목록 - 반응형 */}
        {activeTab === 'faqs' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5 border-b">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-medium">FAQ 목록</h3>
            </div>
            <div className="divide-y">
              {faqs.map((faq) => (
                <div key={faq.id} className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">{faq.category}</span>
                        <h4 className="font-medium text-sm sm:text-base md:text-lg lg:text-base xl:text-lg break-words">{faq.question}</h4>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600 break-words">{faq.answer}</p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 sm:ml-4">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이벤트 목록 - 반응형 */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5 border-b">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-medium">이벤트 목록</h3>
            </div>
            <div className="divide-y">
              {events.map((event) => (
                <div key={event.id} className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs text-white ${
                          event.status === 'ongoing' ? 'bg-green-500' :
                          event.status === 'upcoming' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                          {event.status === 'ongoing' ? '진행중' :
                           event.status === 'upcoming' ? '예정' : '종료'}
                        </span>
                        <h4 className="font-medium text-sm sm:text-base md:text-lg lg:text-base xl:text-lg break-words">{event.title}</h4>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600 mb-1 break-words">{event.description}</p>
                      <p className="text-xs text-gray-500">{event.startDate} ~ {event.endDate}</p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 sm:ml-4">
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}