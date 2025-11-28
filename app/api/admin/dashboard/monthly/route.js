// app/api/admin/dashboard/monthly/route.js
// 대시보드 월별 통계 API - Supabase PostgreSQL 버전

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 월별 대시보드 통계 조회
export async function GET(request) {
  try {
    console.log('📊 월별 대시보드 통계 조회 요청...')

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1))

    console.log('📅 조회 기간:', { year, month })

    // 해당 월의 첫날과 마지막날 계산
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    const lastDay = new Date(year, month, 0).getDate()

    console.log('📅 날짜 범위:', { startDate, endDate, lastDay })

    // ============================================
    // 1. 월별 일일 통계 조회
    // ============================================
    const { data: dailyStats, error: dailyError } = await supabase
      .from('reservations')
      .select('visit_date, adult_count, child_count, total_amount, status')
      .gte('visit_date', startDate)
      .lte('visit_date', endDate)
      .in('status', ['결제완료', '입장완료', '결제 완료']) // 공백 포함 버전 추가

    if (dailyError) {
      console.error('❌ 일일 통계 조회 오류:', dailyError)
      throw new Error(`일일 통계 조회 실패: ${dailyError.message}`)
    }

    console.log(`📊 일일 통계 데이터: ${dailyStats.length}개`)

    // ============================================
    // 2. 날짜별 데이터 집계
    // ============================================
    const dailyMap = {}
    
    // 전체 날짜 초기화 (1일~마지막일)
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = new Date(year, month - 1, day).toISOString().split('T')[0]
      dailyMap[dateStr] = {
        date: dateStr,
        reservations: 0,
        sales: 0,
        visitors: 0,
        completedReservations: 0
      }
    }

    // 실제 데이터로 집계
    dailyStats.forEach(reservation => {
      const dateStr = reservation.visit_date
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].reservations += 1
        dailyMap[dateStr].sales += reservation.total_amount || 0
        dailyMap[dateStr].visitors += (reservation.adult_count || 0) + (reservation.child_count || 0)
        
        if (reservation.status === '입장완료') {
          dailyMap[dateStr].completedReservations += 1
        }
      }
    })

    // 배열로 변환 및 정렬
    const monthlyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

    console.log(`📈 월별 데이터 생성 완료: ${monthlyData.length}일`)
    console.log('🔍 샘플 데이터:', monthlyData.slice(0, 3))

    // ============================================
    // 3. 월 전체 요약 통계
    // ============================================
    const monthSummary = {
      totalReservations: dailyStats.length,
      totalSales: dailyStats.reduce((sum, res) => sum + (res.total_amount || 0), 0),
      totalVisitors: dailyStats.reduce((sum, res) => sum + (res.adult_count || 0) + (res.child_count || 0), 0),
      completedReservations: dailyStats.filter(res => res.status === '입장완료').length,
      averageDailySales: 0,
      averageDailyVisitors: 0,
      peakDay: null,
      peakSales: 0
    }

    // 평균 계산
    const daysWithData = monthlyData.filter(day => day.reservations > 0).length
    if (daysWithData > 0) {
      monthSummary.averageDailySales = Math.round(monthSummary.totalSales / daysWithData)
      monthSummary.averageDailyVisitors = Math.round(monthSummary.totalVisitors / daysWithData)
    }

    // 최고 매출일 찾기
    const peakDay = monthlyData.reduce((peak, day) => 
      day.sales > peak.sales ? day : peak, { sales: 0, date: null })
    
    if (peakDay.sales > 0) {
      monthSummary.peakDay = peakDay.date
      monthSummary.peakSales = peakDay.sales
    }

    console.log('📊 월 요약 통계 완료')

    // ============================================
    // 4. 추가 통계 (이번 달 vs 지난 달)
    // ============================================
    let comparison = null
    
    try {
      // 지난 달 데이터 조회
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      const prevStartDate = new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0]
      const prevEndDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0]

      const { data: prevMonthStats, error: prevError } = await supabase
        .from('reservations')
        .select('total_amount, adult_count, child_count')
        .gte('visit_date', prevStartDate)
        .lte('visit_date', prevEndDate)
        .in('status', ['결제완료', '입장완료', '결제 완료']) // 공백 포함 버전 추가

      if (!prevError && prevMonthStats) {
        const prevMonthSales = prevMonthStats.reduce((sum, res) => sum + (res.total_amount || 0), 0)
        const prevMonthVisitors = prevMonthStats.reduce((sum, res) => sum + (res.adult_count || 0) + (res.child_count || 0), 0)

        comparison = {
          salesGrowth: prevMonthSales > 0 ? 
            Math.round(((monthSummary.totalSales - prevMonthSales) / prevMonthSales) * 100) : 0,
          visitorsGrowth: prevMonthVisitors > 0 ? 
            Math.round(((monthSummary.totalVisitors - prevMonthVisitors) / prevMonthVisitors) * 100) : 0,
          reservationsGrowth: prevMonthStats.length > 0 ? 
            Math.round(((monthSummary.totalReservations - prevMonthStats.length) / prevMonthStats.length) * 100) : 0
        }
      }
    } catch (compError) {
      console.log('⚠️ 비교 통계 계산 실패:', compError)
    }

    console.log('✅ 월별 대시보드 통계 조회 완료')

    return Response.json({
      success: true,
      message: `${year}년 ${month}월 통계 조회 성공`,
      data: {
        monthlyData: monthlyData,
        summary: monthSummary,
        comparison: comparison,
        period: {
          year: year,
          month: month,
          startDate: startDate,
          endDate: endDate,
          totalDays: lastDay
        }
      }
    })

  } catch (error) {
    console.error('❌ 월별 대시보드 통계 조회 중 오류:', error)
    
    if (error.message && error.message.includes('fetch failed')) {
      return Response.json({
        success: false,
        message: 'Network connection failed',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }

    return Response.json({
      success: false,
      message: 'Failed to load monthly statistics',
      error: error.message
    }, { status: 500 })
  }
}

// POST - 특정 기간 커스텀 통계 (옵션)
export async function POST(request) {
  try {
    console.log('📊 커스텀 기간 통계 요청...')

    const body = await request.json()
    const { startDate, endDate, groupBy = 'day' } = body

    if (!startDate || !endDate) {
      return Response.json({
        success: false,
        message: 'Start date and end date are required'
      }, { status: 400 })
    }

    console.log('📅 커스텀 기간:', { startDate, endDate, groupBy })

    // 기간 내 데이터 조회
    const { data: periodStats, error } = await supabase
      .from('reservations')
      .select('visit_date, created_at, adult_count, child_count, total_amount, status')
      .gte('visit_date', startDate)
      .lte('visit_date', endDate)
      .in('status', ['결제완료', '입장완료'])
      .order('visit_date', { ascending: true })

    if (error) {
      console.error('❌ 커스텀 기간 조회 오류:', error)
      throw new Error(`기간 통계 조회 실패: ${error.message}`)
    }

    // 그룹별 집계 (일별, 주별, 월별)
    const groupedData = groupBy === 'week' ? 
      groupByWeek(periodStats) : 
      groupBy === 'month' ? 
      groupByMonth(periodStats) : 
      groupByDay(periodStats)

    return Response.json({
      success: true,
      message: 'Custom period statistics retrieved successfully',
      data: {
        periodData: groupedData,
        period: { startDate, endDate, groupBy },
        totalRecords: periodStats.length
      }
    })

  } catch (error) {
    console.error('❌ 커스텀 기간 통계 중 오류:', error)
    
    return Response.json({
      success: false,
      message: 'Failed to load custom statistics',
      error: error.message
    }, { status: 500 })
  }
}

// ============================================
// 유틸리티 함수들
// ============================================

function groupByDay(data) {
  const groups = {}
  
  data.forEach(item => {
    const key = item.visit_date
    if (!groups[key]) {
      groups[key] = { date: key, reservations: 0, sales: 0, visitors: 0 }
    }
    
    groups[key].reservations += 1
    groups[key].sales += item.total_amount || 0
    groups[key].visitors += (item.adult_count || 0) + (item.child_count || 0)
  })
  
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date))
}

function groupByWeek(data) {
  const groups = {}
  
  data.forEach(item => {
    const date = new Date(item.visit_date)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
    const key = weekStart.toISOString().split('T')[0]
    
    if (!groups[key]) {
      groups[key] = { week: key, reservations: 0, sales: 0, visitors: 0 }
    }
    
    groups[key].reservations += 1
    groups[key].sales += item.total_amount || 0
    groups[key].visitors += (item.adult_count || 0) + (item.child_count || 0)
  })
  
  return Object.values(groups).sort((a, b) => a.week.localeCompare(b.week))
}

function groupByMonth(data) {
  const groups = {}
  
  data.forEach(item => {
    const date = new Date(item.visit_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!groups[key]) {
      groups[key] = { month: key, reservations: 0, sales: 0, visitors: 0 }
    }
    
    groups[key].reservations += 1
    groups[key].sales += item.total_amount || 0
    groups[key].visitors += (item.adult_count || 0) + (item.child_count || 0)
  })
  
  return Object.values(groups).sort((a, b) => a.month.localeCompare(b.month))
}