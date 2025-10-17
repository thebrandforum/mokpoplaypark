// app/api/tickets/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 예약별 티켓 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('reservationId')
    
    if (!reservationId) {
      return NextResponse.json({
        success: false,
        message: '예약번호가 필요합니다.'
      }, { status: 400 })
    }
    
    // 티켓 조회
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('reservation_id', reservationId)
      .is('deleted_at', null)  // 삭제되지 않은 티켓만 조회
      .order('ticket_number', { ascending: true })
    
    if (error) {
      console.error('티켓 조회 오류:', error)
      return NextResponse.json({
        success: false,
        message: '티켓 조회에 실패했습니다.'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: tickets || []
    })
    
  } catch (error) {
    console.error('티켓 API 오류:', error)
    return NextResponse.json({
      success: false,
      message: '티켓 조회 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}