'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface CartItem {
  key: string
  type: string
  hours: number
  count: number
  price: number
  name: string
}

interface ReservationData {
  reservationId: string
  customerName: string
  phone: string
  email: string
  visitDate: string
  adultCount: number
  childCount: number
  guardianCount?: number
  cartItems?: CartItem[]
  totalAmount: number
  status: string
}

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function PaymentContent() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('id')
  
  const [reservationData, setReservationData] = useState<ReservationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkSum, setCheckSum] = useState('')
  const [isGeneratingCheckSum, setIsGeneratingCheckSum] = useState(false)

  // 빌게이트 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://pay.billgate.net/paygate/plugin/gx_web_client.js'
    script.type = 'text/javascript'
    document.head.appendChild(script)
    
    return () => {
      // cleanup 시 스크립트 제거 (존재하는 경우에만)
      const existingScript = document.querySelector('script[src="https://pay.billgate.net/paygate/plugin/gx_web_client.js"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  // 예약 정보 조회
  useEffect(() => {
    if (!reservationId) {
      setLoading(false)
      return
    }

    fetchReservationData(reservationId)
  }, [reservationId])

  // 예약 정보 로드 완료 후 자동 체크섬 생성
  useEffect(() => {
    if (reservationData && !checkSum) {
      generateCheckSum()
    }
  }, [reservationData])

  const fetchReservationData = async (id: string) => {
    try {
      console.log('예약 조회 시작:', id)
      
      // 실제 예약 API 호출
      const response = await fetch(`/api/reservations-search?reservationId=${id}`)
      const result = await response.json()
      
      console.log('예약 조회 결과:', result)
      
      if (result.success && result.data && result.data.length > 0) {
        const reservation = result.data[0]
        console.log('예약 원본 데이터:', reservation)
        
        // 날짜 포맷팅 (2025-01-31 → 2025년 1월)
        const formatVisitDate = (dateString: string) => {
          if (!dateString) return '날짜 미정'
          const date = new Date(dateString)
          return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
        }
        
        const formattedData: ReservationData = {
          reservationId: reservation.reservationId || reservation.id,
          customerName: reservation.customerName,
          phone: reservation.phone,
          email: reservation.email,
          visitDate: formatVisitDate(reservation.visitDate),
          adultCount: reservation.adultCount || 0,
          childCount: reservation.childCount || 0,
          guardianCount: reservation.guardianCount || 0, // 🆕 보호자 수 추가
          cartItems: reservation.cartItems || null, // 🆕 장바구니 데이터 추가
          totalAmount: reservation.totalAmount || 0,
          status: reservation.status || '결제 전'
        }
        
        console.log('포맷된 예약 데이터:', formattedData)
        console.log('cartItems 확인:', formattedData.cartItems)
        setReservationData(formattedData)
      } else {
        console.log('예약을 찾을 수 없음')
        setReservationData(null)
      }
    } catch (error) {
      console.error('예약 조회 오류:', error)
      setReservationData(null)
    } finally {
      setLoading(false)
    }
  }

  const generateCheckSum = async () => {
    if (!reservationData) return

    setIsGeneratingCheckSum(true)
    
    try {
      // 실제 SERVICE_ID 사용
      const checkSumInput = `M2591189${reservationData.reservationId}${reservationData.totalAmount}`
      
      const formData = new FormData()
      formData.append('CheckSum', checkSumInput)
      
      const response = await fetch('/api/payment/checksum', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.text()
        setCheckSum(result.trim())
        console.log('체크섬 자동 생성 완료!')
      } else {
        console.error('체크섬 생성 실패')
      }
    } catch (error) {
      console.error('체크섬 생성 오류:', error)
    } finally {
      setIsGeneratingCheckSum(false)
    }
  }

  const handlePayment = () => {
    if (!checkSum) {
      alert('체크섬을 먼저 생성해주세요.')
      return
    }

    // @ts-ignore - 빌게이트 전역 함수
    if (typeof window.GX_pay === 'function') {
      // @ts-ignore
      window.GX_pay('payment', 'layerpopup', 'https_pay')
    } else {
      alert('결제 모듈이 로드되지 않았습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>예약 정보를 조회하는 중...</p>
        </div>
      </div>
    )
  }

  if (!reservationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">예약번호가 필요합니다</h2>
          <a href="/" className="text-blue-600 hover:underline">메인페이지로 이동</a>
        </div>
      </div>
    )
  }

  if (!reservationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">예약번호 {reservationId}를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">예약이 정상적으로 생성되지 않았거나 잘못된 예약번호입니다.</p>
          <a href="/reservation" className="text-blue-600 hover:underline">다시 예약하기</a>
        </div>
      </div>
    )
  }

  const orderDate = new Date().toISOString().replace(/[-T:\.Z]/g, '').substring(0, 14)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">예약 결제</h1>
        
        {/* 예약 정보 표시 */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">예약 정보</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-sm text-gray-600">예약번호</p>
              <p className="font-semibold">{reservationData.reservationId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">예약자</p>
              <p className="font-semibold">{reservationData.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">연락처</p>
              <p className="font-semibold">{reservationData.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">이용월</p>
              <p className="font-semibold">{reservationData.visitDate}</p>
            </div>
          </div>
        
          {/* 🆕 장바구니 상세 내역 표시 */}
          {reservationData.cartItems && reservationData.cartItems.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">선택한 입장권</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                {reservationData.cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-blue-700">{item.name} × {item.count}매</span>
                    <span className="font-semibold text-blue-800">{(item.price * item.count).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 기존 방식 호환성 (cartItems가 없는 경우)
            <div className="mt-4">
              <p className="text-sm text-gray-600">인원</p>
              <p className="font-semibold">
                {reservationData.adultCount > 0 && `성인 ${reservationData.adultCount}명`}
                {reservationData.adultCount > 0 && reservationData.childCount > 0 && ', '}
                {reservationData.childCount > 0 && `아동 ${reservationData.childCount}명`}
                {reservationData.guardianCount && reservationData.guardianCount > 0 && (reservationData.adultCount > 0 || reservationData.childCount > 0) && ', '}
                {reservationData.guardianCount && reservationData.guardianCount > 0 && `보호자 ${reservationData.guardianCount}명`}
              </p>
            </div>
          )}
        
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">결제금액</p>
              <p className="font-semibold text-lg text-blue-600">{reservationData.totalAmount.toLocaleString()}원</p>
            </div>
          </div>
          
          {/* 체크섬 생성 상태 표시 */}
          {isGeneratingCheckSum && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800">결제 준비 중...</p>
            </div>
          )}
        </div>
		  
        {/* 숨겨진 폼 (빌게이트용) - 표준 필드명 사용 */}
        <form name="payment" method="post" className="hidden">
          <input type="hidden" name="SERVICE_ID" value="M2591189" />
          <input type="hidden" name="SERVICE_CODE" value="0900" />
          <input type="hidden" name="ORDER_ID" value={reservationData.reservationId} />
          <input type="hidden" name="ORDER_DATE" value={orderDate} />
          <input type="hidden" name="AMOUNT" value={reservationData.totalAmount} />
          <input type="hidden" name="CURRENCY" value="KRW" />
          <input type="hidden" name="USER_ID" value={reservationData.reservationId} />
          <input type="hidden" name="ITEM_NAME" value="어드벤처파크 입장권" />
          <input type="hidden" name="USER_NAME" value={reservationData.customerName} />
          <input type="hidden" name="USER_EMAIL" value={reservationData.email || ''} />
          <input type="hidden" name="USER_PHONE" value={reservationData.phone || ''} />
          <input type="hidden" name="RETURN_URL" value="https://adventurepark.run.goorm.site/gogo/BillgatePay-PHP/PayReturn.php" />          <input type="hidden" name="NOTI_URL" value="https://adventure-park-syste-yqmpq.run.goorm.site/api/payment/noti" />
          <input type="hidden" name="CHECK_SUM" value={checkSum} />
          <input type="hidden" name="VIEW_TYPE" value="iframe" />
          <input type="hidden" name="ENCODING_TYPE" value="UTF8" />
        </form>

        {/* 결제 버튼 */}
        <div className="text-center">
          <button
            onClick={handlePayment}
            disabled={!checkSum || isGeneratingCheckSum}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingCheckSum ? '준비 중...' : checkSum ? '결제하기' : '결제 준비 중...'}
          </button>
          
          {/* 디버그 정보 (개발 중에만 표시) */}
          {process.env.NODE_ENV === 'development' && checkSum && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
              <p>체크섬: {checkSum}</p>
              <p>SERVICE_ID: M2591189</p>
              <p>ORDER_ID: {reservationData.reservationId}</p>
              <p>AMOUNT: {reservationData.totalAmount}</p>
            </div>
          )}
          
          <div className="mt-4">
            <a href="/reservation" className="text-gray-600 hover:underline">예약 페이지로 돌아가기</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// 메인 컴포넌트에서 Suspense로 감싸기
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>페이지를 불러오는 중...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}