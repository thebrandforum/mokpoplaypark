// app/api/auth/find-password/route.js
// 아이디와 전화번호 기반 비밀번호 찾기 API

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// POST - 비밀번호 찾기
export async function POST(request) {
  try {
    console.log('🔍 비밀번호 찾기 요청 시작...')
    
    const body = await request.json()
    const { user_id, phone } = body
    
    console.log('📋 요청 정보:', { user_id, phone })

    // 필수 필드 검증
    if (!user_id || !phone) {
      return Response.json({
        success: false,
        message: '아이디와 전화번호를 모두 입력해주세요.'
      }, { status: 400 })
    }

    // 전화번호 형식 정규화
    const cleanPhone = phone.replace(/[^\d]/g, '')
    
    // 전화번호 검증
    if (!/^010\d{8}$/.test(cleanPhone)) {
      return Response.json({
        success: false,
        message: '올바른 전화번호 형식으로 입력해주세요.'
      }, { status: 400 })
    }

    // 아이디로 사용자 찾기
    console.log('🔍 아이디로 사용자 검색:', user_id)
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, phone, status, user_id')
      .eq('user_id', user_id)
      .single()

    if (userError || !userData) {
      console.log('❌ 아이디를 찾을 수 없음')
      return Response.json({
        success: false,
        message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    console.log('✅ 사용자 발견:', userData.email)

    // 전화번호 일치 확인 (다양한 형식 허용)
    const phoneFormats = [
      phone,
      cleanPhone,
      `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,7)}-${cleanPhone.slice(7)}`,
      `${cleanPhone.slice(0,3)}${cleanPhone.slice(3,7)}${cleanPhone.slice(7)}`
    ]

    let phoneMatched = false
    for (const phoneFormat of phoneFormats) {
      if (userData.phone === phoneFormat) {
        phoneMatched = true
        break
      }
    }

    if (!phoneMatched) {
      console.log('❌ 전화번호가 일치하지 않음')
      return Response.json({
        success: false,
        message: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 계정 상태 확인
    if (userData.status !== 'active') {
      return Response.json({
        success: false,
        message: '비활성화된 계정입니다. 고객센터로 문의해주세요.'
      }, { status: 403 })
    }

    // 임시 비밀번호 생성 (8자리: 영문대문자+숫자)
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let tempPassword = ''
      for (let i = 0; i < 8; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return tempPassword
    }

    const tempPassword = generateTempPassword()
    console.log('🔑 임시 비밀번호 생성됨:', tempPassword)

    // Supabase Auth로 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userData.id,
      { password: tempPassword }
    )

    if (updateError) {
      console.error('❌ 비밀번호 업데이트 실패:', updateError)
      return Response.json({
        success: false,
        message: '임시 비밀번호 설정에 실패했습니다.'
      }, { status: 500 })
    }

    console.log('✅ 비밀번호 업데이트 성공')

    // SMS 발송
    try {
      const host = request.headers.get('host')
      const protocol = host?.includes('localhost') ? 'http' : 'https'
      const smsUrl = `${protocol}://${host}/api/send-sms`
      
      console.log('📱 SMS 발송 시작...')
      
      const smsResponse = await fetch(smsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          messageType: 'find_password',
          customMessage: `목포플레이파크 임시 비밀번호

안녕하세요, ${userData.name}님!
요청하신 임시 비밀번호를 발송해드립니다.

🔑 임시 비밀번호: ${tempPassword}

보안을 위해 로그인 후 즉시 새로운 비밀번호로 변경해주세요.

문의전화: 00-0000-0000
목포플레이파크`
        })
      })

      const smsResult = await smsResponse.json()
      
      if (smsResult.success) {
        console.log('✅ SMS 발송 성공')
      } else {
        console.error('❌ SMS 발송 실패:', smsResult.message)
        // SMS 실패해도 비밀번호는 변경되었으므로 성공으로 처리
      }

    } catch (smsError) {
      console.error('❌ SMS 발송 요청 오류:', smsError)
      // SMS 실패해도 비밀번호는 변경되었으므로 성공으로 처리
    }

    // 성공 응답 (보안상 임시 비밀번호는 응답에 포함하지 않음)
    return Response.json({
      success: true,
      message: '임시 비밀번호가 SMS로 발송되었습니다.',
      data: {
        phone: phone,
        name: userData.name
      }
    })

  } catch (error) {
    console.error('❌ 비밀번호 찾기 처리 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}