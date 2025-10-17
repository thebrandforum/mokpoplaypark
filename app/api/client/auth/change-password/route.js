// app/api/client/auth/change-password/route.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// 기본 비밀번호 (client1234로 변경)
const DEFAULT_PASSWORD = 'climbkorea'

export async function POST(request) {
  try {
    // 토큰 확인
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        success: false,
        message: '인증이 필요합니다.'
      }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    
    // 클라이언트 토큰인지 확인
    if (!token.startsWith('client_')) {
      return Response.json({
        success: false,
        message: '클라이언트 권한이 필요합니다.'
      }, { status: 403 })
    }
    
    const { currentPassword, newPassword } = await request.json()
    
    // 입력값 검증
    if (!currentPassword || !newPassword) {
      return Response.json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.'
      }, { status: 400 })
    }
    
    if (newPassword.length < 4) {
      return Response.json({
        success: false,
        message: '새 비밀번호는 4자 이상이어야 합니다.'
      }, { status: 400 })
    }
    
    if (currentPassword === newPassword) {
      return Response.json({
        success: false,
        message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.'
      }, { status: 400 })
    }
    
    // 현재 비밀번호 확인
    const { data: currentSettings, error: fetchError } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'client_password')
      .maybeSingle()  // single() 대신 maybeSingle() 사용
    
    let clientPassword = DEFAULT_PASSWORD
    
    if (currentSettings && currentSettings.setting_value) {
      clientPassword = currentSettings.setting_value
    }
    
    // 현재 비밀번호가 맞는지 확인
    if (currentPassword !== clientPassword) {
      return Response.json({
        success: false,
        message: '현재 비밀번호가 일치하지 않습니다.'
      }, { status: 401 })
    }
    
    // 새 비밀번호로 업데이트 또는 생성
    const { error: upsertError } = await supabase
      .from('settings')
      .upsert({
        setting_key: 'client_password',
        setting_value: newPassword
      }, {
        onConflict: 'setting_key'
      })
    
    if (upsertError) {
      console.error('비밀번호 변경 오류:', upsertError)
      throw upsertError
    }
    
    return Response.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })
    
  } catch (error) {
    console.error('비밀번호 변경 오류:', error)
    return Response.json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}