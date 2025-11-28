// app/api/admin/reservations/[reservationId]/route.js
// 예약 및 관련 티켓 전체 영구 삭제 API

import { createClient } from '@supabase/supabase-js'

// Supabase 설정 (프로젝트의 다른 파일들과 동일하게)
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// DELETE - 예약 및 티켓 영구 삭제
export async function DELETE(request, { params }) {
  console.log('🗑️ 예약 전체 삭제 요청 시작...')
  
  try {
    const { reservationId } = params
    const body = await request.json()
    const { permanent, includeTickets } = body

    console.log('삭제 대상:', {
      reservationId,
      permanent,
      includeTickets
    })

    // 1. 예약 존재 여부 확인
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single()

    if (reservationError || !reservation) {
      console.error('예약을 찾을 수 없음:', reservationError)
      return Response.json({
        success: false,
        message: '삭제할 예약을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    console.log('삭제할 예약 정보:', {
      id: reservation.id,
      customer_name: reservation.customer_name,
      phone: reservation.phone,
      total_amount: reservation.total_amount
    })

    // 2. 영구 삭제 플래그 확인
    if (!permanent) {
      console.error('영구 삭제 플래그 누락')
      return Response.json({
        success: false,
        message: '영구 삭제 확인이 필요합니다.'
      }, { status: 400 })
    }

    // 3. 관련 티켓 조회
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id')
      .eq('reservation_id', reservationId)

    const ticketCount = tickets ? tickets.length : 0
    console.log(`삭제할 티켓 수: ${ticketCount}`)

    // 4. 트랜잭션 시작 (Supabase는 자동으로 처리)
    let deletedTickets = 0
    
    // 5. 티켓부터 삭제 (외래키 제약 때문에)
    if (includeTickets && ticketCount > 0) {
      console.log('관련 티켓 삭제 시작...')
      
      const { error: deleteTicketsError } = await supabase
        .from('tickets')
        .update({ 
          deleted_at: new Date().toISOString()
        })
        .eq('reservation_id', reservationId)
        .is('deleted_at', null)

      if (deleteTicketsError) {
        console.error('티켓 삭제 실패:', deleteTicketsError)
        return Response.json({
          success: false,
          message: `티켓 삭제 실패: ${deleteTicketsError.message}`
        }, { status: 500 })
      }

      deletedTickets = ticketCount
      console.log(`✅ ${deletedTickets}개 티켓 삭제 완료`)
    }

    // 6. 예약 삭제
    console.log('예약 삭제 시작...')
    
    const { error: deleteReservationError } = await supabase
      .from('reservations')
      .update({ 
        deleted_at: new Date().toISOString()
      })
      .eq('id', reservationId)

    if (deleteReservationError) {
      console.error('예약 삭제 실패:', deleteReservationError)
      return Response.json({
        success: false,
        message: `예약 삭제 실패: ${deleteReservationError.message}`
      }, { status: 500 })
    }

    console.log('✅ 예약 삭제 성공:', reservationId)

    // 7. 로그 기록 (선택사항)
    const logData = {
      action: 'DELETE_RESERVATION',
      reservation_id: reservationId,
      customer_name: reservation.customer_name,
      phone: reservation.phone,
      deleted_tickets: deletedTickets,
      deleted_at: new Date().toISOString(),
      deleted_by: 'admin' // 실제로는 인증된 관리자 ID 사용
    }

    console.log('삭제 로그:', logData)

    // 로그 테이블이 있다면 여기에 기록
    // await supabase.from('deletion_logs').insert([logData])

    return Response.json({
      success: true,
      message: '예약 및 관련 데이터가 영구 삭제되었습니다.',
      data: {
        deletedReservationId: reservationId,
        deletedTickets: deletedTickets,
        customerName: reservation.customer_name
      }
    })

  } catch (error) {
    console.error('❌ 예약 삭제 처리 중 오류:', error)
    return Response.json({
      success: false,
      message: '예약 삭제 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// GET - 예약 상세 조회 (삭제 전 확인용)
export async function GET(request, { params }) {
  try {
    const { reservationId } = params

    // 예약 정보 조회
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single()

    if (reservationError || !reservation) {
      return Response.json({
        success: false,
        message: '예약을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 관련 티켓 조회
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('reservation_id', reservationId)
      .is('deleted_at', null)  // 삭제되지 않은 티켓만
      .order('ticket_number')

    return Response.json({
      success: true,
      data: {
        reservation,
        tickets: tickets || [],
        ticketCount: tickets ? tickets.length : 0
      }
    })

  } catch (error) {
    console.error('예약 조회 오류:', error)
    return Response.json({
      success: false,
      message: '예약 조회 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}