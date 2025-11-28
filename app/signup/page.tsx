'use client'

import BaseLayout from '../../components/base-layout'
import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    user_id: '',
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    marketing_agree: false,
    terms_agree: false,
    privacy_agree: false,
    all_agree: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [userIdCheckStatus, setUserIdCheckStatus] = useState<string | null>(null)
  const [passwordMatchStatus, setPasswordMatchStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [submitError, setSubmitError] = useState('')

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 입력값 변경 핸들러
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }

    // 비밀번호 확인 실시간 체크
    if (name === 'passwordConfirm') {
      if (value === '') {
        setPasswordMatchStatus(null)
      } else if (value === formData.password) {
        setPasswordMatchStatus('match')
      } else {
        setPasswordMatchStatus('mismatch')
      }
    }

    // 비밀번호 변경 시 확인 비밀번호도 재검증
    if (name === 'password') {
      if (formData.passwordConfirm === '') {
        setPasswordMatchStatus(null)
      } else if (value === formData.passwordConfirm) {
        setPasswordMatchStatus('match')
      } else {
        setPasswordMatchStatus('mismatch')
      }
    }

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

    // 아이디 변경 시 중복 확인 상태 초기화
    if (name === 'user_id') {
      setUserIdCheckStatus(null)
    }
  }

  // 아이디 중복 확인
  const checkUserIdAvailability = async () => {
    if (!formData.user_id) {
      setErrors((prev: any) => ({ ...prev, user_id: '아이디를 입력해주세요.' }))
      return
    }

    // 아이디 형식 검증 (영문, 숫자, 4-20자)
    const userIdRegex = /^[a-zA-Z0-9]{4,20}$/
    if (!userIdRegex.test(formData.user_id)) {
      setErrors((prev: any) => ({ ...prev, user_id: '아이디는 영문, 숫자 4-20자로 입력해주세요.' }))
      return
    }

    setUserIdCheckStatus('checking')
    
    try {
      const response = await fetch(`/api/auth/check-userid?user_id=${encodeURIComponent(formData.user_id)}`)
      const result = await response.json()

      if (result.success) {
        setUserIdCheckStatus(result.available ? 'available' : 'unavailable')
        if (!result.available) {
          setErrors((prev: any) => ({ ...prev, user_id: '이미 사용중인 아이디입니다.' }))
        } else {
          setErrors((prev: any) => ({ ...prev, user_id: '' }))
        }
      } else {
        setUserIdCheckStatus(null)
        setErrors((prev: any) => ({ ...prev, user_id: result.message }))
      }
    } catch (error: any) {
      console.error('아이디 확인 오류:', error)
      setUserIdCheckStatus(null)
      setErrors((prev: any) => ({ ...prev, user_id: '아이디 확인 중 오류가 발생했습니다.' }))
    }
  }

  // 폼 검증
  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.user_id) newErrors.user_id = '아이디를 입력해주세요.'
    if (!formData.email) newErrors.email = '이메일을 입력해주세요.'
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.'
    if (formData.password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다.'
    if (!formData.passwordConfirm) newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.'
    if (formData.password !== formData.passwordConfirm) newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    if (!formData.name) newErrors.name = '이름을 입력해주세요.'
    if (!formData.phone) newErrors.phone = '전화번호를 입력해주세요.'
    if (!formData.terms_agree) newErrors.terms_agree = '이용약관에 동의해주세요.'
    if (!formData.privacy_agree) newErrors.privacy_agree = '개인정보 처리방침에 동의해주세요.'
    if (userIdCheckStatus !== 'available') newErrors.user_id = '아이디 중복 확인을 완료해주세요.'

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 회원가입 처리
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setSubmitError('')
    
    try {
      console.log('회원가입 요청 시작:', formData)
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      console.log('응답 상태:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('응답 에러:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('응답 결과:', result)

      if (result.success) {
        alert('회원가입이 완료되었습니다!')
        router.push('/login')
      } else {
        setSubmitError(result.message || '회원가입에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('회원가입 오류:', error)
      
      // 상세한 오류 메시지 표시
      if (error.message.includes('503')) {
        setSubmitError('서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.')
      } else if (error.message.includes('500')) {
        setSubmitError('서버 내부 오류가 발생했습니다. 관리자에게 문의해주세요.')
      } else if (error.message.includes('404')) {
        setSubmitError('회원가입 서비스를 찾을 수 없습니다. 개발자에게 문의해주세요.')
      } else if (error.message.includes('400')) {
        setSubmitError('입력한 정보에 오류가 있습니다. 다시 확인해주세요.')
      } else if (error.message.includes('409')) {
        setSubmitError('이미 가입된 정보입니다. 다른 아이디나 이메일을 사용해주세요.')
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        setSubmitError('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.')
      } else {
        setSubmitError(`회원가입 중 오류가 발생했습니다: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-600">목포플레이파크에 오신 것을 환영합니다</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 아이디 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  아이디 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    placeholder="영문, 숫자 4-20자"
                    maxLength={20}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      checkUserIdAvailability()
                    }}
                    disabled={userIdCheckStatus === 'checking' || !formData.user_id}
                    className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm font-semibold whitespace-nowrap"
                  >
                    {userIdCheckStatus === 'checking' ? '확인중...' : '중복확인'}
                  </button>
                </div>
                {userIdCheckStatus === 'available' && (
                  <p className="text-sm text-green-600 mt-1">✓ 사용 가능한 아이디입니다.</p>
                )}
                {errors.user_id && <p className="text-sm text-red-600 mt-1">{errors.user_id}</p>}
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
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
                    placeholder="6자 이상 입력해주세요"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
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

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="비밀번호를 다시 입력해주세요"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPasswordConfirm ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordMatchStatus === 'match' && formData.passwordConfirm && (
                  <p className="text-sm text-green-600 mt-1">✓ 비밀번호가 일치합니다.</p>
                )}
                {passwordMatchStatus === 'mismatch' && formData.passwordConfirm && (
                  <p className="text-sm text-red-600 mt-1">✗ 비밀번호가 일치하지 않습니다.</p>
                )}
                {errors.passwordConfirm && <p className="text-sm text-red-600 mt-1">{errors.passwordConfirm}</p>}
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="실명을 입력해주세요"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* 전화번호 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  maxLength={13}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>

              {/* 약관 동의 */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">이용약관 및 개인정보보호정책</h3>
                
                {/* 이용약관 박스 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-sm text-gray-800 mb-3">【 이용약관 】</h4>
                  <div className="overflow-y-auto max-h-48 text-xs text-gray-600 space-y-3">
                    <div>
                      <p className="font-semibold mb-1">【 제 1 장 총칙 】</p>
                      
                      <p className="font-semibold mt-2">제1조 (목적)</p>
                      <p>이 약관은 목포 플레이파크(이하 "회사"라고 합니다)가 제공하는 목포 플레이파크 서비스의 이용 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                      
                      <p className="font-semibold mt-2">제2조 (약관의 효력 및 범위)</p>
                      <p>① 이 약관은 전기통신사업법 제31조, 동법 시행규칙 제21조의 2에 따라 공시절차를 거친 후 서비스를 통하여 이를 공지하거나 전자우편 기타의 방법으로 회원에게 통지함으로써 효력을 발생합니다.</p>
                      <p>② 회사는 이 약관의 내용을 변경할 수 있으며, 변경된 약관은 1항과 같은 방법으로 공지 또는 통지함으로써 효력을 발생합니다.</p>
                      <p>③ 회원은 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다.</p>
                      
                      <p className="font-semibold mt-2">제3조 (약관외 준칙)</p>
                      <p>이 약관에 명시되지 않은 사항이 전기통신기본법, 전기통신사업법, 기타 관련법령에 규정되어 있는 경우 그 규정에 따릅니다.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-1">【 제 2 장 서비스 이용계약 】</p>
                      
                      <p className="font-semibold mt-2">제6조 (이용계약)</p>
                      <p>서비스 이용계약은 서비스 이용신청자의 약관동의와 이에 따른 이용신청에 대하여 회사가 승낙을 함으로써 성립합니다.</p>
                      
                      <p className="font-semibold mt-2">제7조 (이용신청)</p>
                      <p>서비스 이용신청자는 서비스를 통하여 회사소정의 가입 신청서를 제출함으로써 이용신청을 할 수 있습니다.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-1">【 제 3장 서비스 제공과 이용 】</p>
                      
                      <p className="font-semibold mt-2">제10조 (서비스의 이용요금)</p>
                      <p>① 회사가 제공하는 서비스는 무료입니다.</p>
                      <p>② 향후 일부 서비스에 대하여 유료화 할 수 있으며, 그 자세한 내용에 대하여서는 요금 및 이용방법을 사전에 서비스 내에서 공지합니다.</p>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">* 부칙: 이 약관은 2025년 7월 18일부터 시행합니다.</p>
                  </div>
                </div>
                
                {/* 개인정보보호정책 박스 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-sm text-gray-800 mb-3">【 개인정보보호정책 】</h4>
                  <div className="overflow-y-auto max-h-48 text-xs text-gray-600 space-y-3">
                    <div>
                      <p className="font-semibold">제1조 (개인정보의 처리 목적)</p>
                      <p>&lt;목포 플레이파크&gt;는 개인정보를 다음의 목적을 위해 처리합니다.</p>
                      <p className="mt-1">가. 홈페이지 회원가입 및 관리</p>
                      <p>회원 가입의사 확인, 회원제 서비스 제공에 따른 회원자격 유지 관리, 각종 고지 통지 등을 목적으로 개인정보를 처리합니다.</p>
                      <p className="mt-1">나. 민원사무 처리</p>
                      <p>민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락 통지, 처리결과 통보 등을 목적으로 개인정보를 처리합니다.</p>
                      <p className="mt-1">다. 재화 또는 서비스 제공</p>
                      <p>서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공, 요금결제 정산 등을 목적으로 개인정보를 처리합니다.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold">제2조 (처리하는 개인정보의 항목)</p>
                      <p>가. 게시판 글쓰기 및 마이페이지 이용을 위한 이메일, 페이스북, 트위터 계정 회원가입 절차가 있으며, &lt;목포 플레이파크&gt;는 이용자의 주민등록번호를 보유하지 않습니다.</p>
                      <p>나. 서비스 개선목적을 위한 이용자의 "브라우저 종류", "OS", "방문일시", "IP"항목을 자동 수집합니다.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold">제3조 (개인정보의 처리 및 보유 기간)</p>
                      <p>이용자 개인정보는 원칙적으로 개인정보의 처리목적이 달성되면 지체 없이 파기합니다.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold">제9조 (개인정보보호책임자)</p>
                      <p>개인정보보호책임자</p>
                      <p>성명 : 석수희</p>
                      <p>연락처 : 02-338-1316</p>
                      <p>이메일 : thebrandforum@naver.com</p>
                    </div>
                  </div>
                </div>

                {/* 동의 체크박스 - 하나로 통합 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="all_agree"
                      checked={formData.terms_agree && formData.privacy_agree}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setFormData(prev => ({
                          ...prev,
                          terms_agree: checked,
                          privacy_agree: checked,
                          all_agree: checked
                        }))
                      }}
                      className="w-5 h-5 text-orange-500 border-2 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label className="text-base font-semibold text-gray-900">
                      이용약관 및 개인정보보호정책에 동의합니다
                    </label>
                  </div>
                  {(errors.terms_agree || errors.privacy_agree) && (
                    <p className="text-sm text-red-600 mt-2 ml-8">이용약관 및 개인정보보호정책에 동의해주세요.</p>
                  )}
                </div>
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
                      <h3 className="text-sm font-medium text-red-800">회원가입 실패</h3>
                      <div className="mt-2 text-sm text-red-700">
                        {submitError}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 가입하기 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                {isLoading ? '가입 처리중...' : '가입하기'}
              </button>

              {/* 로그인 링크 */}
              <p className="text-center text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <a href="/login" className="text-orange-500 hover:text-orange-600 font-semibold">
                  로그인하기
                </a>
              </p>
            </form>
          </div>
          
          {/* 하단 안내 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              회원가입 시 목포플레이파크의{' '}
              <span className="text-orange-500">이용약관</span> 및{' '}
              <span className="text-orange-500">개인정보 처리방침</span>에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}