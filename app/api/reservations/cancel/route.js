import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request) {
  try {
    // 요청 바디 파싱
    const body = await request.json()
    const { reservationId, customerPhone, cancelType, cancelReason } = body
    
    console.log('예약 취소 요청:', { reservationId, customerPhone, cancelType })
    
    // 취소 타입 결정 (전달받은 값 또는 설정에서 가져오기)
    let finalCancelType = cancelType
    
    if (!finalCancelType) {
      // 취소 정책 설정 불러오기
      const { data: settingsData } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'cancellation_settings')
        .single()

      const cancellationSettings = settingsData?.setting_value || {
        defaultCancelType: 'simple'
      }
      
      finalCancelType = cancellationSettings.defaultCancelType
    }
    
    console.log('적용할 취소 타입:', finalCancelType)

    // 필수 파라미터 확인
    if (!reservationId || !customerPhone) {
      return NextResponse.json({
        success: false,
        message: '예약번호와 전화번호를 모두 입력해주세요.'
      }, { status: 400 })
    }
    
    // 전화번호 정규화 (하이픈 제거)
    const normalizedPhone = customerPhone.replace(/[^0-9]/g, '')
    
    // 1. 예약 정보 조회 및 본인 확인
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, status, entry_status, phone, customer_name, total_amount')
      .eq('id', reservationId)
      .single()
    
    if (reservationError || !reservation) {
      console.error('예약 조회 오류:', reservationError)
      return NextResponse.json({
        success: false,
        message: '예약 정보를 찾을 수 없습니다.'
      }, { status: 404 })
    }
    
    // 이미 취소된 예약 확인
    if (reservation.status === '취소') {
      return NextResponse.json({
        success: false,
        message: '이미 취소된 예약입니다.'
      }, { status: 400 })
    }
    
    // 전화번호 확인
    const dbPhone = reservation.phone.replace(/[^0-9]/g, '')
    if (dbPhone !== normalizedPhone) {
      return NextResponse.json({
        success: false,
        message: '전화번호가 일치하지 않습니다.'
      }, { status: 403 })
    }
    
    // 2. 예약의 모든 티켓 조회
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('reservation_id', reservationId)
    
    if (ticketsError || !tickets || tickets.length === 0) {
      console.error('티켓 조회 오류:', ticketsError)
      return NextResponse.json({
        success: false,
        message: '티켓 정보를 찾을 수 없습니다.'
      }, { status: 404 })
    }
    
    // 3. 취소 가능 여부 확인
    // 활성 티켓 확인
    const activeTickets = tickets.filter(t => 
      t.status !== '취소' && t.status !== '취소됨' && 
      t.ticket_status !== '취소' && t.ticket_status !== '취소됨'
    )
    
    if (activeTickets.length === 0) {
      return NextResponse.json({
        success: false,
        message: '이미 모든 티켓이 취소되었습니다.'
      }, { status: 400 })
    }
    
    // 입장 완료된 티켓 확인
    const enteredTickets = tickets.filter(t => t.entry_status === '입장완료')
    if (enteredTickets.length > 0) {
      return NextResponse.json({
        success: false,
        message: '입장 완료된 티켓이 있어 취소할 수 없습니다.'
      }, { status: 400 })
    }
    
    // 4. 모든 티켓 상태를 '취소'로 변경
    console.log('🔄 티켓 취소 시작, reservationId:', reservationId)
    
    const { data: updatedTickets, error: updateTicketError } = await supabase
      .from('tickets')
      .update({
        status: '취소',
        ticket_status: '취소',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelReason === 'pg_fail_0505' ? 'pg_fail' : 
                      finalCancelType === 'refund' ? 'user_refund' : 'user_simple'
        // cancel_reason 컬럼 제거
      })
      .eq('reservation_id', reservationId)
      .select()
        
    console.log('📝 업데이트된 티켓:', updatedTickets)
    
    if (updateTicketError) {
      console.error('❌ 티켓 취소 오류 상세:', updateTicketError)
      return NextResponse.json({
        success: false,
        message: '티켓 취소 처리 중 오류가 발생했습니다.',
        error: updateTicketError.message  // 🆕 에러 메시지 포함
      }, { status: 500 })
    }
    
    console.log('✅ 티켓 취소 완료, 업데이트된 개수:', updatedTickets?.length || 0)
        
    // 5. 예약 상태도 '취소'로 변경
    const { error: updateReservationError } = await supabase
      .from('reservations')
      .update({ 
        status: '취소',
      })
      .eq('id', reservationId)
    
    if (updateReservationError) {
      console.error('예약 취소 오류:', updateReservationError)
      return NextResponse.json({
        success: false,
        message: '예약 취소 처리 중 오류가 발생했습니다.'
      }, { status: 500 })
    }
    
    console.log('예약 취소 성공:', reservationId)
    
    // 6. 취소 타입에 따른 환불 처리 (빌게이트 환불은 프론트에서 처리)
    let refundProcessed = false
    if (finalCancelType === 'refund') {
      // 카드 결제의 경우 프론트엔드에서 빌게이트 페이지로 이동
      // 여기서는 플래그만 설정
      refundProcessed = true
      console.log('환불 취소로 처리됨')
    } else {
      console.log('단순 취소로 처리됨')
    }
    
    // 7. 성공 응답
    return NextResponse.json({
      success: true,
      message: refundProcessed 
        ? '예약이 환불 취소되었습니다.' 
        : '예약이 취소되었습니다.',
      data: {
        reservationId,
        totalAmount: reservation.total_amount || 0,
        ticketCount: tickets.length,
        status: '취소',
        cancelDate: new Date().toISOString(),
        cancelType: finalCancelType,
        refundProcessed
      }
    })
    
  } catch (error) {
    console.error('예약 취소 오류:', error)
    return NextResponse.json({
      success: false,
      message: '예약 취소 중 오류가 발생했습니다.',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}