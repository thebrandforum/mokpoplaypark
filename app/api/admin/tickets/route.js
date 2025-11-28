import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Supabase 클라이언트를 함수 밖에서 생성
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
const supabase = createClient(supabaseUrl, supabaseKey)

export const dynamic = 'force-dynamic'

export async function PUT(request) {
  try {
    // 요청 본문 파싱 - 빌게이트 관련 파라미터 추가
    const { ticketId, action, value, reservationId, paymentMethod, transactionId } = await request.json()
    
    if (!ticketId || !action) {
      return NextResponse.json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }
    
    console.log('티켓 업데이트 요청:', { ticketId, action, value, reservationId, paymentMethod, transactionId })
    
    // 티켓 정보 조회
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, reservations(*)')
      .eq('id', ticketId)
      .single()
    
    if (ticketError || !ticket) {
      console.error('티켓 조회 오류:', ticketError)
      return NextResponse.json({ success: false, message: '티켓을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    let updateData = {}
    let reservationUpdateData = null
    
    switch (action) {
      case 'entry_status':
        updateData.entry_status = value
        
        if (value === '입장완료') {
          updateData.used_at = new Date().toISOString()
        } else if (value === '입장_전') {
          updateData.used_at = null
        }
        
        break
        
      case 'payment_status':
        // 결제 상태 변경 - status와 ticket_status 둘 다 업데이트
        const newStatus = value === '결제 완료' ? '결제완료' : 
                         value === '결제 전' ? '결제 전' : 
                         value === '취소' ? '취소' : '결제완료'
        
        updateData.status = newStatus
        updateData.ticket_status = newStatus
        
        if (newStatus === '취소') {
          updateData.cancelled_at = new Date().toISOString()
        }
        break
        
      case 'cancel':
        // 티켓 취소 - 카드 결제인 경우 빌게이트 환불 처리
        
        // 카드 결제이고 결제완료 상태인 경우 빌게이트 환불 처리
        if (paymentMethod === 'card' && transactionId && ticket.ticket_status === '결제완료') {
          console.log('빌게이트 환불 처리 시작:', {
            ticketPrice: ticket.price,
            transactionId: transactionId
          })
          
          try {
            // 빌게이트 부분취소 요청을 위한 폼 데이터 준비
            const cancelParams = new URLSearchParams({
              SERVICE_ID: 'M2591189',
              SERVICE_CODE: '0900',
              ORDER_ID: reservationId || ticket.reservation_id,
              ORDER_DATE: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
              TRANSACTION_ID: transactionId,
              CANCEL_TYPE: '0000', // 부분취소
              CANCEL_AMOUNT: ticket.price.toString(),
              RESERVATION_ID: reservationId || ticket.reservation_id,
              TICKET_ID: ticketId,
              INI_FILE: '/workspace/gogo/BillgatePay-PHP/config/config.ini'
            })
            
            console.log('빌게이트 취소 요청 파라미터:', cancelParams.toString())

            // PHP 스크립트에 POST 요청
            //const phpResponse = await fetch('http://php.mokpoplaypark.com/gogo/BillgatePay-PHP/CancelAPI.php', { 카페24용
				
			const phpResponse = await fetch('https://gogo-ltlfs.run.goorm.site/BillgatePay-PHP/CancelAPI.php', {	
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: cancelParams.toString()
            })

            const phpText = await phpResponse.text()
            console.log('PHP 응답 원본:', phpText)
            
            let phpResult
            try {
              phpResult = JSON.parse(phpText)
            } catch (e) {
              console.error('PHP 응답 파싱 오류:', e)
              throw new Error('빌게이트 환불 처리 응답을 파싱할 수 없습니다.')
            }

            if (!phpResult.success) {
              console.error('빌게이트 환불 실패:', phpResult)
              return NextResponse.json({ 
                success: false, 
                message: `빌게이트 환불 실패: ${phpResult.message}` 
              }, { status: 400 })
            }
            
            console.log('빌게이트 환불 성공:', phpResult)
            
          } catch (error) {
            console.error('빌게이트 환불 처리 오류:', error)
            return NextResponse.json({ 
              success: false, 
              message: '빌게이트 환불 처리 중 오류가 발생했습니다: ' + error.message
            }, { status: 500 })
          }
        }
        
        // 티켓 상태를 취소로 업데이트
        updateData.status = '취소'
        updateData.ticket_status = '취소'
        updateData.cancelled_at = new Date().toISOString()
		updateData.cancelled_by = 'admin'	
        break
        
      case 'restore':
        // 티켓 복구
        const restoreStatus = value || '결제완료'
        updateData.status = restoreStatus
        updateData.ticket_status = restoreStatus
        updateData.entry_status = '입장_전'
        updateData.cancelled_at = null
        updateData.used_at = null
        
        // 예약 상태도 업데이트하도록 설정 (추가)
        reservationUpdateData = {
          status: '결제 완료'  // 예약 테이블은 띄어쓰기 있게
        }
        break
        
      default:
        return NextResponse.json({ success: false, message: '유효하지 않은 액션입니다.' }, { status: 400 })
    }
    
    // 티켓 업데이트
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId)
      
      if (updateError) {
        console.error('티켓 업데이트 오류:', updateError)
        throw updateError
      }
    }
    
    // 예약 업데이트 (필요한 경우)
    if (reservationUpdateData) {
      const { error: reservationError } = await supabase
        .from('reservations')
        .update(reservationUpdateData)
        .eq('id', ticket.reservation_id)
      
      if (reservationError) {
        console.error('예약 업데이트 오류:', reservationError)
        throw reservationError
      }
    }
    
    // action이 'cancel'이고 해당 예약의 모든 티켓이 취소되었는지 확인
    if (action === 'cancel') {
      const { data: remainingTickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('reservation_id', ticket.reservation_id)
        .neq('ticket_status', '취소')
      
      // 모든 티켓이 취소된 경우 예약 상태도 취소로 변경
      if (!remainingTickets || remainingTickets.length === 0) {
        await supabase
          .from('reservations')
          .update({ status: '취소' })
          .eq('id', ticket.reservation_id)
      }
    }
    
    // 업데이트된 티켓 정보 반환
    const { data: updatedTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('*, reservations(*)')
      .eq('id', ticketId)
      .single()
    
    if (fetchError) {
      console.error('업데이트된 티켓 조회 오류:', fetchError)
      throw fetchError
    }
    
    console.log('티켓 업데이트 성공:', updatedTicket)
    
    return NextResponse.json({ 
      success: true, 
      message: '티켓이 성공적으로 업데이트되었습니다.',
      data: updatedTicket 
    })
    
  } catch (error) {
    console.error('티켓 업데이트 오류:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || '티켓 업데이트 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}