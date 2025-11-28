// app/api/admin/auth/reset-password/route.js
// 비밀번호를 기본값으로 초기화하는 API

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // 비밀번호를 admin1234로 초기화
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        setting_key: 'admin_password',
        setting_value: 'admin1234',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    if (error) {
      return Response.json({
        success: false,
        message: '비밀번호 초기화 실패',
        error: error.message
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: '비밀번호가 admin1234로 초기화되었습니다.'
    })

  } catch (error) {
    return Response.json({
      success: false,
      message: '오류 발생',
      error: error.message
    }, { status: 500 })
  }
}