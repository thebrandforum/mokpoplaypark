// app/api/admin/settings/route.js 수정
// 관리자 설정 API - bank_settings 추가

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 관리자 설정 조회
export async function GET(request) {
  try {
    console.log('📖 관리자 설정 조회 요청...')

    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ 설정 조회 오류:', error)
      throw new Error(`설정 조회 실패: ${error.message}`)
    }

    console.log(`📊 조회된 설정: ${settings.length}개`)

    // 설정을 객체로 변환
    const settingsObject = {}
    settings.forEach(setting => {
      settingsObject[setting.setting_key] = setting.setting_value
    })

    console.log('✅ 설정 조회 성공')

    return Response.json({
      success: true,
      message: '설정을 성공적으로 불러왔습니다.',
      data: settingsObject
    })

  } catch (error) {
    console.error('❌ 관리자 설정 조회 중 오류:', error)
    
    if (error.message && error.message.includes('fetch failed')) {
      return Response.json({
        success: false,
        message: 'Network connection failed',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }

    return Response.json({
      success: false,
      message: '설정 조회 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// POST - 관리자 설정 저장/업데이트
export async function POST(request) {
  try {
    console.log('💾 관리자 설정 저장 요청...')
    
    const body = await request.json()
    const { section, data } = body

    console.log('📝 저장할 설정:', { section, data })

    // 입력 데이터 검증
    if (!section || !data) {
      return Response.json({
        success: false,
        message: 'section과 data가 필요합니다.'
      }, { status: 400 })
    }

    // 허용된 섹션인지 확인 - bank_settings 추가!
    const allowedSections = [
      'price_settings', 
      'operation_settings', 
      'footer_settings',
      'banner_settings',
      'bank_settings',
      'payment_settings',
	  'cancellation_settings',	
      'admin_password'
    ]
    
    if (!allowedSections.includes(section)) {
      return Response.json({
        success: false,
        message: `허용되지 않은 섹션입니다: ${section}`
      }, { status: 400 })
    }

    // admin_password 섹션 특별 처리
    if (section === 'admin_password') {
      console.log('🔐 관리자 비밀번호 변경 요청...')
      
      // 객체로 받은 데이터 확인
      const { currentPassword, newPassword } = data
      
      if (!currentPassword || !newPassword) {
        return Response.json({
          success: false,
          message: '현재 비밀번호와 새 비밀번호가 필요합니다.'
        }, { status: 400 })
      }
      
      // 현재 비밀번호 확인
      const { data: currentSettings, error: fetchError } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'admin_password')
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ 현재 비밀번호 조회 오류:', fetchError)
        throw new Error('현재 비밀번호 확인 중 오류가 발생했습니다.')
      }
      
      // 기본 비밀번호 또는 저장된 비밀번호
      const storedPassword = currentSettings?.setting_value || 'admin1234'
      
      console.log('🔍 비밀번호 확인 중...')
      if (currentPassword !== storedPassword) {
        console.log('❌ 현재 비밀번호 불일치')
        return Response.json({
          success: false,
          message: '현재 비밀번호가 올바르지 않습니다.'
        }, { status: 401 })
      }
      
      console.log('✅ 현재 비밀번호 확인 완료')
      
      // 새 비밀번호 검증
      const validationResult = validateAdminPassword(newPassword)
      if (!validationResult.valid) {
        return Response.json({
          success: false,
          message: `새 비밀번호 검증 실패: ${validationResult.message}`
        }, { status: 400 })
      }
      
      // 비밀번호 업데이트 - newPassword만 저장
      const { data: result, error: updateError } = await supabase
        .from('settings')
        .upsert({
          setting_key: 'admin_password',
          setting_value: newPassword,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        })
        .select()
      
      if (updateError) {
        console.error('❌ 비밀번호 업데이트 오류:', updateError)
        throw new Error('비밀번호 업데이트 실패')
      }
      
      console.log('✅ 비밀번호 변경 성공')
      
      return Response.json({
        success: true,
        message: '관리자 비밀번호가 성공적으로 변경되었습니다.',
        data: {
          section: 'admin_password',
          updatedAt: new Date().toISOString()
        }
      })
    }

    // 다른 섹션의 경우 기존 로직 사용
    // 섹션별 데이터 검증
    const validationResult = validateSectionData(section, data)
    if (!validationResult.valid) {
      return Response.json({
        success: false,
        message: `데이터 검증 실패: ${validationResult.message}`
      }, { status: 400 })
    }

    console.log('✅ 데이터 검증 통과')

    // Supabase upsert (insert or update)
    const { data: result, error } = await supabase
      .from('settings')
      .upsert({
        setting_key: section,
        setting_value: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select()

    if (error) {
      console.error('❌ 설정 저장 오류:', error)
      throw new Error(`설정 저장 실패: ${error.message}`)
    }

    console.log('✅ 설정 저장 성공:', result)

    return Response.json({
      success: true,
      message: `${getSectionDisplayName(section)} 설정이 저장되었습니다.`,
      data: {
        section: section,
        savedData: data,
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 관리자 설정 저장 중 오류:', error)
    
    if (error.message.includes('fetch failed')) {
      return Response.json({
        success: false,
        message: '네트워크 오류로 설정을 저장할 수 없습니다.',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }

    return Response.json({
      success: false,
      message: '설정 저장 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// ============================================
// 유틸리티 함수들
// ============================================

// 섹션별 데이터 검증
function validateSectionData(section, data) {
  try {
    switch (section) {
      case 'price_settings':
        return validatePriceSettings(data)
      case 'operation_settings':
        return validateOperationSettings(data)
      case 'footer_settings':
        return validateFooterSettings(data)
      case 'banner_settings':
        return validateBannerSettings(data)
      case 'bank_settings':
        return validateBankSettings(data)
      case 'payment_settings':
        return validatePaymentSettings(data)
      case 'cancellation_settings':  // 🆕 추가!
        return validateCancellationSettings(data)
      case 'admin_password':
        return { valid: true }
      default:
        return { valid: false, message: '알 수 없는 섹션입니다.' }
    }
  } catch (error) {
    return { valid: false, message: `검증 중 오류: ${error.message}` }
  }
}

// 요금 설정 검증
function validatePriceSettings(data) {
  // priceImage 검증 (있으면)
  if (data.priceImage !== undefined && typeof data.priceImage !== 'string') {
    return { valid: false, message: 'priceImage는 문자열이어야 합니다.' }
  }
  
  // 숫자 필드 검증 (있으면)
  const numericFields = ['child1Hour', 'child2Hour', 'adult1Hour', 'adult2Hour', 'guardian1Hour', 'guardian2Hour']
  
  for (const field of numericFields) {
    if (data[field] !== undefined && (typeof data[field] !== 'number' || data[field] < 0)) {
      return { valid: false, message: `${field}는 0 이상의 숫자여야 합니다.` }
    }
  }
  
  return { valid: true }
}

// 운영 설정 검증
function validateOperationSettings(data) {
  // 시간 형식 검증 (HH:MM)
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  
  if (!timePattern.test(data.openTime)) {
    return { valid: false, message: '개장 시간 형식이 올바르지 않습니다. (HH:MM)' }
  }
  
  if (!timePattern.test(data.closeTime)) {
    return { valid: false, message: '폐장 시간 형식이 올바르지 않습니다. (HH:MM)' }
  }
  
  if (!timePattern.test(data.lastEntry)) {
    return { valid: false, message: '입장 마감 시간 형식이 올바르지 않습니다. (HH:MM)' }
  }
  
  // 휴무일 검증
  if (!Array.isArray(data.closedDays)) {
    return { valid: false, message: '휴무일은 배열이어야 합니다.' }
  }
  
  for (const day of data.closedDays) {
    if (typeof day !== 'number' || day < 0 || day > 6) {
      return { valid: false, message: '휴무일은 0-6 사이의 숫자여야 합니다.' }
    }
  }
  
  return { valid: true }
}

// 푸터 설정 검증
function validateFooterSettings(data) {
  // leftText 검증
  if (typeof data.leftText !== 'string') {
    return { valid: false, message: '좌측 텍스트는 문자열이어야 합니다.' }
  }
  
  if (data.leftText.length > 10000) {
    return { valid: false, message: '좌측 텍스트는 10000자를 초과할 수 없습니다.' }
  }
  
  // rightText 검증
  if (typeof data.rightText !== 'string') {
    return { valid: false, message: '우측 텍스트는 문자열이어야 합니다.' }
  }
  
  if (data.rightText.length > 10000) {
    return { valid: false, message: '우측 텍스트는 10000자를 초과할 수 없습니다.' }
  }
  
  return { valid: true }
}

// 배너 설정 검증
function validateBannerSettings(data) {
  if (typeof data.commonBanner !== 'string') {
    return { valid: false, message: '배너 이미지 경로는 문자열이어야 합니다.' }
  }
  
  if (data.commonBanner.length > 500) {
    return { valid: false, message: '배너 이미지 경로는 500자를 초과할 수 없습니다.' }
  }
  
  // URL 형식 검증 (선택적)
  if (data.commonBanner && !data.commonBanner.startsWith('/') && !data.commonBanner.startsWith('http')) {
    return { valid: false, message: '배너 이미지 경로는 올바른 URL 형식이어야 합니다.' }
  }
  
  return { valid: true }
}

// 입금계좌 설정 검증
function validateBankSettings(data) {
  const requiredFields = ['bankName', 'accountNumber', 'accountHolder', 'accountHolderName']
  
  for (const field of requiredFields) {
    if (typeof data[field] !== 'string') {
      return { valid: false, message: `${field}는 문자열이어야 합니다.` }
    }
    
    if (!data[field].trim()) {
      return { valid: false, message: `${field}는 필수 입력 사항입니다.` }
    }
    
    if (data[field].length > 100) {
      return { valid: false, message: `${field}는 100자를 초과할 수 없습니다.` }
    }
  }
  
  // 계좌번호 형식 검증 (숫자와 하이픈만 허용)
  const accountPattern = /^[0-9\-]+$/
  if (!accountPattern.test(data.accountNumber)) {
    return { valid: false, message: '계좌번호는 숫자와 하이픈(-)만 입력 가능합니다.' }
  }
  
  return { valid: true }
}

// 결제 설정 검증
function validatePaymentSettings(data) {
  // isPaymentBlocked 검증
  if (typeof data.isPaymentBlocked !== 'boolean') {
    return { valid: false, message: 'isPaymentBlocked는 boolean 타입이어야 합니다.' }
  }
  
  // blockMessage 검증
  if (typeof data.blockMessage !== 'string') {
    return { valid: false, message: 'blockMessage는 문자열이어야 합니다.' }
  }
  
  if (data.blockMessage.length > 500) {
    return { valid: false, message: '차단 메시지는 500자를 초과할 수 없습니다.' }
  }
  
  return { valid: true }
}

// 관리자 비밀번호 검증 (새 비밀번호만)
function validateAdminPassword(password) {
  // 문자열인지 확인
  if (typeof password !== 'string') {
    return { valid: false, message: '비밀번호는 문자열이어야 합니다.' }
  }
  
  // 최소 길이 확인 (8자로 변경)
  if (password.length < 8) {
    return { valid: false, message: '비밀번호는 8자 이상이어야 합니다.' }
  }
  
  // 최대 길이 확인
  if (password.length > 50) {
    return { valid: false, message: '비밀번호는 50자를 초과할 수 없습니다.' }
  }
  
  // 영문과 숫자 포함 확인
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: '비밀번호는 영문과 숫자를 모두 포함해야 합니다.' }
  }
  
  return { valid: true }
}

// 섹션 표시 이름
function getSectionDisplayName(section) {
  const names = {
    'price_settings': '요금 설정',
    'operation_settings': '운영 설정',
    'footer_settings': '푸터 설정',
    'banner_settings': '배너 설정',
    'bank_settings': '입금계좌 설정',
    'payment_settings': '결제 설정',
    'cancellation_settings': '취소 정책 설정', 
    'admin_password': '관리자 비밀번호'
  }
  
  return names[section] || section
}

// 취소 정책 설정 검증
function validateCancellationSettings(data) {
  // defaultCancelType 검증
  if (typeof data.defaultCancelType !== 'string') {
    return { valid: false, message: 'defaultCancelType는 문자열이어야 합니다.' }
  }
  
  if (!['simple', 'refund'].includes(data.defaultCancelType)) {
    return { valid: false, message: 'defaultCancelType는 "simple" 또는 "refund"여야 합니다.' }
  }
  
  // showBothButtons 검증
  if (typeof data.showBothButtons !== 'boolean') {
    return { valid: false, message: 'showBothButtons는 boolean 타입이어야 합니다.' }
  }
  
  // 버튼 라벨 검증
  if (typeof data.simpleCancelLabel !== 'string' || data.simpleCancelLabel.length > 20) {
    return { valid: false, message: '단순취소 버튼명은 20자 이하 문자열이어야 합니다.' }
  }
  
  if (typeof data.refundCancelLabel !== 'string' || data.refundCancelLabel.length > 20) {
    return { valid: false, message: '환불취소 버튼명은 20자 이하 문자열이어야 합니다.' }
  }
  
  return { valid: true }
}