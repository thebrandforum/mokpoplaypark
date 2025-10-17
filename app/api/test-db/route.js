// 임시 API - app/api/test-db-status/route.js (새로 만들어서 테스트)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    console.log('🔍 데이터베이스 상태값 확인 중...')
    
    // 모든 예약의 상태값 조회
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, customer_name, status')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      throw new Error(error.message)
    }
    
    // 고유한 상태값들 찾기
    const uniqueStatuses = [...new Set(reservations.map(r => r.status))]
    
    // 상태별 개수 계산
    const statusCounts = {}
    reservations.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
    })
    
    console.log('📊 발견된 상태값들:', uniqueStatuses)
    console.log('📊 상태별 개수:', statusCounts)
    
    return Response.json({
      success: true,
      message: '데이터베이스 상태값 확인 완료',
      data: {
        uniqueStatuses,
        statusCounts,
        sampleReservations: reservations.map(r => ({
          id: r.id,
          customerName: r.customer_name,
          status: r.status,
          statusLength: r.status?.length,
          statusBytes: JSON.stringify(r.status)
        }))
      }
    })
    
  } catch (error) {
    console.error('❌ 상태값 확인 오류:', error)
    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 })
  }
}