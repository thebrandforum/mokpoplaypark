'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/admin-layout'

export default function UsageInfoManagementPage() {
  const [activeTab, setActiveTab] = useState('usage')
  const [isLoading, setIsLoading] = useState(false)
  const [savedSection, setSavedSection] = useState('')
  const [usageData, setUsageData] = useState({})

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    loadUsageData()
  }, [])

  // 이용안내 데이터 불러오기
  const loadUsageData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/usage-info')
      const result = await response.json()

      if (result.success) {
        setUsageData(result.data || getDefaultUsageData())
      } else {
        console.error('이용안내 데이터 로드 실패:', result.message)
        setUsageData(getDefaultUsageData())
      }
    } catch (error) {
      console.error('이용안내 데이터 로드 중 오류:', error)
      setUsageData(getDefaultUsageData())
    } finally {
      setIsLoading(false)
    }
  }

  // 기본 이용안내 데이터
  const getDefaultUsageData = () => ({
    usage: {
      title: '시설 이용 안내',
      sections: [
        {
          id: 1,
          title: '이용시간',
          content: {
            note: '시설 운영 시간은 목포 플레이파크 사정에 따라 변경될 수 있습니다.'
          }
        },
        {
          id: 2,
          title: '이용약관',
          content: [
            '홈페이지에서 예매한 이용권은 지정월에 한하여 유효하며, 지정월 이후에는 이용한 것으로 간주합니다.'
          ]
        },
        {
          id: 3,
          title: '고객센터',
          content: {
            phone: '000-000-0000',
            hours: '10:00~18:00',
            lunch: '12:00~13:00',
            weekday: '시설 및 이용안내, 결제 완료 확인, 은행계좌 입금 안내, 현금 영수증 발행, 취소 및 환불 안내',
            weekend: '시설 및 이용안내, 결제 완료 확인'
          }
        }
      ]
    },
    safety: {
      title: '이용안전수칙',
      sections: [
        {
          id: 1,
          title: '이용자 안전수칙',
          content: [
            '시설 이용 중에 안전장비의 착용은 의무이며, 개인소유의 장비는 사용할 수 없습니다.'
          ]
        },
        {
          id: 2,
          title: '이용자의 책임',
          content: [
            '모든 이용자는 안전수칙을 준수하고, 개인안전장비를 항상 착용해야 합니다.'
          ]
        }
      ]
    },
    restrictions: {
      title: '이용제한 및 유의사항',
      sections: [
        {
          id: 1,
          title: '이용시 유의사항',
          content: [
            '어트랙션당 1명만 이용해야 합니다.'
          ]
        },
        {
          id: 2,
          title: '이용제한 안내',
          content: [
            '만 70세 이상 이용불가'
          ]
        }
      ]
    }
  })

  // 저장
  const handleSave = async () => {
    setIsLoading(true)
    setSavedSection('')

    try {
      const response = await fetch('/api/admin/usage-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section: activeTab, data: usageData[activeTab] })
      })

      const result = await response.json()

      if (result.success) {
        setSavedSection(activeTab)
        alert(`${getTabDisplayName(activeTab)} 정보가 저장되었습니다.`)
        setTimeout(() => setSavedSection(''), 3000)
      } else {
        alert(result.message || '저장에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('이용안내 정보 저장 실패:', error)
      alert('이용안내 정보 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 섹션 추가
  const handleAddSection = () => {
    const newSection = {
      id: Date.now(),
      title: '새 섹션',
      content: ['새 항목을 추가하세요']
    }

    setUsageData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: [...(prev[activeTab]?.sections || []), newSection]
      }
    }))
  }

  // 섹션 삭제
  const handleDeleteSection = (sectionIndex) => {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return

    setUsageData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: (prev[activeTab]?.sections || []).filter((_, index) => index !== sectionIndex)
      }
    }))
  }

  // 항목 추가 (리스트 타입)
  const handleAddItem = (sectionIndex) => {
    setUsageData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: (prev[activeTab]?.sections || []).map((section, index) => 
          index === sectionIndex ? {
            ...section,
            content: Array.isArray(section.content) 
              ? [...section.content, '새 항목']
              : section.content
          } : section
        )
      }
    }))
  }

  // 항목 수정 (리스트 타입)
  const handleUpdateItem = (sectionIndex, itemIndex, newValue) => {
    setUsageData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: (prev[activeTab]?.sections || []).map((section, index) => 
          index === sectionIndex ? {
            ...section,
            content: Array.isArray(section.content) 
              ? section.content.map((item, idx) => 
                  idx === itemIndex ? newValue : item
                )
              : section.content
          } : section
        )
      }
    }))
  }

  // 항목 삭제 (리스트 타입)
  const handleDeleteItem = (sectionIndex, itemIndex) => {
    setUsageData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: (prev[activeTab]?.sections || []).map((section, index) => 
          index === sectionIndex ? {
            ...section,
            content: Array.isArray(section.content) 
              ? section.content.filter((_, idx) => idx !== itemIndex)
              : section.content
          } : section
        )
      }
    }))
  }

  // 테이블 행 추가 (테이블 타입)
  const handleAddTableRow = (sectionIndex) => {
    setUsageData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: (prev[activeTab]?.sections || []).map((section, index) => 
          index === sectionIndex ? {
            ...section,
            content: {
              ...section.content,
              rows: [...(section.content?.rows || []), ['새 항목', '새 항목', '새 항목']]
            }
          } : section
        )
      }
    }))
  }

  // 테이블 행 삭제 (테이블 타입)
  const handleDeleteTableRow = (sectionIndex, rowIndex) => {
    setUsageData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: (prev[activeTab]?.sections || []).map((section, index) => 
          index === sectionIndex ? {
            ...section,
            content: {
              ...section.content,
              rows: (section.content?.rows || []).filter((_, idx) => idx !== rowIndex)
            }
          } : section
        )
      }
    }))
  }

  const getTabDisplayName = (tab) => {
    const names = {
      usage: '시설이용안내',
      safety: '이용안전수칙',
      restrictions: '이용제한 및 유의사항'
    }
    return names[tab] || tab
  }

  const tabs = [
    { id: 'usage', name: '시설이용안내' },
    { id: 'safety', name: '이용안전수칙' },
    { id: 'restrictions', name: '이용제한 및 유의사항' }
  ]

  if (isLoading && Object.keys(usageData).length === 0) {
    return (
      <AdminLayout>
        <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-14 lg:h-14 xl:w-16 xl:h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-base xl:text-lg">이용안내 데이터를 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-2 sm:p-4 md:p-6 lg:p-4 xl:p-6">
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-5 xl:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl font-bold text-gray-900">이용안내 관리</h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base">시설이용안내, 이용안전수칙, 이용제한 및 유의사항을 관리합니다</p>
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
            {/* 페이지 기본 정보 - 4단계 반응형 */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-5 xl:space-y-6 mb-6 sm:mb-7 md:mb-8 lg:mb-7 xl:mb-8">
              <div>
                <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">페이지 제목</label>
                <input
                  type="text"
                  value={usageData[activeTab]?.title || ''}
                  onChange={(e) => setUsageData(prev => ({
                    ...prev,
                    [activeTab]: { ...prev[activeTab], title: e.target.value }
                  }))}
                  className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 섹션 추가 버튼 - 4단계 반응형 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 md:mb-6 lg:mb-5 xl:mb-6 space-y-2 sm:space-y-0">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg font-semibold text-gray-900">섹션 목록</h3>
              <button
                onClick={handleAddSection}
                className="px-3 sm:px-4 md:px-5 lg:px-4 xl:px-5 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-xs sm:text-sm md:text-base lg:text-sm xl:text-base"
              >
                + 섹션 추가
              </button>
            </div>

            {/* 섹션 목록 - 4단계 반응형 */}
            <div className="space-y-6 sm:space-y-7 md:space-y-8 lg:space-y-7 xl:space-y-8">
              {usageData[activeTab]?.sections?.map((section, sectionIndex) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 lg:p-5 xl:p-6 relative">
                  {/* 섹션 삭제 버튼 */}
                  <button
                    onClick={() => handleDeleteSection(sectionIndex)}
                    className="absolute top-3 sm:top-4 md:top-5 lg:top-4 xl:top-5 right-3 sm:right-4 md:right-5 lg:right-4 xl:right-5 text-red-500 hover:text-red-700 text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl"
                    title="섹션 삭제"
                  >
                    ×
                  </button>

                  <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                    {/* 섹션 기본 정보 */}
                    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                      <div>
                        <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">섹션 제목</label>
                        <textarea
                          value={section.title}
                          onChange={(e) => setUsageData(prev => ({
                            ...prev,
                            [activeTab]: {
                              ...prev[activeTab],
                              sections: (prev[activeTab]?.sections || []).map((s, idx) => 
                                idx === sectionIndex ? { ...s, title: e.target.value } : s
                              )
                            }
                          }))}
                          rows={2}
                          className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[3.5rem] lg:min-h-[3rem] xl:min-h-[3.5rem]"
                          placeholder="섹션 제목을 입력하세요"
                          style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        />
                      </div>

                      {/* 콘텐츠 섹션 */}
                      <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 md:mb-5 lg:mb-4 xl:mb-5 space-y-2 sm:space-y-0">
                          <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700">콘텐츠</label>
                          
                          {/* 이용시간 섹션이 아니고 고객센터 섹션이 아닐 때만 항목 추가 버튼 표시 */}
                          {section.title !== '이용시간' && section.title !== '고객센터' && (
                            <button
                              onClick={() => handleAddItem(sectionIndex)}
                              className="px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1 sm:py-1.5 md:py-2 lg:py-1.5 xl:py-2 bg-blue-600 text-white rounded text-xs sm:text-sm md:text-base lg:text-sm xl:text-base hover:bg-blue-700 transition"
                            >
                              + 항목 추가
                            </button>
                          )}
                        </div>

                        {/* 이용시간 섹션 - 특별 처리 */}
                        {(section.title === '이용시간' || (section.content && typeof section.content === 'object' && !Array.isArray(section.content) && 'note' in section.content)) && (
                          <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                            <div className="p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 bg-gray-50 rounded-lg">
                              <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600 mb-1.5 sm:mb-2">
                                ⚠️ 휴관일, 운영시간, 입장마감시간은 <strong>관리자 &gt; 설정 &gt; 운영설정</strong>에서 관리됩니다.
                              </p>
                            </div>
                            
                            <div>
                              <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">참고사항</label>
                              <textarea
                                value={section.content?.note || ''}
                                onChange={(e) => setUsageData(prev => ({
                                  ...prev,
                                  [activeTab]: {
                                    ...prev[activeTab],
                                    sections: (prev[activeTab]?.sections || []).map((s, idx) => 
                                      idx === sectionIndex ? { 
                                        ...s, 
                                        content: { 
                                          ...(typeof s.content === 'object' && s.content !== null ? s.content : {}), 
                                          note: e.target.value 
                                        } 
                                      } : s
                                    )
                                  }
                                }))}
                                rows={3}
                                className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical min-h-[4rem] sm:min-h-[4.5rem] md:min-h-[5rem] lg:min-h-[4.5rem] xl:min-h-[5rem]"
                                style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* 고객센터 섹션 - 특별 처리 */}
                        {(section.title === '고객센터' || (section.content && typeof section.content === 'object' && !Array.isArray(section.content) && 'phone' in section.content)) && (
                          <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-4 xl:gap-5">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5 xl:mb-2">전화번호</label>
                                <input
                                  type="text"
                                  value={section.content?.phone || ''}
                                  onChange={(e) => setUsageData(prev => ({
                                    ...prev,
                                    [activeTab]: {
                                      ...prev[activeTab],
                                      sections: (prev[activeTab]?.sections || []).map((s, idx) => 
                                        idx === sectionIndex ? {
                                          ...s,
                                          content: { ...s.content, phone: e.target.value }
                                        } : s
                                      )
                                    }
                                  }))}
                                  className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[2.5rem] sm:min-h-[2.75rem] md:min-h-[3rem] lg:min-h-[2.75rem] xl:min-h-[3rem]"
                                  style={{ wordWrap: 'break-word', wordBreak: 'break-all', overflowWrap: 'break-word' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5 xl:mb-2">운영시간</label>
                                <input
                                  type="text"
                                  value={section.content?.hours || ''}
                                  onChange={(e) => setUsageData(prev => ({
                                    ...prev,
                                    [activeTab]: {
                                      ...prev[activeTab],
                                      sections: (prev[activeTab]?.sections || []).map((s, idx) => 
                                        idx === sectionIndex ? {
                                          ...s,
                                          content: { ...s.content, hours: e.target.value }
                                        } : s
                                      )
                                    }
                                  }))}
                                  className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[2.5rem] sm:min-h-[2.75rem] md:min-h-[3rem] lg:min-h-[2.75rem] xl:min-h-[3rem]"
                                  style={{ wordWrap: 'break-word', wordBreak: 'break-all', overflowWrap: 'break-word' }}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-4 xl:gap-5">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5 xl:mb-2">점심시간</label>
                                <input
                                  type="text"
                                  value={section.content?.lunch || ''}
                                  onChange={(e) => setUsageData(prev => ({
                                    ...prev,
                                    [activeTab]: {
                                      ...prev[activeTab],
                                      sections: (prev[activeTab]?.sections || []).map((s, idx) => 
                                        idx === sectionIndex ? {
                                          ...s,
                                          content: { ...s.content, lunch: e.target.value }
                                        } : s
                                      )
                                    }
                                  }))}
                                  className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[2.5rem] sm:min-h-[2.75rem] md:min-h-[3rem] lg:min-h-[2.75rem] xl:min-h-[3rem]"
                                  style={{ wordWrap: 'break-word', wordBreak: 'break-all', overflowWrap: 'break-word' }}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-4 xl:gap-5">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5 xl:mb-2">평일 상담 안내</label>
                                <textarea
                                  value={section.content?.weekday || ''}
                                  onChange={(e) => setUsageData(prev => ({
                                    ...prev,
                                    [activeTab]: {
                                      ...prev[activeTab],
                                      sections: (prev[activeTab]?.sections || []).map((s, idx) => 
                                        idx === sectionIndex ? {
                                          ...s,
                                          content: { ...s.content, weekday: e.target.value }
                                        } : s
                                      )
                                    }
                                  }))}
                                  rows={3}
                                  className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical min-h-[4rem] sm:min-h-[4.5rem] md:min-h-[5rem] lg:min-h-[4.5rem] xl:min-h-[5rem]"
                                  style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 mb-1 sm:mb-1.5 md:mb-2 lg:mb-1.5 xl:mb-2">주말 상담 안내</label>
                                <textarea
                                  value={section.content?.weekend || ''}
                                  onChange={(e) => setUsageData(prev => ({
                                    ...prev,
                                    [activeTab]: {
                                      ...prev[activeTab],
                                      sections: (prev[activeTab]?.sections || []).map((s, idx) => 
                                        idx === sectionIndex ? {
                                          ...s,
                                          content: { ...s.content, weekend: e.target.value }
                                        } : s
                                      )
                                    }
                                  }))}
                                  rows={3}
                                  className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical min-h-[4rem] sm:min-h-[4.5rem] md:min-h-[5rem] lg:min-h-[4.5rem] xl:min-h-[5rem]"
                                  style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 일반 리스트 섹션 */}
                        {section.title !== '이용시간' && section.title !== '고객센터' && Array.isArray(section.content) && (
                          <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-3 xl:space-y-4">
                            {section.content.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex flex-col sm:flex-row items-start space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-3 lg:space-x-2 xl:space-x-3 mb-2">
                                <textarea
                                  value={item}
                                  onChange={(e) => handleUpdateItem(sectionIndex, itemIndex, e.target.value)}
                                  rows={3}
                                  className="w-full sm:flex-1 px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical min-h-[4rem] sm:min-h-[4.5rem] md:min-h-[5rem] lg:min-h-[4.5rem] xl:min-h-[5rem]"
                                  placeholder="내용을 입력하세요"
                                  style={{ 
                                    wordWrap: 'break-word', 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'pre-wrap',
                                    minWidth: '0',
                                    width: '100%'
                                  }}
                                />
                                <button
                                  onClick={() => handleDeleteItem(sectionIndex, itemIndex)}
                                  className="w-full sm:w-auto px-3 sm:px-2 md:px-3 lg:px-2 xl:px-3 py-2 sm:py-1 text-red-500 hover:text-red-700 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base bg-red-50 sm:bg-transparent hover:bg-red-100 sm:hover:bg-red-50 rounded sm:rounded-none border sm:border-0 border-red-200 sm:border-transparent transition-colors"
                                >
                                  삭제
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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