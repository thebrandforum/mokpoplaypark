'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import BaseLayout from '../../components/base-layout'

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function BankTransferContent() {
  const [reservation, setReservation] = useState(null)
  const [bankSettings, setBankSettings] = useState(null) // 🆕 계좌 정보 상태 추가
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('id')

  useEffect(() => {
    if (reservationId) {
      loadReservationAndBankInfo()
    }
  }, [reservationId])

  // 🆕 예약 정보와 계좌 정보를 함께 로드
  const loadReservationAndBankInfo = async () => {
    try {
      // 예약 정보 로드
      const reservationResponse = await fetch(`/api/reservations-search?reservationId=${reservationId}`)
      const reservationResult = await reservationResponse.json()
      
      if (reservationResult.success && reservationResult.data && reservationResult.data.length > 0) {
        setReservation(reservationResult.data[0])
      }

      // 🆕 계좌 정보 로드
      const settingsResponse = await fetch('/api/settings')
      const settingsResult = await settingsResponse.json()
      
      if (settingsResult.success && settingsResult.data?.bank_settings) {
        setBankSettings(settingsResult.data.bank_settings)
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

  // 날짜 포맷팅 함수 추가
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
          {/* 예약 완료 헤더 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">예약성공</h1>
          </div>

          {/* 무통장 입금 안내 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-red-800 mb-2">무통장 입금 시 확인해주세요!</h3>
            <div className="text-sm text-red-700 space-y-1">
              <p>- 반드시 예약 번호 또는 성함을 입금자명에 입력하세요.</p>
              <p>- 24시간 이내 입금하지 않을 시 자동 취소됩니다.</p>
              <p>- 예약 확인에서 예약 확인 가능합니다.</p>
            </div>
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
                <span className="text-gray-600">예약일</span>
                <span className="font-medium">{new Date().toLocaleDateString('ko-KR')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">이용월</span>
                <span className="font-medium">{formatMonth(reservation.visitDate)}</span>
              </div>
              
              {/* 입장권 정보로 변경 */}
              <div className="border-t pt-3">
                <span className="text-gray-600 block mb-2">입장권</span>
                <div className="space-y-1">
                  {reservation.cartItems && reservation.cartItems.length > 0 ? (
                    reservation.cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-500">{item.name} × {item.count}매</span>
                        <span className="font-medium">{formatMoney(item.price * item.count)}</span>
                      </div>
                    ))
                  ) : (
                    // 구버전 호환용 (cartItems가 없는 경우)
                    <>
                      {reservation.adultCount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">성인 × {reservation.adultCount}명</span>
                          <span className="font-medium">-</span>
                        </div>
                      )}
                      {reservation.childCount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">어린이 × {reservation.childCount}명</span>
                          <span className="font-medium">-</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">예약번호</span>
                <span className="font-medium">{reservationId}</span>
              </div>
            </div>
          </div>

          {/* 🆕 동적 입금계좌 정보 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">입금계좌</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">은행명</span>
                <span className="font-medium">{bankSettings?.bankName || '신한은행'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">예금주</span>
                <span className="font-medium">{bankSettings?.accountHolder || '목포플레이파크'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">계좌번호</span>
                <span className="font-medium">{bankSettings?.accountNumber || '140-015-156616'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">예금주명</span>
                <span className="font-medium">{bankSettings?.accountHolderName || '기업플레이파크'}</span>
              </div>
              
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-900 font-semibold">총 입금액</span>
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
export default function BankTransferPage() {
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
      <BankTransferContent />
    </Suspense>
  )
}