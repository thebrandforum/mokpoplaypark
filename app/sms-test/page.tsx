'use client'

import { useState } from 'react'

export default function SMSTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('안녕하세요! 테스트 메시지입니다.')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)

  // 전화번호 포맷팅
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length > 11) return phoneNumber
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // SMS 발송 테스트
  const sendTestSMS = async () => {
    if (!phoneNumber || !message) {
      alert('전화번호와 메시지를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/[^\d]/g, ''),
          reservationId: 'TEST_' + Date.now(),
          customerName: '테스트 사용자',
          visitDate: new Date().toISOString().split('T')[0],
          totalAmount: 0,
          customMessage: message
        }),
      })

      const data = await response.json()
      setResult(data)

    } catch (error) {
      console.error('SMS 테스트 오류:', error)
      setResult({
        success: false,
        message: '네트워크 오류가 발생했습니다.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            📱 SMS 발송 테스트
          </h1>

          {/* 전화번호 입력 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              받는사람 전화번호
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              placeholder="010-1234-5678"
              maxLength={13}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none transition"
            />
          </div>

          {/* 메시지 입력 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              보낼 메시지
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="테스트 메시지를 입력하세요"
              rows={4}
              maxLength={90}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none transition resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              {message.length}/90자 (SMS 권장 길이)
            </p>
          </div>

          {/* 발송 버튼 */}
          <button
            onClick={sendTestSMS}
            disabled={isLoading || !phoneNumber || !message}
            className="w-full bg-orange-500 text-white py-4 text-xl font-bold rounded-xl hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '발송 중...' : '📤 SMS 발송 테스트'}
          </button>

          {/* 결과 표시 */}
          {result && (
            <div className={`mt-6 p-4 rounded-xl ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '✅ 발송 성공' : '❌ 발송 실패'}
              </h3>
              <p className={`${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>
              
              {result.error && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                  <h4 className="font-semibold text-red-800">오류 상세:</h4>
                  <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}

              {result.data && (
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <h4 className="font-semibold text-blue-800">발송 정보:</h4>
                  <div className="text-sm text-blue-700 mt-1">
                    <p>메시지 ID: {result.data.messageId}</p>
                    <p>받는번호: {result.data.to}</p>
                    <p>상태: {result.data.statusMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 안내사항 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">📋 테스트 안내</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 현재는 테스트 모드로 실제 SMS가 발송되지 않습니다</li>
              <li>• 콘솔(F12)에서 상세 로그를 확인할 수 있습니다</li>
              <li>• Cool SMS 설정이 완료되면 실제 발송됩니다</li>
              <li>• signature 문제 해결을 위해 테스트 모드로 운영 중</li>
            </ul>
          </div>

          {/* 뒤로가기 */}
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-gray-600 hover:text-orange-500 font-medium transition"
            >
              ← 메인페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}