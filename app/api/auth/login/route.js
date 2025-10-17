// app/api/auth/login/route.js
// 로그인 API

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// POST - 로그인
export async function POST(request) {
  try {
    console.log('🔐 로그인 API 호출됨')
    
    const body = await request.json()
    console.log('📋 로그인 요청 데이터:', { ...body, password: '***' })

    const { user_id, password, remember_me } = body

    // 필수 필드 검증
    if (!user_id || !password) {
      return Response.json({
        success: false,
        message: '아이디와 비밀번호를 모두 입력해주세요.',
        error: 'MISSING_CREDENTIALS'
      }, { status: 400 })
    }

    // 아이디로 사용자 이메일 찾기
    console.log('🔍 사용자 조회 시작:', user_id)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name, role, status, id')
      .eq('user_id', user_id)
      .single()

    console.log('📊 사용자 조회 결과:', { userData, userError })

    if (userError || !userData) {
      console.error('❌ 사용자 조회 오류:', userError)
      return Response.json({
        success: false,
        message: '존재하지 않는 아이디입니다.',
        error: 'USER_NOT_FOUND'
      }, { status: 404 })
    }

    // 계정 상태 확인
    if (userData.status !== 'active') {
      return Response.json({
        success: false,
        message: '비활성화된 계정입니다. 관리자에게 문의해주세요.',
        error: 'ACCOUNT_INACTIVE'
      }, { status: 403 })
    }

    console.log('✅ 사용자 조회 성공:', userData.email)

    // Supabase Auth로 로그인 시도
    console.log('🔐 Auth 로그인 시도:', userData.email)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: password
    })

    console.log('📊 Auth 로그인 결과:', { 
      success: !!authData.user, 
      error: authError?.message,
      userId: authData?.user?.id 
    })

    if (authError) {
      console.error('❌ 로그인 인증 실패:', authError)
      
      // 일반적인 로그인 실패 메시지
      if (authError.message.includes('Invalid login credentials') || 
          authError.message.includes('invalid_credentials') ||
          authError.message.includes('Email not confirmed')) {
        return Response.json({
          success: false,
          message: '아이디 또는 비밀번호가 올바르지 않습니다.',
          error: 'INVALID_CREDENTIALS',
          debug: {
            authError: authError.message,
            userFound: !!userData,
            emailUsed: userData.email
          }
        }, { status: 401 })
      }

      return Response.json({
        success: false,
        message: '로그인 중 오류가 발생했습니다: ' + authError.message,
        error: authError.message
      }, { status: 400 })
    }

    // 로그인 시간 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', user_id)

    if (updateError) {
      console.error('⚠️ 로그인 시간 업데이트 실패:', updateError)
      // 로그인은 성공했으므로 에러로 처리하지 않음
    }

    console.log('✅ 로그인 성공:', userData.email)

    // 성공 응답
    return Response.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        user: {
          id: authData.user.id,
          user_id: user_id,
          email: userData.email,
          name: userData.name,
          role: userData.role
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        }
      }
    })

  } catch (error) {
    console.error('❌ 로그인 처리 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// GET - 현재 로그인 상태 확인
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return Response.json({
        success: false,
        message: '토큰이 제공되지 않았습니다.',
        logged_in: false
      }, { status: 401 })
    }

    // 토큰으로 사용자 정보 가져오기
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return Response.json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
        logged_in: false
      }, { status: 401 })
    }

    // 사용자 프로필 정보 가져오기
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('user_id, name, role, status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('프로필 조회 오류:', profileError)
    }

    return Response.json({
      success: true,
      logged_in: true,
      user: {
        id: user.id,
        email: user.email,
        user_id: profileData?.user_id,
        name: profileData?.name,
        role: profileData?.role
      }
    })

  } catch (error) {
    console.error('로그인 상태 확인 오류:', error)
    
    return Response.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      logged_in: false
    }, { status: 500 })
  }
}