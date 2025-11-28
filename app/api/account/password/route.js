// app/api/account/password/route.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// POST: 비밀번호 변경
export async function POST(request) {
  try {
    console.log('🔐 비밀번호 변경 API 호출됨')
    
    const body = await request.json()
    const { currentPassword, newPassword, refreshToken } = body

    // 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('authorization')
    let accessToken = authHeader?.replace('Bearer ', '')

    console.log('📋 요청 데이터:', {
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      hasToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    })

    if (!accessToken) {
      console.error('❌ 인증 토큰 없음')
      return Response.json({
        success: false,
        message: '로그인이 필요합니다.'
      }, { status: 401 })
    }

    // 필수 필드 검증
    if (!currentPassword || !newPassword) {
      return Response.json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.'
      }, { status: 400 })
    }

    console.log('🔑 토큰으로 사용자 조회 시작...')
    
    // 먼저 현재 토큰으로 시도
    let { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    // 토큰이 만료된 경우 refresh token으로 갱신
    if (userError && userError.message.includes('expired') && refreshToken) {
      console.log('🔄 토큰 만료됨, refresh token으로 갱신 시도...')
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (refreshError || !refreshData.session) {
        console.error('❌ 토큰 갱신 실패:', refreshError)
        return Response.json({
          success: false,
          message: '세션이 만료되었습니다. 다시 로그인해주세요.',
          needsLogin: true
        }, { status: 401 })
      }

      console.log('✅ 토큰 갱신 성공')
      
      // 새로운 토큰으로 재시도
      accessToken = refreshData.session.access_token
      const retryResult = await supabase.auth.getUser(accessToken)
      user = retryResult.data.user
      
      // 클라이언트에 새 토큰 전달
      if (refreshData.session) {
        console.log('🔑 새 토큰 정보 전달')
      }
    }

    if (!user) {
      console.error('❌ 사용자 조회 실패')
      return Response.json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.'
      }, { status: 401 })
    }

    console.log('✅ 사용자 확인:', user.email)

    // 현재 비밀번호로 재인증 시도 (users 테이블 조회 생략)
    console.log('🔐 현재 비밀번호 확인 중...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      console.error('❌ 현재 비밀번호 확인 실패:', signInError.message)
      return Response.json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.'
      }, { status: 400 })
    }

    console.log('✅ 현재 비밀번호 확인됨')

    // Admin API를 사용하여 비밀번호 업데이트
    console.log('🔄 새 비밀번호로 업데이트 중...')
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ 비밀번호 업데이트 실패:', updateError.message)
      
      // 비밀번호 정책 관련 오류 처리
      if (updateError.message.includes('password') || updateError.message.includes('weak')) {
        return Response.json({
          success: false,
          message: '새 비밀번호가 보안 정책을 충족하지 않습니다. (8자 이상, 영문/숫자/특수문자 포함)'
        }, { status: 400 })
      }
      
      return Response.json({
        success: false,
        message: '비밀번호 변경 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    console.log('✅ 비밀번호 변경 성공')

    // users 테이블의 updated_at 업데이트
    try {
      const { error: dbUpdateError } = await supabase
        .from('users')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (dbUpdateError) {
        console.warn('⚠️ DB 업데이트 실패 (무시):', dbUpdateError.message)
      }
    } catch (dbError) {
      console.warn('⚠️ DB 업데이트 중 오류 (무시):', dbError)
    }

    // 토큰이 갱신된 경우 새 토큰 정보도 함께 반환
    const response = {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    }

    // refresh로 새 토큰을 받은 경우
    if (refreshToken && accessToken !== authHeader?.replace('Bearer ', '')) {
      response.newSession = {
        access_token: accessToken,
        refresh_token: refreshToken // 기존 refresh token 유지
      }
    }

    return Response.json(response)

  } catch (error) {
    console.error('❌ 비밀번호 변경 처리 중 오류:', error)
    return Response.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// GET: 비밀번호 정책 조회
export async function GET() {
  try {
    // 비밀번호 정책 반환
    const policy = {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: '!@#$%^&*',
      expirationDays: 90, // 90일마다 변경 권장
      preventReuse: 3 // 최근 3개 비밀번호 재사용 금지
    }

    return Response.json({
      success: true,
      policy
    })

  } catch (error) {
    console.error('비밀번호 정책 조회 오류:', error)
    return Response.json({
      success: false,
      message: '비밀번호 정책 조회 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}