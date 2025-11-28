// app/api/admin/auth/verify-password/route.js
// 현재 비밀번호 확인 전용 API

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request) {
  try {
    // 인증 확인 (관리자로 로그인된 상태여야 함)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        success: false,
        message: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const { password } = await request.json()

    if (!password) {
      return Response.json({
        success: false,
        message: '비밀번호를 입력해주세요.'
      }, { status: 400 })
    }

    // 데이터베이스에서 현재 관리자 비밀번호 가져오기
    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'admin_password')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('비밀번호 조회 오류:', error)
      return Response.json({
        success: false,
        message: '비밀번호 확인 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 기본 비밀번호 또는 저장된 비밀번호
    const storedPassword = settings?.setting_value || 'admin1234'

    // 비밀번호 확인
    const isValid = password === storedPassword

    return Response.json({
      success: isValid,
      message: isValid ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'
    })

  } catch (error) {
    console.error('비밀번호 확인 오류:', error)
    return Response.json({
      success: false,
      message: '비밀번호 확인 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}