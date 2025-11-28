'use client'

import BaseLayout from '../../components/base-layout'
import { useState } from 'react'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    user_id: '',
    password: '',
    remember_me: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [submitError, setSubmitError] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // 입력값 변경 핸들러
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: ''
      }))
    }

    // 제출 에러 초기화
    if (submitError) {
      setSubmitError('')
    }
  }

  // 폼 검증
  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.user_id) newErrors.user_id = '아이디를 입력해주세요.'
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 성공 토스트 표시
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessToast(true)
    
    // 2초 후 토스트 숨기기
    setTimeout(() => {
      setShowSuccessToast(false)
    }, 2000)
  }

  // 로그인 처리
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setSubmitError('')
    
    try {
      console.log('로그인 요청 시작:', { ...formData, password: '***' })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      console.log('응답 상태:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // setError를 setSubmitError로 변경
        if (errorData.error === 'USER_NOT_FOUND') {
          setSubmitError('존재하지 않는 아이디입니다.')
        } else if (errorData.error === 'INVALID_PASSWORD') {
          setSubmitError('비밀번호가 일치하지 않습니다.')
        } else {
          setSubmitError(errorData.message || '로그인에 실패했습니다.')
        }
        
        return  // throw 대신 return으로 함수 종료
      }

      const result = await response.json()
      console.log('응답 결과:', result)

      if (result.success) {
        // 로그인 성공 시 토큰 저장
        if (result.data.session) {
          localStorage.setItem('access_token', result.data.session.access_token)
          localStorage.setItem('refresh_token', result.data.session.refresh_token)
          localStorage.setItem('user_info', JSON.stringify(result.data.user))
        }

        // 성공 토스트 표시
        showSuccess(`환영합니다, ${result.data.user.name}님!`)
        
        // 1.5초 후 페이지 이동
        setTimeout(() => {
          if (result.data.user.role === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/')
          }
        }, 1500)
      } else {
        setSubmitError(result.message || '로그인에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('로그인 오류:', error)
      
      // 상세한 오류 메시지 표시
      if (error.message.includes('404')) {
        setSubmitError('존재하지 않는 아이디입니다.')
      } else if (error.message.includes('401')) {
        setSubmitError('아이디 또는 비밀번호가 올바르지 않습니다.')
      } else if (error.message.includes('403')) {
        setSubmitError('비활성화된 계정입니다. 관리자에게 문의해주세요.')
      } else if (error.message.includes('503')) {
        setSubmitError('서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.')
      } else if (error.message.includes('500')) {
        setSubmitError('서버 내부 오류가 발생했습니다. 관리자에게 문의해주세요.')
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        setSubmitError('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.')
      } else {
        setSubmitError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BaseLayout>
      {/* 성공 토스트 알림 */}
      <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        showSuccessToast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px]">
          <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-sm sm:text-base text-gray-600">목포플레이파크에 오신 것을 환영합니다</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* 아이디 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  아이디 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  placeholder="아이디를 입력해주세요"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                />
                {errors.user_id && <p className="text-sm text-red-600 mt-1">{errors.user_id}</p>}
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호를 입력해주세요"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
              </div>

              {/* 로그인 유지 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="remember_me"
                  checked={formData.remember_me}
                  onChange={handleChange}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  로그인 상태 유지
                </label>
              </div>

              {/* 제출 에러 메시지 */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">로그인 실패</h3>
                      <div className="mt-2 text-sm text-red-700">
                        {submitError}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>

              {/* 링크들 - 모바일 반응형 */}
              <div className="space-y-3 sm:space-y-4">
                {/* 회원가입 링크 */}
                <p className="text-center text-sm text-gray-600">
                  아직 계정이 없으신가요?{' '}
                  <a href="/signup" className="text-orange-500 hover:text-orange-600 font-semibold">
                    회원가입하기
                  </a>
                </p>

                {/* 비밀번호 찾기 링크 */}
                <p className="text-center text-sm text-gray-600">
                  비밀번호를 잊으셨나요?{' '}
                  <a href="/find-password" className="text-orange-500 hover:text-orange-600 font-semibold">
                    비밀번호 찾기
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}