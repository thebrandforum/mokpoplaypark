'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../../components/admin/admin-layout'

export default function SettingsPage() {
  // 푸터 설정
  const [footerSettings, setFooterSettings] = useState({
    footerText: `<strong>목포플레이파크</strong> | 전라남도 목포시 남농로 115 (용해동) 목포플레이파크
  대표 : 홍주표 | 사업자등록번호 : 147-85-03093
  전화번호 : 061-272-8663 | 이메일 : mokpoplaypark@climbkorea.com
  
  <strong>온라인위탁사</strong> | 서울시 강서구 화곡로 68길 82 강서IT밸리 1103호
  전화번호 : 02.338.1316 | 통신판매업신고번호 : 2024-서울강서-0865`
  })

  // 배너 설정
  const [bannerSettings, setBannerSettings] = useState({
    commonBanner: ''
  })

  // 입금계좌 설정
  const [bankSettings, setBankSettings] = useState({
    bankName: '신한은행',
    accountNumber: '140-015-156616',
    accountHolder: '목포플레이파크',
    accountHolderName: '기업플레이파크'
  })

  // 결제 설정
  const [paymentSettings, setPaymentSettings] = useState({
    isPaymentBlocked: false,
    blockMessage: '현재 시스템 점검 중으로 예약이 일시 중단되었습니다.'
  })

  // 관리자 비밀번호 설정
  const [adminPassword, setAdminPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // 취소 정책 설정
  const [cancellationSettings, setCancellationSettings] = useState({
    defaultCancelType: 'simple'        // 'simple' 또는 'refund'만 남김
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

  // 이미지 업로드 관련 상태
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  // 요금 설정에 비고 텍스트 추가 + 보호자 요금 분리
  const [priceSettings, setPriceSettings] = useState({
    child1Hour: 12000,
    child2Hour: 24000,
    adult1Hour: 17000,
    adult2Hour: 34000,
    guardian1Hour: 3000,
    guardian2Hour: 3000,
    // 감면 요금 추가
    discount_child_1hour: 10000,
    discount_child_2hour: 20000,
    discount_adult_1hour: 15000,
    discount_adult_2hour: 30000,
    childNote: '만7세~만13세 미만',
    adultNote: '만13세 이상',
    guardianNote: '놀이시설 이용불가',
    remark1Hour: '20:00 발권마감',
    remark2Hour: '19:00 발권마감'
  })

  // 운영 설정 - 실제 목포 플레이파크 운영시간
  const [operationSettings, setOperationSettings] = useState({
    openTime: '10:00',
    closeTime: '21:00',
    lastEntry: '20:00',
    closedDays: [1], // 월요일 휴무
    specialClosedDates: [], // 특별 휴무일
    specialNotice: '시설 운영 시간은 목포 플레이파크 사정에 따라 변경될 수 있습니다.'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [savedSection, setSavedSection] = useState('')

  // 페이지 로드 시 설정 불러오기
  useEffect(() => {
    loadSettings()
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (passwordTimerRef.current) {
        clearTimeout(passwordTimerRef.current)
      }
    }
  }, [])

  // 설정 불러오기
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const result = await response.json()
  
      if (result.success && result.data) {
        const { price_settings, operation_settings, footer_settings, banner_settings, bank_settings, payment_settings, cancellation_settings } = result.data
        
        if (price_settings) {
          setPriceSettings(prev => ({ ...prev, ...price_settings }))
        }
        
        if (operation_settings) {
          setOperationSettings(prev => ({ ...prev, ...operation_settings }))
        }
  
        if (footer_settings) {
          setFooterSettings(prev => ({ ...prev, ...footer_settings }))
        }
  
        if (banner_settings) {
          setBannerSettings(prev => ({ ...prev, ...banner_settings }))
        }
  
        if (bank_settings) {
          setBankSettings(prev => ({ ...prev, ...bank_settings }))
        }
  
        if (payment_settings) {
          setPaymentSettings(prev => ({ ...prev, ...payment_settings }))
        }

        if (cancellation_settings) {
          setCancellationSettings(prev => ({ ...prev, ...cancellation_settings }))
        }
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
    }
  }

  // 현재 비밀번호 확인
  const verifyCurrentPassword = async (password) => {
    if (!password || password.length < 4) {
      setCurrentPasswordVerified(false)
      setCurrentPasswordError('')
      return
    }

    setVerifyingPassword(true)
    setCurrentPasswordError('')

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/auth/verify-password', {
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

  // 디바운스를 위한 타이머 레퍼런스
  const passwordTimerRef = useRef(null)

  // 비밀번호 변경 시 확인 상태 초기화
  const handlePasswordChange = (field, value) => {
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
    setAdminPassword({ ...adminPassword, [field]: value })
  }

  // 설정 저장
  const handleSave = async (section) => {
    setIsLoading(true)
    setSavedSection('')
  
    try {
      let data
      let sectionName
  
      switch (section) {
        case 'price_settings':
          data = priceSettings
          sectionName = '요금 설정'
          break
        case 'operation_settings':
          data = operationSettings
          sectionName = '운영 설정'
          break
        case 'footer_settings':
          data = footerSettings
          sectionName = '푸터 설정'
          break
        case 'banner_settings':
          data = bannerSettings
          sectionName = '배너 설정'
          break
        case 'bank_settings':
          data = bankSettings
          sectionName = '입금계좌 설정'
          break
        case 'payment_settings':
          data = paymentSettings
          sectionName = '결제 설정'
          break
        case 'cancellation_settings': 
          data = cancellationSettings
          sectionName = '취소 정책 설정'
          break
        case 'admin_password':
          // 새 비밀번호 일치 확인
          if (adminPassword.newPassword !== adminPassword.confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.')
            setIsLoading(false)
            return
          }
          
          // 새 비밀번호가 현재 비밀번호와 같은지 확인
          if (adminPassword.newPassword === adminPassword.currentPassword) {
            alert('새 비밀번호는 현재 비밀번호와 달라야 합니다.')
            setIsLoading(false)
            return
          }
          
          // 새 비밀번호 유효성 검사
          if (adminPassword.newPassword.length < 8) {
            alert('새 비밀번호는 8자 이상이어야 합니다.')
            setIsLoading(false)
            return
          }
          
          const hasLetter = /[a-zA-Z]/.test(adminPassword.newPassword)
          const hasNumber = /[0-9]/.test(adminPassword.newPassword)
          
          if (!hasLetter || !hasNumber) {
            alert('새 비밀번호는 영문과 숫자를 모두 포함해야 합니다.')
            setIsLoading(false)
            return
          }
          
          // 현재 비밀번호와 새 비밀번호를 함께 전송
          data = {
            currentPassword: adminPassword.currentPassword,
            newPassword: adminPassword.newPassword
          }
          sectionName = '관리자 비밀번호'
          break
        default:
          throw new Error('잘못된 섹션입니다.')
      }
  
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section, data })
      })
  
      const result = await response.json()
  
      if (result.success) {
        setSavedSection(section)
        alert(`${sectionName} 설정이 저장되었습니다.`)
        
        // 비밀번호 변경 성공 시 입력란 초기화
        if (section === 'admin_password') {
          setAdminPassword({
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
        }
        
        setTimeout(() => setSavedSection(''), 3000)
      } else {
        alert(result.message || '저장에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('설정 저장 실패:', error)
      alert('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 휴무일 선택 처리
  const handleClosedDayToggle = (dayIndex) => {
    setOperationSettings(prev => ({
      ...prev,
      closedDays: prev.closedDays.includes(dayIndex)
        ? prev.closedDays.filter(day => day !== dayIndex)
        : [...prev.closedDays, dayIndex]
    }))
  }

  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

  // 이미지 업로드 처리
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 10MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      setUploadingImage(true)

      // FormData 생성
      const formData = new FormData()
      formData.append('image', file)
      formData.append('type', 'banner')

      // 서버에 업로드
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setBannerSettings({
          ...bannerSettings,
          commonBanner: result.imageUrl
        })
        alert('이미지가 성공적으로 업로드되었습니다!')
      } else {
        alert(result.message || '이미지 업로드에 실패했습니다.')
      }

    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6">
        {/* 반응형 헤더 */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
            시스템 설정
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg text-gray-600 mt-1 sm:mt-2">
            목포 플레이파크 운영에 필요한 기본 설정을 관리합니다
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-6 xl:space-y-8">
          
          {/* 결제 차단 설정 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-semibold text-gray-900">
                    결제 설정
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
                    결제 기능을 일시적으로 차단할 수 있습니다
                  </p>
                </div>
                {savedSection === 'payment_settings' && (
                  <span className="text-green-600 text-xs sm:text-sm font-medium">✓ 저장됨</span>
                )}
              </div>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 space-y-4">
              {/* 결제 차단 토글 */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">결제 차단</label>
                  <p className="text-xs text-gray-500 mt-1">
                    활성화하면 모든 결제가 차단되고 안내 메시지가 표시됩니다
                  </p>
                </div>
                <button
                  onClick={() => setPaymentSettings(prev => ({ ...prev, isPaymentBlocked: !prev.isPaymentBlocked }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    paymentSettings.isPaymentBlocked ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      paymentSettings.isPaymentBlocked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 차단 메시지 설정 */}
              {paymentSettings.isPaymentBlocked && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    차단 시 안내 메시지
                  </label>
                  <textarea
                    value={paymentSettings.blockMessage}
                    onChange={(e) => setPaymentSettings({...paymentSettings, blockMessage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    rows={3}
                    placeholder="예약 차단 시 표시될 메시지를 입력하세요..."
                  />
                </div>
              )}

              {/* 현재 상태 표시 */}
              <div className={`p-3 rounded-lg ${paymentSettings.isPaymentBlocked ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${paymentSettings.isPaymentBlocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className={`text-sm font-medium ${paymentSettings.isPaymentBlocked ? 'text-red-800' : 'text-green-800'}`}>
                    {paymentSettings.isPaymentBlocked ? '결제 차단 중' : '결제 가능'}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${paymentSettings.isPaymentBlocked ? 'text-red-600' : 'text-green-600'}`}>
                  {paymentSettings.isPaymentBlocked 
                    ? '현재 모든 예약과 결제가 차단된 상태입니다.' 
                    : '고객이 정상적으로 예약과 결제를 진행할 수 있습니다.'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('payment_settings')}
                  disabled={isLoading}
                  className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-red-600 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
		  	
		  {/* 취소 정책 설정 */}
		  <div className="bg-white rounded-lg shadow border">
		    <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 border-b border-gray-200">
		      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
		        <div>
		          <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-semibold text-gray-900">
		            취소 정책 설정
		          </h3>
		          <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
		            관리자 페이지에서 예약 취소 시 기본 처리 방식을 설정합니다
		          </p>
		        </div>
		        {savedSection === 'cancellation_settings' && (
		          <span className="text-green-600 text-xs sm:text-sm font-medium">✓ 저장됨</span>
		        )}
		      </div>
		    </div>
		    
		    <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 space-y-4">
		      {/* 기본 취소 방식 선택 */}
		      <div>
		        <label className="block text-sm font-medium text-gray-700 mb-3">기본 취소 방식</label>
		        <div className="space-y-3">
		          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
		            <input
		              type="radio"
		              value="simple"
		              checked={cancellationSettings.defaultCancelType === 'simple'}
		              onChange={(e) => setCancellationSettings({...cancellationSettings, defaultCancelType: e.target.value})}
		              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
		            />
		            <div className="ml-3">
		              <span className="text-sm font-medium">단순취소</span>
		              <p className="text-xs text-gray-500 mt-0.5">예약 상태만 취소로 변경합니다 (환불 처리 안함)</p>
		            </div>
		          </label>
		          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
		            <input
		              type="radio"
		              value="refund"
		              checked={cancellationSettings.defaultCancelType === 'refund'}
		              onChange={(e) => setCancellationSettings({...cancellationSettings, defaultCancelType: e.target.value})}
		              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
		            />
		            <div className="ml-3">
		              <span className="text-sm font-medium">환불취소</span>
		              <p className="text-xs text-gray-500 mt-0.5">예약 취소와 함께 환불 처리를 진행합니다</p>
		            </div>
		          </label>
		        </div>
		      </div>
		  
		      {/* 현재 설정 상태 */}
		      <div className={`p-3 rounded-lg ${
		        cancellationSettings.defaultCancelType === 'simple' 
		          ? 'bg-yellow-50 border border-yellow-200' 
		          : 'bg-red-50 border border-red-200'
		      }`}>
		        <div className="flex items-center">
		          <div className={`w-2 h-2 rounded-full mr-2 ${
		            cancellationSettings.defaultCancelType === 'simple' 
		              ? 'bg-yellow-500' 
		              : 'bg-red-500'
		          }`}></div>
		          <span className={`text-sm font-medium ${
		            cancellationSettings.defaultCancelType === 'simple' 
		              ? 'text-yellow-800' 
		              : 'text-red-800'
		          }`}>
		            {cancellationSettings.defaultCancelType === 'simple' 
		              ? '단순취소 모드' 
		              : '환불취소 모드'}
		          </span>
		        </div>
		        <p className={`text-xs mt-1 ${
		          cancellationSettings.defaultCancelType === 'simple' 
		            ? 'text-yellow-600' 
		            : 'text-red-600'
		        }`}>
		          {cancellationSettings.defaultCancelType === 'simple' 
		            ? '예약 취소 시 상태만 변경되며, 별도의 환불 처리가 필요합니다.' 
		            : '예약 취소 시 자동으로 환불 처리가 진행됩니다.'}
		        </p>
		      </div>
		  
		      <div className="flex justify-end">
		        <button
		          onClick={() => handleSave('cancellation_settings')}
		          disabled={isLoading}
		          className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base transition-colors"
		        >
		          {isLoading ? '저장 중...' : '저장'}
		        </button>
		      </div>
		    </div>
		  </div>	
          
          {/* 관리자 비밀번호 변경 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-semibold text-gray-900">
                    관리자 비밀번호 변경
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
                    관리자 페이지 접속 비밀번호를 변경합니다
                  </p>
                </div>
                <div className="flex items-center gap-4">
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
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showPasswords.current && showPasswords.new && showPasswords.confirm ? '모두 숨기기' : '모두 보기'}
                  </button>
                  {savedSection === 'admin_password' && (
                    <span className="text-green-600 text-xs sm:text-sm font-medium">✓ 저장됨</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={adminPassword.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && adminPassword.currentPassword.length >= 4) {
                        e.preventDefault()
                        if (passwordTimerRef.current) {
                          clearTimeout(passwordTimerRef.current)
                        }
                        verifyCurrentPassword(adminPassword.currentPassword)
                      }
                    }}
                    className={`w-full px-3 py-2 pr-12 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      currentPasswordError ? 'border-red-300' : 
                      currentPasswordVerified ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className={`absolute top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded ${
                      verifyingPassword || currentPasswordVerified ? 'right-12' : 'right-3'
                    }`}
                    aria-label={showPasswords.current ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPasswords.current ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  {verifyingPassword && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    </div>
                  )}
                  {!verifyingPassword && currentPasswordVerified && (
                    <div className="absolute right-3 top-2.5">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                {currentPasswordError && (
                  <p className="mt-1 text-xs text-red-600">{currentPasswordError}</p>
                )}
                {currentPasswordVerified && (
                  <p className="mt-1 text-xs text-green-600">✓ 비밀번호가 일치합니다</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={adminPassword.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full px-3 py-2 pr-12 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      !currentPasswordVerified ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                    }`}
                    placeholder="새 비밀번호를 입력하세요"
                    disabled={!currentPasswordVerified}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded disabled:opacity-50"
                    disabled={!currentPasswordVerified}
                    aria-label={showPasswords.new ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPasswords.new ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  8자 이상, 영문과 숫자를 포함해주세요
                </p>
                {!currentPasswordVerified && (
                  <p className="mt-1 text-xs text-amber-600">
                    현재 비밀번호를 먼저 확인해주세요
                  </p>
                )}
                {adminPassword.newPassword && adminPassword.currentPassword && 
                 adminPassword.newPassword === adminPassword.currentPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    ✗ 새 비밀번호는 현재 비밀번호와 달라야 합니다
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={adminPassword.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`w-full px-3 py-2 pr-12 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      !currentPasswordVerified ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                    }`}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    disabled={!currentPasswordVerified}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded disabled:opacity-50"
                    disabled={!currentPasswordVerified}
                    aria-label={showPasswords.confirm ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPasswords.confirm ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 비밀번호 일치 여부 표시 */}
              {currentPasswordVerified && adminPassword.newPassword && adminPassword.confirmPassword && (
                <div className={`text-sm ${
                  adminPassword.newPassword === adminPassword.confirmPassword 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {adminPassword.newPassword === adminPassword.confirmPassword 
                    ? '✓ 새 비밀번호가 일치합니다' 
                    : '✗ 새 비밀번호가 일치하지 않습니다'}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('admin_password')}
                  disabled={
                    isLoading || 
                    !currentPasswordVerified ||
                    !adminPassword.currentPassword || 
                    !adminPassword.newPassword || 
                    !adminPassword.confirmPassword ||
                    adminPassword.newPassword !== adminPassword.confirmPassword ||
                    adminPassword.newPassword.length < 8 ||
                    adminPassword.newPassword === adminPassword.currentPassword
                  }
                  className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-purple-600 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition"
                >
                  {isLoading ? '저장 중...' : '비밀번호 변경'}
                </button>
              </div>
              
              {/* 추가 안내 메시지 */}
              {adminPassword.newPassword && adminPassword.newPassword.length < 8 && (
                <p className="text-xs text-red-500 mt-2">
                  비밀번호는 8자 이상이어야 합니다.
                </p>
              )}
              
              {adminPassword.newPassword && adminPassword.newPassword.length >= 8 && (
                <div className="text-xs mt-2">
                  {!/[a-zA-Z]/.test(adminPassword.newPassword) && (
                    <p className="text-red-500">영문자를 포함해야 합니다.</p>
                  )}
                  {!/[0-9]/.test(adminPassword.newPassword) && (
                    <p className="text-red-500">숫자를 포함해야 합니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 입금계좌 설정 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-semibold text-gray-900">
                    입금계좌 설정
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
                    무통장 입금 계좌 정보를 관리합니다
                  </p>
                </div>
                {savedSection === 'bank_settings' && (
                  <span className="text-green-600 text-xs sm:text-sm font-medium">✓ 저장됨</span>
                )}
              </div>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-4 xl:gap-6 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    은행명
                  </label>
                  <input
                    type="text"
                    value={bankSettings.bankName}
                    onChange={(e) => setBankSettings({...bankSettings, bankName: e.target.value})}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="예: 신한은행"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={bankSettings.accountNumber}
                    onChange={(e) => setBankSettings({...bankSettings, accountNumber: e.target.value})}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="예: 140-015-156616"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    예금주
                  </label>
                  <input
                    type="text"
                    value={bankSettings.accountHolder}
                    onChange={(e) => setBankSettings({...bankSettings, accountHolder: e.target.value})}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="예: 목포플레이파크"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    예금주명
                  </label>
                  <input
                    type="text"
                    value={bankSettings.accountHolderName}
                    onChange={(e) => setBankSettings({...bankSettings, accountHolderName: e.target.value})}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="예: 기업플레이파크"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('bank_settings')}
                  disabled={isLoading}
                  className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-blue-600 text-white text-xs sm:text-sm md:text-base lg:text-sm xl:text-base rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

          {/* 배너 설정 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-semibold text-gray-900">
                    배너 이미지 설정
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
                    모든 페이지에서 사용할 공용 배너 이미지를 설정합니다
                  </p>
                </div>
                {savedSection === 'banner_settings' && (
                  <span className="text-green-600 text-xs sm:text-sm font-medium">✓ 저장됨</span>
                )}
              </div>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6">
              {/* 이미지 업로드 영역 */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-2">
                  배너 이미지 업로드
                </label>
                
                {/* 파일 업로드 버튼 */}
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploadingImage ? '업로드 중...' : '이미지 선택'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                  
                  {uploadingImage && (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm">업로드 중...</span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  최대 10MB (PNG, JPG, WebP)
                </p>
              </div>

              {/* 적용될 페이지 안내 */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="text-xs sm:text-sm font-medium text-blue-800 mb-2">적용될 페이지</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-blue-700">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    소개 페이지
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    시설안내
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    이용안내
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    커뮤니티
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  총 14개 페이지에서 공통 사용됩니다
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('banner_settings')}
                  disabled={isLoading || uploadingImage}
                  className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base transition-colors"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

          {/* 푸터 설정 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-semibold text-gray-900">
                    푸터 설정
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
                    홈페이지 하단에 표시될 회사 정보를 설정합니다
                  </p>
                </div>
                {savedSection === 'footer_settings' && (
                  <span className="text-green-600 text-xs sm:text-sm font-medium">✓ 저장됨</span>
                )}
              </div>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6">
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  푸터 내용
                </label>
                <p className="text-xs text-gray-500 mb-2 sm:mb-3">
                  홈페이지 하단에 표시될 내용을 자유롭게 입력하세요. 줄바꿈과 | 구분자를 사용할 수 있습니다.
                </p>
                <textarea
                  value={footerSettings.footerText}
                  onChange={(e) => setFooterSettings({...footerSettings, footerText: e.target.value})}
                  className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-2 sm:py-3 md:py-4 lg:py-3 xl:py-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical text-xs sm:text-sm md:text-base lg:text-sm xl:text-base"
                  rows={6}
                  placeholder="푸터에 표시할 내용을 입력하세요..."
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('footer_settings')}
                  disabled={isLoading}
                  className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base transition-colors"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

          {/* 요금 설정 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-semibold text-gray-900">
                    요금 설정
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
                    입장권 요금을 설정합니다
                  </p>
                </div>
                {savedSection === 'price_settings' && (
                  <span className="text-green-600 text-xs sm:text-sm font-medium">✓ 저장됨</span>
                )}
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6">
              {/* 모바일 카드형 레이아웃 */}
              <div className="block lg:hidden space-y-4">
                {/* 1시간 카드 */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-center mb-4 text-lg">1시간 이용권</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">어린이</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={priceSettings.child1Hour}
                          onChange={(e) => setPriceSettings({...priceSettings, child1Hour: parseInt(e.target.value)})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold"
                        />
                        <span className="text-sm">원</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">청소년/성인</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={priceSettings.adult1Hour}
                          onChange={(e) => setPriceSettings({...priceSettings, adult1Hour: parseInt(e.target.value)})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold"
                        />
                        <span className="text-sm">원</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">보호자</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={priceSettings.guardian1Hour}
                          onChange={(e) => setPriceSettings({...priceSettings, guardian1Hour: parseInt(e.target.value)})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold"
                        />
                        <span className="text-sm">원</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">비고</label>
                      <input
                        type="text"
                        value={priceSettings.remark1Hour}
                        onChange={(e) => setPriceSettings({...priceSettings, remark1Hour: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        placeholder="1시간 비고 입력"
                      />
                    </div>
                  </div>
                </div>

                {/* 2시간 카드 */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-center mb-4 text-lg">2시간 이용권</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">어린이</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={priceSettings.child2Hour}
                          onChange={(e) => setPriceSettings({...priceSettings, child2Hour: parseInt(e.target.value)})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold"
                        />
                        <span className="text-sm">원</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">청소년/성인</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={priceSettings.adult2Hour}
                          onChange={(e) => setPriceSettings({...priceSettings, adult2Hour: parseInt(e.target.value)})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold"
                        />
                        <span className="text-sm">원</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">보호자</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={priceSettings.guardian2Hour}
                          onChange={(e) => setPriceSettings({...priceSettings, guardian2Hour: parseInt(e.target.value)})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold"
                        />
                        <span className="text-sm">원</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">비고</label>
                      <input
                        type="text"
                        value={priceSettings.remark2Hour}
                        onChange={(e) => setPriceSettings({...priceSettings, remark2Hour: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        placeholder="2시간 비고 입력"
                      />
                    </div>
                  </div>
                </div>

                {/* 연령대 설정 */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-center mb-4 text-lg">연령대 설정</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">어린이 연령대</label>
                      <input
                        type="text"
                        value={priceSettings.childNote}
                        onChange={(e) => setPriceSettings({...priceSettings, childNote: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        placeholder="어린이 연령대"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">청소년/성인 연령대</label>
                      <input
                        type="text"
                        value={priceSettings.adultNote}
                        onChange={(e) => setPriceSettings({...priceSettings, adultNote: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        placeholder="청소년/성인 연령대"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">보호자 안내</label>
                      <input
                        type="text"
                        value={priceSettings.guardianNote}
                        onChange={(e) => setPriceSettings({...priceSettings, guardianNote: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        placeholder="보호자 이용제한"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 데스크톱 테이블 레이아웃 */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300">
                        <th rowSpan={2} className="border-r border-gray-300 p-4 text-center font-medium">종류</th>
                        <th rowSpan={2} className="border-r border-gray-300 p-4 text-center font-medium">이용시간</th>
                        <th colSpan={3} className="border-b border-gray-300 p-2 text-center font-medium">이용요금</th>
                        <th rowSpan={2} className="border-l border-gray-300 p-4 text-center font-medium">비고</th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-300">
                        <th className="border-r border-gray-300 p-2 text-center text-sm">
                          어린이<br />
                          <input
                            type="text"
                            value={priceSettings.childNote}
                            onChange={(e) => setPriceSettings({...priceSettings, childNote: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs mt-1 bg-white"
                            placeholder="연령대"
                          />
                        </th>
                        <th className="border-r border-gray-300 p-2 text-center text-sm">
                          청소년 및 성인<br />
                          <input
                            type="text"
                            value={priceSettings.adultNote}
                            onChange={(e) => setPriceSettings({...priceSettings, adultNote: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs mt-1 bg-white"
                            placeholder="연령대"
                          />
                        </th>
                        <th className="p-2 text-center text-sm">
                          보호자<br />
                          <input
                            type="text"
                            value={priceSettings.guardianNote}
                            onChange={(e) => setPriceSettings({...priceSettings, guardianNote: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs mt-1 bg-white"
                            placeholder="이용제한"
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td rowSpan={2} className="border-r border-gray-300 p-4 text-center font-medium">일반<br />요금</td>
                        <td className="border-r border-gray-300 p-4 text-center">1시간</td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.child1Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, child1Hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.adult1Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, adult1Hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.guardian1Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, guardian1Hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="text"
                            value={priceSettings.remark1Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, remark1Hour: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-center text-sm bg-white"
                            placeholder="1시간 비고 입력"
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="border-r border-gray-300 p-4 text-center">2시간</td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.child2Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, child2Hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.adult2Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, adult2Hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.guardian2Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, guardian2Hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="text"
                            value={priceSettings.remark2Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, remark2Hour: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-center text-sm bg-white"
                            placeholder="2시간 비고 입력"
                          />
                        </td>
                      </tr>
                      
                      {/* 감면 요금 추가 */}
                      <tr className="border-b border-gray-300">
                        <td rowSpan={2} className="border-r border-gray-300 p-4 text-center font-medium bg-orange-50">감면<br />요금</td>
                        <td className="border-r border-gray-300 p-4 text-center">1시간</td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.discount_child_1hour}
                            onChange={(e) => setPriceSettings({...priceSettings, discount_child_1hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.discount_adult_1hour}
                            onChange={(e) => setPriceSettings({...priceSettings, discount_adult_1hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.guardian1Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, guardian1Hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                            disabled
                          />
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm text-gray-500">일반과 동일</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-r border-gray-300 p-4 text-center">2시간</td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.discount_child_2hour}
                            onChange={(e) => setPriceSettings({...priceSettings, discount_child_2hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.discount_adult_2hour}
                            onChange={(e) => setPriceSettings({...priceSettings, discount_adult_2hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="border-r border-gray-300 p-4 text-center">
                          <input
                            type="number"
                            value={priceSettings.guardian2Hour}
                            onChange={(e) => setPriceSettings({...priceSettings, guardian2Hour: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-bold"
                            disabled
                          />
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm text-gray-500">일반과 동일</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 sm:mt-6">
                <button
                  onClick={() => handleSave('price_settings')}
                  disabled={isLoading}
                  className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base transition-colors"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

          {/* 운영 설정 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl font-semibold text-gray-900">
                    운영 설정
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-600">
                    운영 시간과 휴무일을 설정합니다
                  </p>
                </div>
                {savedSection === 'operation_settings' && (
                  <span className="text-green-600 text-xs sm:text-sm font-medium">✓ 저장됨</span>
                )}
              </div>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6 lg:p-4 xl:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-4 xl:gap-6 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    개장 시간
                  </label>
                  <input
                    type="time"
                    value={operationSettings.openTime}
                    onChange={(e) => setOperationSettings({...operationSettings, openTime: e.target.value})}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    폐장 시간
                  </label>
                  <input
                    type="time"
                    value={operationSettings.closeTime}
                    onChange={(e) => setOperationSettings({...operationSettings, closeTime: e.target.value})}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
                
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    입장 마감
                  </label>
                  <input
                    type="time"
                    value={operationSettings.lastEntry}
                    onChange={(e) => setOperationSettings({...operationSettings, lastEntry: e.target.value})}
                    className="w-full px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  휴무일 설정
                </label>
                
                {/* 정기 휴무일 (요일) */}
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-600 mb-2">
                    정기 휴무일 (매주)
                  </h4>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => handleClosedDayToggle(index)}
                        className={`p-2 sm:p-3 md:p-4 lg:p-3 xl:p-4 rounded-md font-medium transition-colors text-xs sm:text-sm md:text-base lg:text-sm xl:text-base ${
                          operationSettings.closedDays.includes(index)
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.slice(0, 1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                    선택된 요일에는 매주 예약이 불가능합니다
                  </p>
                </div>

                {/* 특별 휴무일 (특정 날짜) */}
                <div>
                  <h4 className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium text-gray-600 mb-2">
                    특별 휴무일 (특정 날짜)
                  </h4>
                  <div className="space-y-2">
                    {(operationSettings.specialClosedDates || []).map((date, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => {
                            const newDates = [...(operationSettings.specialClosedDates || [])]
                            newDates[index] = e.target.value
                            setOperationSettings({...operationSettings, specialClosedDates: newDates})
                          }}
                          className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                        />
                        <button
                          onClick={() => {
                            const newDates = (operationSettings.specialClosedDates || []).filter((_, i) => i !== index)
                            setOperationSettings({...operationSettings, specialClosedDates: newDates})
                          }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded text-xs sm:text-sm hover:bg-red-600 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newDates = [...(operationSettings.specialClosedDates || []), '']
                        setOperationSettings({...operationSettings, specialClosedDates: newDates})
                      }}
                      className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm transition-colors"
                    >
                      + 특별 휴무일 추가
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                    공휴일이나 임시 휴무일을 설정할 수 있습니다
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('operation_settings')}
                  disabled={isLoading}
                  className="px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 text-xs sm:text-sm md:text-base lg:text-sm xl:text-base transition-colors"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}