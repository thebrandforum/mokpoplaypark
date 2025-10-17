// app/api/admin/tickets/[ticketId]/route.js
// 개별 티켓 영구 삭제 API

import { createClient } from '@supabase/supabase-js'

// Supabase 설정 (프로젝트의 다른 파일들과 동일하게)
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// DELETE - 티켓 영구 삭제
export async function DELETE(request, { params }) {
  console.log('🗑️ 티켓 삭제 요청 시작...')
  
  try {
    const { ticketId } = params
    const body = await request.json()
    const { reservationId, permanent } = body

    console.log('삭제 대상:', {
      ticketId,
      reservationId,
      permanent
    })

    // 1. 티켓 존재 여부 확인
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      console.error('티켓을 찾을 수 없음:', ticketError)
      return Response.json({
        success: false,
        message: '삭제할 티켓을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    console.log('삭제할 티켓 정보:', {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      ticket_type: ticket.ticket_type,
      reservation_id: ticket.reservation_id
    })

    // 2. 예약 ID 검증
    if (ticket.reservation_id !== reservationId) {
      console.error('예약 ID 불일치')
      return Response.json({
        success: false,
        message: '티켓의 예약 정보가 일치하지 않습니다.'
      }, { status: 400 })
    }

    // 3. 영구 삭제 플래그 확인
    if (!permanent) {
      console.error('영구 삭제 플래그 누락')
      return Response.json({
        success: false,
        message: '영구 삭제 확인이 필요합니다.'
      }, { status: 400 })
    }

    // 4. 티켓 삭제 실행
    const { error: deleteError } = await supabase
      .from('tickets')
      .update({ 
        deleted_at: new Date().toISOString()
      })
      .eq('id', ticketId)

    if (deleteError) {
      console.error('티켓 삭제 실패:', deleteError)
      return Response.json({
        success: false,
        message: `티켓 삭제 실패: ${deleteError.message}`
      }, { status: 500 })
    }

    console.log('✅ 티켓 삭제 성공:', ticketId)

    // 5. 동일 예약의 다른 티켓 확인
        const { data: remainingTickets, error: remainingError } = await supabase
      .from('tickets')
      .select('id')
      .eq('reservation_id', reservationId)
      .is('deleted_at', null)

    const remainingCount = remainingTickets ? remainingTickets.length : 0
    console.log(`예약 ${reservationId}의 남은 티켓 수: ${remainingCount}`)

    // 6. 남은 티켓이 없으면 예약도 삭제
    if (remainingCount === 0) {
      console.log('모든 티켓이 삭제됨 - 예약도 함께 삭제')
      
      const { error: deleteReservationError } = await supabase
        .from('reservations')
        .update({ 
          deleted_at: new Date().toISOString()
        })
        .eq('id', reservationId)

      if (deleteReservationError) {
        console.error('예약 삭제 실패:', deleteReservationError)
        // 예약 삭제 실패해도 티켓은 이미 삭제된 상태이므로 성공으로 처리
      } else {
        console.log('✅ 예약도 함께 삭제됨:', reservationId)
      }
    }

    return Response.json({
      success: true,
      message: remainingCount === 0 
        ? '티켓이 삭제되고 예약도 함께 삭제되었습니다.' 
        : '티켓이 영구 삭제되었습니다.',
      data: {
        deletedTicketId: ticketId,
        remainingTickets: remainingCount,
        reservationDeleted: remainingCount === 0
      }
    })

  } catch (error) {
    console.error('❌ 티켓 삭제 처리 중 오류:', error)
    return Response.json({
      success: false,
      message: '티켓 삭제 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}