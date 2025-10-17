'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientPage() {
  const router = useRouter()

  useEffect(() => {
    // 토큰 확인
    const token = localStorage.getItem('clientToken')
    
    if (token && token.startsWith('client_')) {
      // 이미 로그인된 경우 예약 관리로 이동
      router.push('/client/reservations')
    } else {
      // 로그인되지 않은 경우 로그인 페이지로 이동
      router.push('/client/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">페이지 이동 중...</p>
      </div>
    </div>
  )
}