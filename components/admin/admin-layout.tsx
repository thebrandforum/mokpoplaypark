'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 인증 체크
  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === '/admin/login') {
        setIsLoading(false)
        return
      }
  
      const token = localStorage.getItem('adminToken')
      console.log('저장된 토큰:', token) // 🔴 디버깅
      
      if (!token) {
        console.log('토큰 없음, 로그인 페이지로') // 🔴 디버깅
        router.push('/admin/login')
        return
      }
  
      try {
        const response = await fetch('/api/admin/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        console.log('인증 응답 상태:', response.status) // 🔴 디버깅
        const data = await response.json()
        console.log('인증 응답 데이터:', data) // 🔴 디버깅
  
        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem('adminToken')
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('인증 확인 실패:', error)
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }
  
    checkAuth()
  }, [pathname, router])
	
  // 로그아웃 함수
  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  const menuItems = [
    {
      name: '예약관리',
      href: '/admin/reservations',
      icon: null
    },
	{
      name: '취소관리',
      href: '/admin/reservations/cancellist',
      icon: null
    },  
	{
      name: '메인페이지 관리',
      href: '/admin/homepage',
      icon: null
    },
    {
      name: '목포플레이파크',
      href: '/admin/content',
      icon: null
    },
    {
      name: '시설안내',
      href: '/admin/facility',
      icon: null
    },
    {
      name: '이용안내',
      href: '/admin/usage-info',
      icon: null
    },
    {
      name: '커뮤니티 관리',
      href: '/admin/community',
      icon: null
    },
	{
      name: '팝업 관리',
      href: '/admin/popups',
      icon: null
    },  
	{
      name: '이용권 구매',
      href: '/admin/staff-reservation',
      icon: null
    },
    {
      name: '설정',
      href: '/admin/settings',
      icon: null
    }
  ]

  // 로그인 페이지는 레이아웃 없이 표시
  if (pathname === '/admin/login') {
    return children
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 - 모바일/태블릿/데스크톱 반응형 개선 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 md:w-80 lg:w-64 xl:w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20 lg:h-16 xl:h-20 px-4 sm:px-5 md:px-6 lg:px-4 xl:px-6 bg-white border-b border-gray-200">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-xl font-bold text-gray-900">관리자 페이지</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-4 sm:mt-5 md:mt-6 lg:mt-4 xl:mt-6 px-3 sm:px-4 md:px-5 lg:px-3 xl:px-4 space-y-1">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 sm:px-4 md:px-5 lg:px-3 xl:px-4 py-2.5 sm:py-3 md:py-3.5 lg:py-2.5 xl:py-3 text-sm md:text-base lg:text-sm xl:text-base font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className={`w-2 h-2 md:w-2.5 md:h-2.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 rounded-full mr-3 md:mr-4 lg:mr-3 xl:mr-4 ${
                  pathname === item.href ? 'bg-blue-500' : 'bg-gray-400'
                }`}></div>
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 lg:p-3 xl:p-4">
          <Link
            href="/"
            className="flex items-center px-3 sm:px-4 md:px-5 lg:px-3 xl:px-4 py-2.5 sm:py-3 md:py-3.5 lg:py-2.5 xl:py-3 text-sm md:text-base lg:text-sm xl:text-base text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 mr-2 md:mr-3 lg:mr-2 xl:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="truncate">홈페이지로 돌아가기</span>
          </Link>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 lg:ml-0">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 lg:px-4 xl:px-6 py-3 sm:py-4 md:py-5 lg:py-3 xl:py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 md:p-2.5 lg:p-2 xl:p-2.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden transition-colors"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h2 className="ml-2 md:ml-3 lg:ml-2 xl:ml-3 text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl font-semibold text-gray-900">
                관리자 페이지
              </h2>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-2 xl:space-x-4">
              <div className="hidden sm:block">
                <span className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-500">관리자</span>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-900">admin</span>
              </div>

              <button 
                onClick={handleLogout}
                className="flex items-center px-2 sm:px-3 md:px-4 lg:px-2 xl:px-3 py-1.5 sm:py-2 md:py-2.5 lg:py-1.5 xl:py-2 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 mr-1 sm:mr-1.5 md:mr-2 lg:mr-1 xl:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 2xl:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

// 두 가지 방식으로 export (호환성)
export { AdminLayout }