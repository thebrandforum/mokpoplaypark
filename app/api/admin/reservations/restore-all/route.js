// /api/admin/reservations/restore-all/route.js

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
})

export async function PUT(request) {
  try {
    const body = await request.json()
    const { reservationId } = body
    
    console.log('예약 전체 복구 요청:', { reservationId })
    
    if (!reservationId) {
      return NextResponse.json({
        success: false,
        message: '예약번호가 필요합니다.'
      }, { status: 400 })
    }
    
    // 1. 예약 정보 조회
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single()
    
    if (reservationError || !reservation) {
      console.error('예약 조회 오류:', reservationError)
      return NextResponse.json({
        success: false,
        message: '예약 정보를 찾을 수 없습니다.'
      }, { status: 404 })
    }
    
    // 2. 예약의 모든 취소된 티켓 조회
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('ticket_status', '취소') // 취소된 티켓만 조회
    
    if (ticketsError) {
      console.error('티켓 조회 오류:', ticketsError)
      return NextResponse.json({
        success: false,
        message: '티켓 조회 중 오류가 발생했습니다.'
      }, { status: 500 })
    }
    
    if (!tickets || tickets.length === 0) {
      return NextResponse.json({
        success: false,
        message: '복구할 취소된 티켓이 없습니다.'
      }, { status: 400 })
    }
    
    console.log(`복구할 티켓 ${tickets.length}개 발견`)
    
    // 3. 모든 취소된 티켓을 복구
    const { restoreStatus = '결제완료' } = body;

    // 티켓 업데이트 부분 수정
    const { error: updateTicketsError } = await supabase
      .from('tickets')
      .update({
        status: restoreStatus,  // 변경
        ticket_status: restoreStatus,  // 변경
        entry_status: '입장_전',
        cancelled_at: null,
        used_at: null
      })
      .eq('reservation_id', reservationId)
      .eq('ticket_status', '취소')
    
    if (updateTicketsError) {
      console.error('티켓 복구 오류:', updateTicketsError)
      return NextResponse.json({
        success: false,
        message: '티켓 복구 처리 중 오류가 발생했습니다.'
      }, { status: 500 })
    }
    
    // 4. 예약 상태도 결제완료로 업데이트
    const newStatus = reservation.payment_method === 'bank' && !reservation.payment_time 
      ? '결제 전' 
      : '결제 완료'
    
    const { error: updateReservationError } = await supabase
      .from('reservations')
      .update({ 
        status: '결제 완료'
      })
      .eq('id', reservationId)
    
    if (updateReservationError) {
      console.error('예약 업데이트 오류:', updateReservationError)
      return NextResponse.json({ 
        success: false, 
        message: '예약 복구 처리 중 오류가 발생했습니다.' 
      }, { status: 500 })
    }
    
    console.log('예약 전체 복구 성공:', reservationId)
    
    return NextResponse.json({
      success: true,
      message: `예약이 전체 복구되었습니다. (티켓 ${tickets.length}매)`,
      data: {
        reservationId,
        restoredTickets: tickets.length,
        restoreDate: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('예약 전체 복구 오류:', error)
    return NextResponse.json({
      success: false,
      message: '예약 전체 복구 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// OPTIONS 메서드 지원 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}