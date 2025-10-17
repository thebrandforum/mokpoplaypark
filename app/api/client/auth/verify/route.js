// app/api/client/auth/verify/route.js
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        success: false,
        message: '인증 토큰이 없습니다.'
      }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    
    // 토큰 검증 - client_로 시작하는지만 확인
    if (!token || !token.startsWith('client_')) {
      return Response.json({
        success: false,
        message: '유효하지 않은 클라이언트 토큰입니다.'
      }, { status: 401 })
    }
    
    return Response.json({
      success: true,
      message: '인증 성공',
      role: 'client'
    })
    
  } catch (error) {
    console.error('클라이언트 인증 확인 오류:', error)
    return Response.json({
      success: false,
      message: '인증 확인 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}