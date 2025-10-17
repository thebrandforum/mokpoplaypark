// app/api/client/auth/login/route.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// 기본 비밀번호
const DEFAULT_PASSWORD = 'climbkorea'

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return Response.json({
        success: false,
        message: '비밀번호를 입력해주세요.'
      }, { status: 400 })
    }

    // 데이터베이스에서 클라이언트 비밀번호 가져오기
    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'client_password')
      .single()

    let clientPassword = DEFAULT_PASSWORD
    
    if (settings && settings.setting_value) {
      clientPassword = settings.setting_value
    }

    // 비밀번호 확인
    if (password !== clientPassword) {
      return Response.json({
        success: false,
        message: '비밀번호가 올바르지 않습니다.'
      }, { status: 401 })
    }

    // 클라이언트용 토큰 생성
    const token = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
    
    return Response.json({
      success: true,
      message: '로그인 성공',
      token: token,
      role: 'client'
    })

  } catch (error) {
    console.error('클라이언트 로그인 오류:', error)
    return Response.json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}