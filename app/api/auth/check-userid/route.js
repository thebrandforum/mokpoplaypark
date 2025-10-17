// app/api/auth/check-userid/route.js
// 아이디 중복 확인 API

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 아이디 중복 확인
export async function GET(request) {
  try {
    console.log('🔍 아이디 중복 확인 API 호출됨')
    
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    console.log('📋 확인할 아이디:', user_id)

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
    console.log('🔍 데이터베이스 조회 시작...')
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', user_id)
      .single()

    console.log('📊 조회 결과:', { existingUser, error })

    if (error && error.code !== 'PGRST116') { // PGRST116 = 데이터 없음
      console.error('❌ 아이디 확인 오류:', error)
      return Response.json({
        success: false,
        message: '아이디 확인 중 오류가 발생했습니다.',
        error: error.message
      }, { status: 500 })
    }

    const isAvailable = !existingUser

    console.log('✅ 중복 확인 완료:', isAvailable ? '사용 가능' : '중복됨')

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