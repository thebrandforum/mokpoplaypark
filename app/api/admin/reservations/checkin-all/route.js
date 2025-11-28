import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
const supabase = createClient(supabaseUrl, supabaseKey)

export const dynamic = 'force-dynamic'

export async function PUT(request) {
  try {
    const { reservationId } = await request.json()
    
    if (!reservationId) {
      return NextResponse.json({ success: false, message: '예약 ID가 필요합니다.' }, { status: 400 })
    }
    
    console.log('전체 입장완료 처리 요청:', reservationId)
    
    // 해당 예약의 모든 티켓 조회 (취소되지 않은 티켓만)
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('reservation_id', reservationId)
      .neq('ticket_status', '취소')
    
    if (ticketsError) {
      console.error('티켓 조회 오류:', ticketsError)
      return NextResponse.json({ success: false, message: '티켓 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }
    
    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ success: false, message: '입장 처리할 티켓이 없습니다.' }, { status: 404 })
    }
    
    // 모든 티켓을 입장완료 처리
    const updateData = {
      entry_status: '입장완료',
      used_at: new Date().toISOString()
    }
    
    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('reservation_id', reservationId)
      .neq('ticket_status', '취소')
    
    if (updateError) {
      console.error('티켓 업데이트 오류:', updateError)
      return NextResponse.json({ success: false, message: '티켓 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
    }
    
    console.log(`${tickets.length}개의 티켓이 입장완료 처리되었습니다.`)
    
    return NextResponse.json({ 
      success: true, 
      message: `${tickets.length}개의 티켓이 입장완료 처리되었습니다.`,
      data: { ticketCount: tickets.length }
    })
    
  } catch (error) {
    console.error('전체 입장완료 처리 오류:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || '전체 입장완료 처리 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}