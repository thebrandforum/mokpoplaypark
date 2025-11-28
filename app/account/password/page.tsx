'use client'

import BaseLayout from '../../../components/base-layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function PasswordChangePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 비밀번호 표시 상태
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // 비밀번호 일치 상태
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null)

  // 비밀번호 확인 실시간 체크
  useEffect(() => {
    if (formData.confirmPassword === '') {
      setPasswordMatch(null)
    } else if (formData.newPassword === formData.confirmPassword) {
      setPasswordMatch(true)
    } else {
      setPasswordMatch(false)
    }
  }, [formData.newPassword, formData.confirmPassword])

  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.'
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return '비밀번호는 영문자를 포함해야 합니다.'
    }
    if (!/(?=.*[0-9])/.test(password)) {
      return '비밀번호는 숫자를 포함해야 합니다.'
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      return '비밀번호는 특수문자(!@#$%^&*)를 포함해야 합니다.'
    }
    return ''
  }

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // 유효성 검사
    if (!formData.currentPassword) {
      setError('현재 비밀번호를 입력해주세요.')
      return
    }

    if (!formData.newPassword) {
      setError('새 비밀번호를 입력해주세요.')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('현재 비밀번호와 새 비밀번호가 동일합니다.')
      return
    }

    // 비밀번호 복잡도 검사
    const passwordError = validatePassword(formData.newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)

    try {
      // localStorage에서 토큰 가져오기
      const accessToken = localStorage.getItem('access_token')
      
      if (!accessToken) {
        setError('로그인이 필요합니다.')
        router.push('/login')
        return
      }

      // refresh token도 함께 가져오기
      const refreshToken = localStorage.getItem('refresh_token')
      
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          refreshToken: refreshToken
        })
      })

      const result = await response.json()

      if (result.success) {
        // 새로운 토큰이 있으면 저장
        if (result.newSession) {
          localStorage.setItem('access_token', result.newSession.access_token)
          if (result.newSession.refresh_token) {
            localStorage.setItem('refresh_token', result.newSession.refresh_token)
          }
        }
        
        setSuccess(true)
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // 3초 후 이전 페이지로 이동
        setTimeout(() => {
          router.back()
        }, 3000)
      } else {
        // 로그인이 필요한 경우
        if (result.needsLogin) {
          router.push('/login')
        }
        setError(result.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      setError('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 입력 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  // 비밀번호 표시 토글
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              비밀번호 변경
            </h1>

            {/* 성공 메시지 */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-center">
                  비밀번호가 성공적으로 변경되었습니다!
                </p>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPasswords.current ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPasswords.new ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  8자 이상, 영문자, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다.
                </p>
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPasswords.confirm ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* 비밀번호 일치 여부 표시 */}
                {passwordMatch !== null && formData.confirmPassword && (
                  <p className={`mt-2 text-xs ${passwordMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordMatch ? '✓ 비밀번호가 일치합니다.' : '✗ 비밀번호가 일치하지 않습니다.'}
                  </p>
                )}
              </div>

              {/* 비밀번호 강도 표시 */}
              {formData.newPassword && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">비밀번호 강도</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          formData.newPassword.length >= 12 && validatePassword(formData.newPassword) === ''
                            ? 'bg-green-500 w-full'
                            : formData.newPassword.length >= 8 && validatePassword(formData.newPassword) === ''
                            ? 'bg-yellow-500 w-2/3'
                            : 'bg-red-500 w-1/3'
                        }`}
                      />
                    </div>
                    <span className={`text-sm ${
                      formData.newPassword.length >= 12 && validatePassword(formData.newPassword) === ''
                        ? 'text-green-600'
                        : formData.newPassword.length >= 8 && validatePassword(formData.newPassword) === ''
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {formData.newPassword.length >= 12 && validatePassword(formData.newPassword) === ''
                        ? '강함'
                        : formData.newPassword.length >= 8 && validatePassword(formData.newPassword) === ''
                        ? '보통'
                        : '약함'}
                    </span>
                  </div>
                </div>
              )}

              {/* 버튼 영역 */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
                  disabled={loading}
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>

            {/* 추가 안내 */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                안전한 비밀번호 만들기
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="whitespace-nowrap">• 개인정보(이름, 생일, 전화번호)를 포함하지 마세요</li>
                <li className="whitespace-nowrap">• 사전에 있는 단어를 그대로 사용하지 마세요</li>
                <li className="whitespace-nowrap">• 다른 사이트와 동일한 비밀번호를 사용하지 마세요</li>
                <li className="whitespace-nowrap">• 정기적으로 비밀번호를 변경하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}