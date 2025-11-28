// app/api/client/auth/reset-password/route.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// 기본 비밀번호 (client1234로 변경)
const DEFAULT_PASSWORD = 'climbkorea'

export async function POST(request) {
  try {
    // 비밀번호 초기화 (upsert 사용)
    const { error: upsertError } = await supabase
      .from('settings')
      .upsert({
        setting_key: 'client_password',
        setting_value: DEFAULT_PASSWORD
      }, {
        onConflict: 'setting_key'
      })
    
    if (upsertError) {
      console.error('비밀번호 초기화 오류:', upsertError)
      throw upsertError
    }
    
    return Response.json({
      success: true,
      message: '비밀번호가 초기화되었습니다.'
    })
    
  } catch (error) {
    console.error('비밀번호 초기화 오류:', error)
    return Response.json({
      success: false,
      message: '비밀번호 초기화 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}