'use client'

import BaseLayout from '../../components/base-layout'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FindPasswordPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    user_id: '',
    phone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' | 'error'

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length > 11) return formData.phone // 11자리 초과 시 기존값 유지
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 전화번호 검증
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/[^\d]/g, '')
    return numbers.length === 11 && /^010/.test(numbers)
  }

  // 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value)
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // 메시지 초기화
    if (message) {
      setMessage('')
      setMessageType('')
    }
  }

  // 비밀번호 찾기 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 아이디 검증
    if (!formData.user_id) {
      setMessage('아이디를 입력해주세요.')
      setMessageType('error')
      return
    }

    // 전화번호 검증
    if (!validatePhone(formData.phone)) {
      setMessage('올바른 전화번호 형식으로 입력해주세요. (010-XXXX-XXXX)')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/find-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: formData.user_id,
          phone: formData.phone
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage('임시 비밀번호가 SMS로 발송되었습니다. 확인 후 로그인해주세요.')
        setMessageType('success')
        setFormData({ user_id: '', phone: '' })
      } else {
        setMessage(result.message || '비밀번호 찾기에 실패했습니다.')
        setMessageType('error')
      }
    } catch (error) {
      console.error('비밀번호 찾기 오류:', error)
      setMessage('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* 헤더 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">비밀번호 찾기</h2>
            <p className="mt-2 text-sm text-gray-600">
              가입 시 등록한 아이디와 전화번호를 입력하시면<br/>
              임시 비밀번호를 SMS로 발송해드립니다.
            </p>
          </div>

          {/* 비밀번호 찾기 폼 */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* 아이디 입력 */}
              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-2">
                  아이디
                </label>
                <input
                  id="user_id"
                  name="user_id"
                  type="text"
                  value={formData.user_id}
                  onChange={handleChange}
                  placeholder="아이디를 입력하세요"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-lg transition-colors"
                  required
                />
              </div>

              {/* 전화번호 입력 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  maxLength={13}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-lg transition-colors"
                  required
                />
              </div>
            </div>

            {/* 메시지 표시 */}
            {message && (
              <div className={`p-4 rounded-xl text-sm ${
                messageType === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리중...
                </div>
              ) : (
                '임시 비밀번호 발송'
              )}
            </button>

            {/* 링크들 */}
            <div className="flex flex-col space-y-3 text-center">
              <div className="flex justify-center space-x-4 text-sm">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-orange-600 hover:text-orange-800 font-medium"
                >
                  로그인
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => router.push('/signup')}
                  className="text-orange-600 hover:text-orange-800 font-medium"
                >
                  회원가입
                </button>
              </div>
            </div>
          </form>

          {/* 안내사항 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">안내사항</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 임시 비밀번호는 SMS로 발송됩니다</li>
              <li>• 로그인 후 반드시 새로운 비밀번호로 변경해주세요</li>
              <li>• 전화번호가 변경된 경우 고객센터로 문의해주세요</li>
            </ul>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}