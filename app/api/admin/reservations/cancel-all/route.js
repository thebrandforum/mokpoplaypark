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
    const { reservationId, paymentMethod, transactionId, totalAmount } = body
    
    console.log('예약 전체 취소 요청:', { reservationId, paymentMethod, transactionId, totalAmount })
    
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
    
    // 2. 예약의 모든 티켓 조회
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('reservation_id', reservationId)
      .neq('ticket_status', '취소') // 이미 취소된 티켓 제외
    
    if (ticketsError || !tickets || tickets.length === 0) {
      console.error('티켓 조회 오류:', ticketsError)
      return NextResponse.json({
        success: false,
        message: '취소할 티켓이 없습니다.'
      }, { status: 404 })
    }
    
    
    // 4. 카드 결제인 경우 빌게이트 전체 취소 처리
    if (paymentMethod === 'card' && transactionId) {
      console.log('빌게이트 전체 취소 처리 시작')
      
      try {
        // 빌게이트 전체취소 요청
        const cancelParams = new URLSearchParams({
          SERVICE_ID: 'M2591189',
          SERVICE_CODE: '0900',
          ORDER_ID: reservationId,
          ORDER_DATE: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
          TRANSACTION_ID: transactionId,
          CANCEL_TYPE: '', // 전체취소는 빈값
          RESERVATION_ID: reservationId,
          INI_FILE: '/workspace/gogo/BillgatePay-PHP/config/config.ini'
        })
        
        console.log('빌게이트 전체취소 요청 파라미터:', cancelParams.toString())
        
        //const phpResponse = await fetch('http://php.mokpoplaypark.com/gogo/BillgatePay-PHP/CancelAPI.php', { 카페24용
			
		const phpResponse = await fetch('https://gogo-ltlfs.run.goorm.site/BillgatePay-PHP/CancelAPI.php', {	
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: cancelParams.toString()
        })
        
        const phpText = await phpResponse.text()
        console.log('PHP 응답:', phpText)
        
        let phpResult
        try {
          phpResult = JSON.parse(phpText)
        } catch (e) {
          console.error('PHP 응답 파싱 오류:', e)
          throw new Error('빌게이트 환불 처리 응답을 파싱할 수 없습니다.')
        }
        
        if (!phpResult.success) {
          console.error('빌게이트 전체취소 실패:', phpResult)
          return NextResponse.json({ 
            success: false, 
            message: `빌게이트 환불 실패: ${phpResult.message}` 
          }, { status: 400 })
        }
        
        console.log('빌게이트 전체취소 성공:', phpResult)
        
      } catch (error) {
        console.error('빌게이트 환불 처리 오류:', error)
        return NextResponse.json({ 
          success: false, 
          message: '빌게이트 환불 처리 중 오류가 발생했습니다: ' + error.message
        }, { status: 500 })
      }
    }
    
    // 5. 현재 시간 (한국 시간)
    const cancelledAt = new Date().toISOString()

    console.log('취소 시간:', cancelledAt)
    
    // 6. 모든 티켓을 취소 상태로 변경
    const { error: updateTicketsError } = await supabase
      .from('tickets')
      .update({
        status: '취소',
        ticket_status: '취소',
        cancelled_at: cancelledAt  // ✅ 올바른 UTC 시간
      })
      .eq('reservation_id', reservationId)
      .neq('ticket_status', '취소')
    
    if (updateTicketsError) {
      console.error('티켓 취소 오류:', updateTicketsError)
      return NextResponse.json({
        success: false,
        message: '티켓 취소 처리 중 오류가 발생했습니다.'
      }, { status: 500 })
    }
    
    // 7. 예약 상태도 취소로 업데이트
    const { error: updateReservationError } = await supabase
      .from('reservations')
      .update({ 
        status: '취소'
      })
      .eq('id', reservationId)
    
    if (updateReservationError) {
      console.error('예약 업데이트 오류:', updateReservationError)
      return NextResponse.json({ 
        success: false, 
        message: '예약 취소 처리 중 오류가 발생했습니다.' 
      }, { status: 500 })
    }
    
    console.log('예약 전체 취소 성공:', reservationId)
    
    return NextResponse.json({
      success: true,
      message: `예약이 전체 취소되었습니다. (티켓 ${tickets.length}매)`,
      data: {
        reservationId,
        cancelledTickets: tickets.length,
        cancelDate: cancelledAt,
        refundStatus: paymentMethod === 'card' ? '환불처리됨' : '해당없음'
      }
    })
    
  } catch (error) {
    console.error('예약 전체 취소 오류:', error)
    return NextResponse.json({
      success: false,
      message: '예약 전체 취소 중 오류가 발생했습니다.',
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