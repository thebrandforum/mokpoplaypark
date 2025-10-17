// app/api/admin/dashboard/route.js
// 대시보드 통계 데이터 조회 - Supabase PostgreSQL 직접 사용

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 대시보드 통계 데이터 조회
export async function GET() {
  try {
    console.log('📊 대시보드 API 호출됨 (Supabase 직접 사용)')
    
    // ============================================
    // 1. 전체 예약 수 (취소 제외)
    // ============================================
    const { data: totalReservationsData, error: totalReservationsError } = await supabase
      .from('reservations')
      .select('id', { count: 'exact' })
      .neq('status', '취소')

    if (totalReservationsError) {
      console.error('❌ 전체 예약 수 조회 오류:', totalReservationsError)
      throw new Error(`전체 예약 수 조회 실패: ${totalReservationsError.message}`)
    }

    const todayReservations = totalReservationsData?.length || 0
    console.log('📊 전체 예약 수:', todayReservations)

    // ============================================
    // 2. 전체 매출 (결제완료 + 입장완료)
    // ============================================
    const { data: revenueData, error: revenueError } = await supabase
      .from('reservations')
      .select('total_amount')
      .in('status', ['결제완료', '입장완료', '결제 완료']) // 공백 포함 버전 추가

    if (revenueError) {
      console.error('❌ 매출 조회 오류:', revenueError)
      throw new Error(`매출 조회 실패: ${revenueError.message}`)
    }

    const todayRevenue = revenueData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0
    console.log('💰 전체 매출:', todayRevenue, '원')

    // ============================================
    // 3. 총 방문객 수 (입장완료만)
    // ============================================
    const { data: guestsData, error: guestsError } = await supabase
      .from('reservations')
      .select('adult_count, child_count')
      .eq('entry_status', '입장완료') // 👈 entry_status 컬럼 확인

    if (guestsError) {
      console.error('❌ 방문객 수 조회 오류:', guestsError)
      throw new Error(`방문객 수 조회 실패: ${guestsError.message}`)
    }

    const todayGuests = guestsData?.reduce((sum, item) => 
      sum + (item.adult_count || 0) + (item.child_count || 0), 0) || 0
    console.log('👥 총 방문객 수:', todayGuests, '명')

    // ============================================
    // 4. 결제 전 건수
    // ============================================
    const { data: pendingData, error: pendingError } = await supabase
      .from('reservations')
      .select('id', { count: 'exact' })
      .eq('status', '결제 전')

    if (pendingError) {
      console.error('❌ 결제 전 건수 조회 오류:', pendingError)
      throw new Error(`결제 전 건수 조회 실패: ${pendingError.message}`)
    }

    const pendingPayments = pendingData?.length || 0
    console.log('⏳ 결제 전 건수:', pendingPayments)

    // ============================================
    // 5. 차트용 데이터 - 최근 7일 매출 (visitors 포함)
    // ============================================
    const chartData = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      console.log(`📅 ${dateStr} 데이터 조회 중...`)
      
      // 해당 날짜의 매출, 예약 수, 방문객 수 조회
      const { data: dailyData, error: dailyError } = await supabase
        .from('reservations')
        .select('total_amount, adult_count, child_count') // 👈 방문객 수 계산을 위해 추가
        .eq('visit_date', dateStr)
        .in('status', ['결제완료', '입장완료', '결제 완료'])

      if (dailyError) {
        console.error(`❌ ${dateStr} 일별 데이터 조회 오류:`, dailyError)
        // 오류가 있어도 0으로 처리하고 계속 진행
        chartData.push({
          date: dateStr,
          dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
          sales: 0,
          reservations: 0,
          visitors: 0 // 👈 visitors 추가
        })
        continue
      }

      const dailySales = dailyData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0
      const dailyReservations = dailyData?.length || 0
      const dailyVisitors = dailyData?.reduce((sum, item) => 
        sum + (item.adult_count || 0) + (item.child_count || 0), 0) || 0 // 👈 방문객 수 계산
      
      console.log(`📊 ${dateStr}: 매출 ${dailySales}원, 예약 ${dailyReservations}건, 방문 ${dailyVisitors}명`)
      
      chartData.push({
        date: dateStr,
        dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        sales: dailySales,
        reservations: dailyReservations,
        visitors: dailyVisitors // 👈 visitors 추가
      })
    }

    console.log('📈 차트 데이터 생성 완료:', chartData.length, '일')

    // ============================================
    // 6. 최종 응답 데이터
    // ============================================
    const responseData = {
      stats: {
        todayReservations,
        todayRevenue,
        totalGuests: todayGuests,
        pendingPayments,
        monthRevenue: 0, // 월별 매출 (별도 API에서 처리)
        monthTransactions: 0, // 월별 거래 수
        avgTransactionAmount: todayReservations > 0 ? Math.round(todayRevenue / todayReservations) : 0
      },
      statusStats: {
        '결제완료': revenueData?.filter(item => item.status === '결제완료')?.length || 0,
        '입장완료': guestsData?.length || 0,
        '결제 전': pendingPayments
      },
      recentReservations: [], // 최근 예약 (필요시 추가)
      chartData
    }

    console.log('✅ 대시보드 데이터 조회 성공')
    console.log('📊 최종 통계:', responseData.stats)

    return Response.json({
      success: true,
      message: '대시보드 데이터 조회 성공',
      data: responseData
    })

  } catch (error) {
    console.error('❌ 대시보드 데이터 조회 중 오류:', error)
    
    // 네트워크 오류 체크
    if (error.message && error.message.includes('fetch failed')) {
      return Response.json({
        success: false,
        message: '네트워크 연결 오류',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }

    return Response.json({
      success: false,
      message: '대시보드 데이터 조회 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}