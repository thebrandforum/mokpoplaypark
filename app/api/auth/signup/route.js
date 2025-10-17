// app/api/auth/signup/route.js
// 회원가입 API

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// POST - 회원가입
export async function POST(request) {
  try {
    console.log('🔥 회원가입 API 호출됨')
    
    const body = await request.json()
    console.log('📋 요청 데이터:', body)

    const {
      user_id,
      email,
      password,
      name,
      phone,
      marketing_agree,
      terms_agree,
      privacy_agree
    } = body

    // 필수 필드 검증
    if (!user_id || !email || !password || !name || !phone) {
      return Response.json({
        success: false,
        message: '필수 정보를 모두 입력해주세요.',
        error: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 })
    }

    // 아이디 형식 검증
    const userIdRegex = /^[a-zA-Z0-9]{4,20}$/
    if (!userIdRegex.test(user_id)) {
      return Response.json({
        success: false,
        message: '아이디는 영문, 숫자 4-20자로 입력해주세요.',
        error: 'INVALID_USER_ID_FORMAT'
      }, { status: 400 })
    }

    // 약관 동의 검증
    if (!terms_agree || !privacy_agree) {
      return Response.json({
        success: false,
        message: '필수 약관에 동의해주세요.',
        error: 'TERMS_NOT_AGREED'
      }, { status: 400 })
    }

    // 아이디 중복 확인
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', user_id)
      .single()

    if (existingUser) {
      return Response.json({
        success: false,
        message: '이미 사용중인 아이디입니다.',
        error: 'USER_ID_ALREADY_EXISTS'
      }, { status: 409 })
    }

    // Supabase Auth 회원가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_id,
          name,
          phone,
          marketing_agree: marketing_agree || false,
          terms_agree: terms_agree || false,
          privacy_agree: privacy_agree || false
        }
      }
    })

    if (authError) {
      console.error('❌ Auth 회원가입 오류:', authError)
      
      // 상세한 에러 메시지 처리
      if (authError.message.includes('already registered')) {
        return Response.json({
          success: false,
          message: '이미 가입된 이메일입니다.',
          error: 'EMAIL_ALREADY_EXISTS'
        }, { status: 409 })
      }
      
      return Response.json({
        success: false,
        message: '회원가입에 실패했습니다: ' + authError.message,
        error: authError.message
      }, { status: 400 })
    }

    console.log('✅ Auth 회원가입 성공:', authData.user.email)

    // public.users 테이블에 프로필 정보 저장
    // 잠시 기다린 후 저장 (Auth 사용자 생성 완료 대기)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        user_id,
        email,
        name,
        phone,
        marketing_agree: marketing_agree || false,
        terms_agree: terms_agree || false,
        privacy_agree: privacy_agree || false
      })

    if (profileError) {
      console.error('❌ 프로필 생성 오류:', profileError)
      // Auth 사용자는 생성되었지만 프로필 생성 실패
      // 이 경우도 성공으로 처리하고 나중에 프로필 완성하도록 안내
    }

    console.log('✅ 회원가입 성공:', authData.user.email)

    return Response.json({
      success: true,
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name
        }
      }
    })

  } catch (error) {
    console.error('❌ 회원가입 처리 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// ================================================================
// app/api/auth/check-userid/route.js  
// 아이디 중복 확인 API

// GET - 아이디 중복 확인
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return Response.json({
        success: false,
        message: '아이디를 입력해주세요.',
        error: 'USER_ID_REQUIRED'
      }, { status: 400 })
    }

    // 아이디 형식 검증
    const userIdRegex = /^[a-zA-Z0-9]{4,20}$/
    if (!userIdRegex.test(user_id)) {
      return Response.json({
        success: false,
        message: '아이디는 영문, 숫자 4-20자로 입력해주세요.',
        error: 'INVALID_USER_ID_FORMAT',
        available: false
      }, { status: 400 })
    }

    // Supabase에서 아이디 중복 확인
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', user_id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = 데이터 없음
      console.error('❌ 아이디 확인 오류:', error)
      return Response.json({
        success: false,
        message: '아이디 확인 중 오류가 발생했습니다.',
        error: error.message
      }, { status: 500 })
    }

    const isAvailable = !existingUser

    return Response.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? '사용 가능한 아이디입니다.' : '이미 사용중인 아이디입니다.'
    })

  } catch (error) {
    console.error('❌ 아이디 확인 처리 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}