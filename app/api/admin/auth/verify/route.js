// app/api/admin/auth/verify/route.js - 디버깅 버전
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('인증 헤더:', authHeader) // 🔴 디버깅
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('인증 헤더 없음 또는 형식 오류') // 🔴 디버깅
      return Response.json({
        success: false,
        message: '인증 토큰이 없습니다.'
      }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    console.log('토큰:', token) // 🔴 디버깅
    
    // 토큰 검증 - admin_으로 시작하는지만 확인
    if (!token || !token.startsWith('admin_')) {
      console.log('토큰 검증 실패') // 🔴 디버깅
      return Response.json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      }, { status: 401 })
    }
    
    console.log('토큰 검증 성공') // 🔴 디버깅
    return Response.json({
      success: true,
      message: '인증 성공'
    })
    
  } catch (error) {
    console.error('인증 확인 오류:', error)
    return Response.json({
      success: false,
      message: '인증 확인 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}