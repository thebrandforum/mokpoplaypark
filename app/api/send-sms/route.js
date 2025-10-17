// app/api/send-sms/route.js
// SMS 발송 API - 예약 확인 페이지 링크 포함 SMS 발송

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// 기본 SMS 설정 - 새로운 API 키로 업데이트
function getDefaultSMSSettings() {
  return {
    smsEnabled: true,
    smsTestMode: false, // 실제 발송 모드
    smsApiKey: 'NCSFYS9U4DJ28B0W',
    smsApiSecret: 'PQONWTVEQPCISAA8TUDOWLKVZAFAL3LH',
    smsFromNumber: '07051291671',
    smsTemplate: null
  }
}

// 관리자 설정에서 SMS 설정 가져오기
async function getSMSSettings() {
  try {
    console.log('SMS 설정 조회 중...')
    
    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'notification_settings')
      .single()
    
    if (error) {
      console.log('SMS 설정 조회 실패, 기본값 사용:', error.message)
      return getDefaultSMSSettings()
    }
    
    if (settings && settings.setting_value) {
      console.log('SMS 설정 조회 성공')
      // 데이터베이스 설정이 있어도 실제 발송 모드로 강제 변경
      const dbSettings = settings.setting_value
      return {
        ...dbSettings,
        smsTestMode: false // 강제로 실제 발송 모드
      }
    }
    
    console.log('SMS 설정 없음, 기본값 사용')
    return getDefaultSMSSettings()
    
  } catch (error) {
    console.error('SMS 설정 조회 오류:', error)
    return getDefaultSMSSettings()
  }
}

// Cool SMS SDK를 사용한 실제 SMS 발송 (간단한 SMS만)
async function sendRealSMS(phoneNumber, message, smsSettings) {
  try {
    console.log('Cool SMS SDK 호출 시작...')
    
    // SMS 설정 검증
    if (!smsSettings || !smsSettings.smsEnabled) {
      return { 
        success: false, 
        error: 'SMS 알림이 비활성화되어 있습니다.' 
      }
    }

    if (!smsSettings.smsApiKey || !smsSettings.smsApiSecret || !smsSettings.smsFromNumber) {
      return { 
        success: false, 
        error: 'Cool SMS 설정이 완료되지 않았습니다.' 
      }
    }

    // 실제 Cool SMS 발송 (solapi 5.4.0 사용)
    try {
      const { SolapiMessageService } = await import('solapi')
      
      const messageService = new SolapiMessageService(
        smsSettings.smsApiKey, 
        smsSettings.smsApiSecret
      )
      
      console.log('Cool SMS solapi 5.4.0 설정:')
      console.log('- API Key:', smsSettings.smsApiKey?.substring(0, 8) + '...')
      console.log('- 발신번호:', smsSettings.smsFromNumber)
      console.log('- SMS 모드 (예약 확인 링크 포함)')
      
      // 간단한 SMS 발송
      const messageOptions = {
        to: phoneNumber,
        from: smsSettings.smsFromNumber,
        text: message
      }
      
      const result = await messageService.sendOne(messageOptions)
      
      console.log('Cool SMS solapi 응답:', result)
      
      if (result.statusCode === '2000' || result.status === 'success') {
        console.log('실제 SMS 발송 성공!')
        return { success: true, result }
      } else {
        console.log('SMS 발송 실패:', result)
        return { success: false, error: result }
      }
      
    } catch (smsError) {
      console.error('Cool SMS SDK 오류:', smsError)
      return { 
        success: false, 
        error: `SMS 발송 실패: ${smsError.message}`
      }
    }
    
  } catch (error) {
    console.error('SMS 발송 전체 오류:', error)
    return { success: false, error: error.message }
  }
}

// SMS 메시지 템플릿 처리 (예약 확인 페이지 링크 포함)
function processMessageTemplate(template, data) {
  if (!template) {
    let message = `목포 플레이파크 예약 완료!

예약번호: ${data.reservationId}
예약자명: ${data.customerName}
이용월: ${data.visitDate}`

    // cartItems가 있으면 상세 티켓 정보 표시
    if (data.cartItems && data.cartItems.length > 0) {
      message += '\n\n[예약 티켓]'
      data.cartItems.forEach(item => {
        // 티켓 이름에 (일반) 또는 (감면) 추가
        const ticketType = item.name.includes('감면') ? '(감면)' : '(일반)'
        const displayName = item.name.includes('감면') || item.name.includes('일반') 
          ? item.name 
          : `${item.name} ${ticketType}`
        message += `\n• ${displayName}: ${item.count}매`
      })
      message += `\n--------------`
    } else {
      // 기존 방식 (cartItems가 없을 때)
      message += `\n이용인원: ${(data.adultCount || 0) + (data.childCount || 0)}명`
    }
    
    message += `\n총 결제금액: ${data.totalAmount?.toLocaleString() || 0}원`
    message += '\n\n현장에서 예약번호를 제시해주세요!'

    // 예약 확인 페이지 링크 추가
    if (data.baseUrl) {
      message += `\n\n 예약 확인: /reservation-check?id=${data.reservationId}`
    }


    return message
  }

  // 템플릿 변수 치환
  return template
    .replace(/\{reservationId\}/g, data.reservationId || '')
    .replace(/\{customerName\}/g, data.customerName || '')
    .replace(/\{visitDate\}/g, data.visitDate || '')
    .replace(/\{totalAmount\}/g, data.totalAmount?.toLocaleString() || '0')
    .replace(/\{adultCount\}/g, data.adultCount || 0)
    .replace(/\{childCount\}/g, data.childCount || 0)
    .replace(/\{contactPhone\}/g, '054-639-4842')
    .replace(/\{reservationUrl\}/g, data.baseUrl ? `${data.baseUrl}/reservation-check?id=${data.reservationId}` : '')
}


// POST - SMS 발송 API (예약 확인 페이지 링크 포함)
export async function POST(request) {
  try {
    console.log('=== Cool SMS API 시작 (예약 확인 링크 포함) ===')
    
    const body = await request.json()
    console.log('받은 데이터:', {
      phoneNumber: body.phoneNumber,
      reservationId: body.reservationId,
      customerName: body.customerName,
      hasCartItems: !!(body.cartItems && body.cartItems.length > 0)
    })
    
    const { 
      phoneNumber, 
      reservationId, 
      customerName, 
      visitDate, 
      adultCount,
      childCount,
      totalAmount,
      customMessage,
      cartItems   // cartItems 추가
    } = body

    // 필수 데이터 검증
    if (!phoneNumber) {
      return Response.json({
        success: false,
        message: 'Phone number is required'
      }, { status: 400 })
    }

    // 전화번호 정규화 및 검증
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
    if (!/^010\d{8}$/.test(cleanPhone)) {
      return Response.json({
        success: false,
        message: 'Invalid phone number format'
      }, { status: 400 })
    }

    console.log('정규화된 전화번호:', cleanPhone)

    // SMS 설정 조회
    const smsSettings = await getSMSSettings()
    
    console.log('SMS 설정 상태:', {
      hasSettings: !!smsSettings,
      smsEnabled: smsSettings?.smsEnabled,
      hasApiKey: !!smsSettings?.smsApiKey,
      hasApiSecret: !!smsSettings?.smsApiSecret,
      hasFromNumber: !!smsSettings?.smsFromNumber,
      testMode: smsSettings?.smsTestMode // false여야 함
    })

    // Base URL 생성
    const host = request.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // SMS 메시지 생성 (예약 확인 페이지 링크 포함)
    let smsMessage
    
    if (customMessage) {
      smsMessage = customMessage
    } else {
      const templateData = {
        reservationId,
        customerName,
        visitDate,
        adultCount,
        childCount,
        totalAmount,
        cartItems,   // cartItems 추가
        baseUrl      // baseUrl 추가
      }
      smsMessage = processMessageTemplate(smsSettings?.smsTemplate, templateData)
    }

    console.log('SMS 메시지 준비:')
    console.log('- 받는번호:', cleanPhone)
    console.log('- 메시지 길이:', smsMessage.length + '자')
    console.log('- 예약 확인 링크 포함:', !!baseUrl)

    // 실제 SMS 발송
    const smsResult = await sendRealSMS(cleanPhone, smsMessage, smsSettings)
    
    if (smsResult.success) {
      console.log('SMS 처리 완료!')
      return Response.json({
        success: true,
        message: 'SMS sent successfully with reservation check link',
        data: {
          messageId: smsResult.result.messageId,
          to: cleanPhone,
          statusMessage: smsResult.result.statusMessage,
          testMode: false,
          realSMS: true,
          hasReservationLink: !!baseUrl
        }
      })
    } else {
      console.log('SMS 발송 실패')
      return Response.json({
        success: false,
        message: 'SMS sending failed',
        error: smsResult.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('SMS API 처리 오류:', error)
    
    return Response.json({
      success: false,
      message: 'SMS API processing failed',
      error: error.message
    }, { status: 500 })
  }
}

// GET - SMS API 상태 확인
export async function GET() {
  try {
    console.log('SMS API 상태 확인...')
    
    const smsSettings = await getSMSSettings()
    
    return Response.json({ 
      message: 'Cool SMS API ready with reservation check link support',
      status: 'ready',
      configured: !!smsSettings && !!smsSettings.smsApiKey,
      testMode: false, // 실제 발송 모드
      enabled: smsSettings?.smsEnabled || false,
      realSMS: true,
      reservationLinkSupport: true, // 예약 확인 링크 지원
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('SMS API 상태 확인 오류:', error)
    
    return Response.json({
      message: 'SMS API configuration error',
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}