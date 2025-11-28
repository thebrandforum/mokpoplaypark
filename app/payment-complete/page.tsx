'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import BaseLayout from '../../components/base-layout'

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function PaymentCompleteContent() {
  const [reservation, setReservation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('id')

  useEffect(() => {
    if (reservationId) {
      loadReservation()
    }
  }, [reservationId])

  // 예약 정보 로드
  const loadReservation = async () => {
    try {
      const response = await fetch(`/api/reservations-search?reservationId=${reservationId}`)
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        setReservation(result.data[0])
      }
    } catch (error) {
      console.error('정보 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatMonth = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  }

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">예약 정보를 불러오는 중...</p>
          </div>
        </div>
      </BaseLayout>
    )
  }

  if (!reservation) {
    return (
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">예약 정보를 찾을 수 없습니다.</p>
          </div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          {/* 결제 완료 헤더 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">결제 완료</h1>
          </div>

          {/* 예약정보 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">예약정보</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">예약자명</span>
                <span className="font-medium">{reservation.customerName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">예약월</span>
                <span className="font-medium">{formatMonth(reservation.visitDate)}</span>
              </div>
              
              {/* 입장권 정보 */}
              {reservation.cartItems && reservation.cartItems.length > 0 && (
                <div className="border-t pt-3">
                  <span className="text-gray-600 block mb-2">입장권</span>
                  <div className="space-y-1">
                    {reservation.cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">× {item.count}매</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">예약번호</span>
                <span className="font-medium">{reservationId}</span>
              </div>
              
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-900 font-semibold">결제금액</span>
                <span className="font-bold text-red-600 text-lg">{formatMoney(reservation.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              홈으로
            </button>
            
            <button 
              onClick={() => window.location.href = '/reservation-check'}
              className="py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              예약확인
            </button>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}

// 메인 컴포넌트에서 Suspense로 감싸기
export default function PaymentCompletePage() {
  return (
    <Suspense fallback={
      <BaseLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">페이지를 불러오는 중...</p>
          </div>
        </div>
      </BaseLayout>
    }>
      <PaymentCompleteContent />
    </Suspense>
  )
}