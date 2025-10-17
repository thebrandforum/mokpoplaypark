'use client'

import { useState, useEffect, useRef } from 'react'
import ClientLayout from '@/components/client/client-layout'

export default function ClientPasswordPage() {
  // 비밀번호 설정
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // 현재 비밀번호 확인 상태
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false)
  const [verifyingPassword, setVerifyingPassword] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  
  // 비밀번호 보기/숨기기 상태
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [isLoading, setIsLoading] = useState(false)
  const [savedSection, setSavedSection] = useState('')

  // 디바운스를 위한 타이머 레퍼런스
  const passwordTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (passwordTimerRef.current) {
        clearTimeout(passwordTimerRef.current)
      }
    }
  }, [])

  // 현재 비밀번호 확인
  const verifyCurrentPassword = async (password: string) => {
    if (!password || password.length < 4) {
      setCurrentPasswordVerified(false)
      setCurrentPasswordError('')
      return
    }

    setVerifyingPassword(true)
    setCurrentPasswordError('')

    try {
      const token = localStorage.getItem('clientToken')
      const response = await fetch('/api/client/auth/verify-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentPasswordVerified(true)
        setCurrentPasswordError('')
      } else {
        setCurrentPasswordVerified(false)
        setCurrentPasswordError('현재 비밀번호가 일치하지 않습니다.')
      }
    } catch (error) {
      setCurrentPasswordVerified(false)
      setCurrentPasswordError('비밀번호 확인 중 오류가 발생했습니다.')
    } finally {
      setVerifyingPassword(false)
    }
  }

  // 비밀번호 변경 시 확인 상태 초기화
  const handlePasswordChange = (field: string, value: string) => {
    if (field === 'currentPassword') {
      setCurrentPasswordVerified(false)
      setCurrentPasswordError('')
      
      // 기존 타이머 취소
      if (passwordTimerRef.current) {
        clearTimeout(passwordTimerRef.current)
      }
      
      // 입력 후 0.5초 후에 자동 확인
      if (value.length >= 4) {
        passwordTimerRef.current = setTimeout(() => {
          verifyCurrentPassword(value)
        }, 500)
      }
    }
    setPasswordForm({ ...passwordForm, [field]: value })
  }

  // 비밀번호 저장
  const handleSave = async () => {
    setIsLoading(true)
    setSavedSection('')

    try {
      // 새 비밀번호 일치 확인
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert('새 비밀번호가 일치하지 않습니다.')
        setIsLoading(false)
        return
      }
      
      // 새 비밀번호가 현재 비밀번호와 같은지 확인
      if (passwordForm.newPassword === passwordForm.currentPassword) {
        alert('새 비밀번호는 현재 비밀번호와 달라야 합니다.')
        setIsLoading(false)
        return
      }
      
      // 새 비밀번호 유효성 검사 (최소 4자 이상)
      if (passwordForm.newPassword.length < 4) {
        alert('새 비밀번호는 4자 이상이어야 합니다.')
        setIsLoading(false)
        return
      }

      const token = localStorage.getItem('clientToken')
      const response = await fetch('/api/client/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const result = await response.json()

      if (result.success) {
        setSavedSection('password')
        alert('비밀번호가 성공적으로 변경되었습니다.')
        
        // 비밀번호 변경 성공 시 입력란 초기화
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setCurrentPasswordVerified(false)
        setCurrentPasswordError('')
        setShowPasswords({
          current: false,
          new: false,
          confirm: false
        })
        
        setTimeout(() => setSavedSection(''), 3000)
      } else {
        alert(result.message || '비밀번호 변경에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      alert('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ClientLayout>
      <div className="p-6 sm:p-8 md:p-10 lg:p-8 xl:p-12">
        {/* 헤더 */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl font-bold text-gray-900">
            비밀번호 변경
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl text-gray-600 mt-2 sm:mt-4">
            클라이언트 페이지 접속 비밀번호를 변경합니다
          </p>
        </div>

        <div className="max-w-4xl">
          {/* 비밀번호 변경 카드 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 sm:p-8 md:p-10 lg:p-8 xl:p-12 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">
                    클라이언트 비밀번호 변경
                  </h3>
                  <p className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl text-gray-600">
                    안전한 비밀번호로 변경하세요
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      const allShown = showPasswords.current && showPasswords.new && showPasswords.confirm
                      setShowPasswords({
                        current: !allShown,
                        new: !allShown,
                        confirm: !allShown
                      })
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showPasswords.current && showPasswords.new && showPasswords.confirm ? '모두 숨기기' : '모두 보기'}
                  </button>
                  {savedSection === 'password' && (
                    <span className="text-green-600 text-sm sm:text-base font-medium">✓ 저장됨</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 md:p-10 lg:p-8 xl:p-12 space-y-6">
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && passwordForm.currentPassword.length >= 4) {
                        e.preventDefault()
                        if (passwordTimerRef.current) {
                          clearTimeout(passwordTimerRef.current)
                        }
                        verifyCurrentPassword(passwordForm.currentPassword)
                      }
                    }}
                    className={`w-full px-4 py-3 pr-16 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      currentPasswordError ? 'border-red-300' : 
                      currentPasswordVerified ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className={`absolute top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${
                      verifyingPassword || currentPasswordVerified ? 'right-16' : 'right-4'
                    }`}
                    aria-label={showPasswords.current ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPasswords.current ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  {verifyingPassword && (
                    <div className="absolute right-4 top-3.5">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!verifyingPassword && currentPasswordVerified && (
                    <div className="absolute right-4 top-3.5">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                {currentPasswordError && (
                  <p className="mt-2 text-sm text-red-600">{currentPasswordError}</p>
                )}
                {currentPasswordVerified && (
                  <p className="mt-2 text-sm text-green-600">✓ 비밀번호가 일치합니다</p>
                )}
              </div>
              
              {/* 새 비밀번호 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full px-4 py-3 pr-16 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      !currentPasswordVerified ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                    }`}
                    placeholder="새 비밀번호를 입력하세요"
                    disabled={!currentPasswordVerified}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-50"
                    disabled={!currentPasswordVerified}
                    aria-label={showPasswords.new ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPasswords.new ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  4자 이상 입력해주세요
                </p>
                {!currentPasswordVerified && (
                  <p className="mt-2 text-sm text-amber-600">
                    현재 비밀번호를 먼저 확인해주세요
                  </p>
                )}
                {passwordForm.newPassword && passwordForm.currentPassword && 
                 passwordForm.newPassword === passwordForm.currentPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    ✗ 새 비밀번호는 현재 비밀번호와 달라야 합니다
                  </p>
                )}
              </div>
              
              {/* 새 비밀번호 확인 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 pr-16 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                      !currentPasswordVerified ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                    }`}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    disabled={!currentPasswordVerified}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-50"
                    disabled={!currentPasswordVerified}
                    aria-label={showPasswords.confirm ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPasswords.confirm ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 비밀번호 일치 여부 표시 */}
              {currentPasswordVerified && passwordForm.newPassword && passwordForm.confirmPassword && (
                <div className={`text-base ${
                  passwordForm.newPassword === passwordForm.confirmPassword 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword 
                    ? '✓ 새 비밀번호가 일치합니다' 
                    : '✗ 새 비밀번호가 일치하지 않습니다'}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={
                    isLoading || 
                    !currentPasswordVerified ||
                    !passwordForm.currentPassword || 
                    !passwordForm.newPassword || 
                    !passwordForm.confirmPassword ||
                    passwordForm.newPassword !== passwordForm.confirmPassword ||
                    passwordForm.newPassword.length < 4 ||
                    passwordForm.newPassword === passwordForm.currentPassword
                  }
                  className="px-6 sm:px-8 md:px-10 lg:px-8 xl:px-10 py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5 bg-blue-600 text-white text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
                >
                  {isLoading ? '저장 중...' : '비밀번호 변경'}
                </button>
              </div>
              
              {/* 추가 안내 메시지 */}
              {passwordForm.newPassword && passwordForm.newPassword.length < 4 && (
                <p className="text-sm text-red-500 mt-3">
                  비밀번호는 4자 이상이어야 합니다.
                </p>
              )}
            </div>
          </div>

          {/* 안내 사항 */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-lg font-medium text-blue-900 mb-3">비밀번호 변경 안내</h4>
            <ul className="text-base text-blue-700 space-y-2">
              <li>• 비밀번호는 최소 4자 이상이어야 합니다</li>
              <li>• 현재 비밀번호와 다른 비밀번호를 사용해주세요</li>
              <li>• 비밀번호는 안전하게 암호화되어 저장됩니다</li>
              <li>• 변경 후 다시 로그인할 필요는 없습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}