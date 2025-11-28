// app/admin/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // 로그인 확인 후 적절한 페이지로 이동
    const token = localStorage.getItem('adminToken')
    
    if (token) {
      // 로그인된 경우 예약관리로 이동
      router.replace('/admin/reservations')  // 🔴 dashboard를 reservations로 변경!
    } else {
      // 로그인 안된 경우 로그인 페이지로 이동
      router.replace('/admin/login')
    }
  }, [router])

  // 리다이렉트 중 표시
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">관리자 페이지로 이동 중...</p>
      </div>
    </div>
  )
}