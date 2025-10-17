'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 초기화
const supabase = createClient(
  'https://rplkcijqbksheqcnvjlf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
)

interface Popup {
  id: string
  title: string
  content: string
  image_url: string
  show_title: boolean
  show_content: boolean
  show_image: boolean
  start_date: string
  end_date: string
  is_active: boolean
}

export default function PopupDisplay() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [isMobile, setIsMobile] = useState(false)

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 컴포넌트 마운트시 팝업 조회
  useEffect(() => {
    fetchActivePopups()
  }, [])

  // 쿠키에서 닫은 팝업 목록 가져오기
  const getClosedPopupsFromCookie = () => {
    const cookies = document.cookie.split(';')
    const closedList: string[] = []
    
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name.startsWith('popup_closed_') && value === 'true') {
        const popupId = name.replace('popup_closed_', '')
        closedList.push(popupId)
      }
    })
    
    return closedList
  }

  // 활성 팝업 조회
  const fetchActivePopups = async () => {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 쿠키에서 닫은 팝업 목록 확인
      const closedPopups = getClosedPopupsFromCookie()
      
      // 이미 닫은 팝업 제외
      const activePopups = (data || []).filter(
        popup => !closedPopups.includes(popup.id.toString())
      )

      setPopups(activePopups)
    } catch (error) {
      console.error('팝업 조회 실패:', error)
    }
  }

  // 팝업 닫기
  const handleClose = (popupId: string) => {
    setPopups(prev => prev.filter(p => p.id !== popupId))
  }

  // 오늘 하루 보지 않기
  const handleCloseToday = (popupId: string) => {
    // 쿠키 설정 (24시간)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    document.cookie = `popup_closed_${popupId}=true; expires=${tomorrow.toUTCString()}; path=/; SameSite=Lax`
    
    handleClose(popupId)
  }

  // 팝업 위치 계산
  const getPopupStyle = (index: number, totalCount: number) => {
    // z-index를 반대로 설정 (첫 번째가 가장 높게)
    const zIndex = 50 + (totalCount - 1 - index)
    
    if (isMobile) {
      // 모바일: 세로로 겹치기 (팝업 높이의 20%만 보이게)
      // 320px 너비 기준 20% = 64px
      // 첫 번째 팝업 기준으로 뒤로 갈수록 아래로 이동
      const offset = index * 64
      
      return {
        left: '50%',
        top: '50%',
        transform: `translate(-50%, calc(-50% + ${offset}px))`,
        zIndex: zIndex
      }
    } else {
      // PC: 가로로 겹치기 (팝업 너비의 20%만 보이게)
      // 640px 너비 기준 20% = 128px
      // 첫 번째 팝업 기준으로 뒤로 갈수록 오른쪽으로 이동
      const offset = index * 128
      
      return {
        left: `${offset}px`,
        top: '45%',
        transform: `translateY(-50%)`,
        zIndex: zIndex
      }
    }
  }

  if (popups.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* 팝업 컨테이너 */}
      <div className="relative w-full h-full">
        {popups.map((popup, index) => (
          <div
            key={popup.id}
            className="absolute pointer-events-auto bg-white shadow-2xl border border-gray-300 w-80 md:w-[440px] overflow-hidden"
            style={getPopupStyle(index, popups.length)}
          >
            {/* 이미지 영역 - 패딩 없음 */}
            {popup.show_image && popup.image_url && (
              <img
                src={popup.image_url}
                alt={popup.title || '팝업 이미지'}
                className="w-full h-auto block"
              />
            )}

            {/* 텍스트 콘텐츠 영역 */}
            <div className="p-5">
              {/* 제목 */}
              {popup.show_title && popup.title && (
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {popup.title}
                </h2>
              )}

              {/* 내용 */}
              {popup.show_content && popup.content && (
                <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                  {popup.content}
                </div>
              )}

              {/* 하단 컨트롤 */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <label className="inline-flex items-center text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleCloseToday(popup.id)
                      }
                    }}
                    className="mr-1.5 border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>오늘 하루 보지 않기</span>
                </label>
                <button
                  onClick={() => handleClose(popup.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  닫기 ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}