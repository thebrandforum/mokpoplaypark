// app/api/staff-reservation/route.js
// 직원용 예약 생성 API - 결제 과정 없이 바로 예약번호 생성

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// POST - 직원용 예약 생성
export async function POST(request) {
  try {
    console.log('=== 직원용 예약 생성 API 시작 ===')
    
    const body = await request.json()
    console.log('받은 예약 데이터:', body)
    
    const { 
      customer_name, 
      phone, 
      email, 
      visit_date, 
      adult_count, 
      child_count, 
      guardian_count,
      total_amount,
      cart_items,
      payment_method,
      status,
      is_staff_reservation
    } = body

    console.log('🔍 결제 상태:', status)

    // 1. 필수 데이터 검증
    if (!customer_name?.trim() || !phone || !email?.trim() || !visit_date) {
      return Response.json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      }, { status: 400 })
    }

    // 2. 전화번호 정규화 및 검증
    const cleanPhone = phone.replace(/[^\d]/g, '')
    if (!/^010\d{8}$/.test(cleanPhone)) {
      return Response.json({
        success: false,
        message: '올바른 전화번호 형식이 아닙니다.'
      }, { status: 400 })
    }

    // 3. 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({
        success: false,
        message: '올바른 이메일 형식이 아닙니다.'
      }, { status: 400 })
    }

    // 4. 인원수 검증
    const totalPeople = (adult_count || 0) + (child_count || 0) + (guardian_count || 0)
    if (totalPeople === 0) {
      return Response.json({
        success: false,
        message: '최소 1명 이상 선택해주세요.'
      }, { status: 400 })
    }

    // 5. 날짜 검증 (오늘 이후)
    const today = new Date().toISOString().split('T')[0]
    if (visit_date < today) {
      return Response.json({
        success: false,
        message: '오늘 이후 날짜만 선택 가능합니다.'
      }, { status: 400 })
    }

    // 6. 예약번호 생성 (STF + 날짜 + 시간) - 직원 예약은 STF 접두어 사용
    const now = new Date()
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '') // HHMM
    const randomNum = Math.floor(Math.random() * 90) + 10 // 10-99
    const reservationId = `STF${dateStr}${timeStr}${randomNum}`

    console.log('생성된 예약번호:', reservationId)

    // 7. QR코드 데이터 생성
    const qrCodeData = reservationId
    const qrCode = `QR_${reservationId}_${Date.now()}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`

    console.log('QR코드 생성 완료')

    // 8. 중복 예약번호 확인
    const { data: existingReservation, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('id', reservationId)
      .single()

    if (existingReservation) {
      console.log('예약번호 중복 감지, 재생성 필요')
      return Response.json({
        success: false,
        message: '예약번호 생성 중 충돌이 발생했습니다. 다시 시도해주세요.'
      }, { status: 500 })
    }

    // 9. 예약 데이터 준비
    const reservationData = {
      id: reservationId,
      customer_name: customer_name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      visit_date: visit_date,
      adult_count: adult_count,
      child_count: child_count,
      guardian_count: guardian_count,
      total_amount: total_amount,
      cart_items: cart_items || null,
      payment_method: payment_method || 'staff',
      status: status || '결제완료',
      entry_status: '입장_전',
      qr_code: qrCode,
      payment_time: status === '결제완료' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      is_staff_reservation: true // 직원 예약 표시
    }
    
    console.log('💾 예약 저장 데이터:', reservationData)

    // 10. Supabase에 저장
    console.log('Supabase 저장 시작...')
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()

    if (error) {
      console.error('Supabase 저장 오류:', error)
      return Response.json({
        success: false,
        message: `예약 저장 실패: ${error.message}`,
        errorCode: error.code,
        errorDetails: error
      }, { status: 500 })
    }

    console.log('Supabase 저장 성공:', data)

    // 11. 티켓 생성
    if (data && data[0]) {
      console.log('티켓 생성 시작...')
      const reservation = data[0]
      const tickets = []
      let ticketNumber = 1
      
      // cart_items 방식으로 티켓 생성
      if (cart_items && cart_items.length > 0) {
        for (const item of cart_items) {
          // 각 아이템의 개수만큼 티켓 생성
          for (let i = 0; i < item.count; i++) {
            const ticketId = `TKT${Date.now()}${ticketNumber.toString().padStart(3, '0')}`
            
            // 카테고리 판별
            const category = item.name.includes('성인') || item.name.includes('어른') ? '성인' :
                           item.name.includes('어린이') || item.name.includes('청소년') ? '어린이' :
                           item.name.includes('보호자') ? '보호자' : '일반'
            
            // 이용시간 판별
            const duration = item.name.includes('2시간') ? '2시간' :
                           item.name.includes('1시간') ? '1시간' : '1DAY'
            
            const individualPrice = item.price
            
            tickets.push({
              id: ticketId,
              reservation_id: reservation.id,
              ticket_number: ticketNumber,
              ticket_type: item.name,
              category: category,
              duration: duration,
              price: individualPrice,
              qr_code: `${reservation.id}-T${ticketNumber}`,
              status: status || '결제완료',
              ticket_status: status || '결제완료',
              is_discount: item.isDiscount || false,
              created_at: new Date().toISOString()
            })
            
            ticketNumber++
          }
        }
      }
      
      // 티켓 일괄 삽입
      if (tickets.length > 0) {
        console.log(`${tickets.length}개 티켓 생성 중...`)
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .insert(tickets)
          .select()
        
        if (ticketError) {
          console.error('티켓 생성 오류:', ticketError)
          // 티켓 생성 실패해도 예약은 유지 (나중에 수동 생성 가능)
        } else {
          console.log('티켓 생성 성공:', ticketData?.length, '개')
        }
      }
    }

    // 12. SMS 발송 (결제완료 상태인 경우만)
    if (status === '결제완료' || !status) { // 기본값이 결제완료이므로
      try {
        console.log('예약 확정 SMS 발송 시작...')
        
        const host = request.headers.get('host')
        const protocol = host?.includes('localhost') ? 'http' : 'https'
        const smsUrl = `${protocol}://${host}/api/send-sms`
        
        // 이용권 정보 생성
        let ticketInfo = '';
        if (cart_items && cart_items.length > 0) {
          ticketInfo = cart_items.map(item => `${item.name} X ${item.count}매`).join(', ');
        } else {
          ticketInfo = `성인 ${adult_count || 0}명, 어린이 ${child_count || 0}명`;
        }

        // 이용월 추출
        const visitDateObj = new Date(visit_date);
        const visitMonth = `${visitDateObj.getFullYear()}년 ${(visitDateObj.getMonth() + 1).toString().padStart(2, '0')}월`;

        // 예약 확정 메시지
        const confirmMessage = `안녕하세요! 목포플레이파크 예약이 확정되었습니다.

[예약내역]
* 예약자명 : ${customer_name}님
* 예약번호 : ${reservationId}
* 이용권 : ${ticketInfo}
* 이용월 : ${visitMonth}
* 결제금액 : ${(total_amount || 0).toLocaleString()}원
* 결제상태 : 결제완료 (직원 처리)
* 예약확인 : ${protocol}://${host}/reservation-check

감사합니다.`
        
        const smsResponse = await fetch(smsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: cleanPhone,
            reservationId: reservationId,
            customerName: customer_name.trim(),
            customMessage: confirmMessage
          })
        })

        const smsResult = await smsResponse.json()
        
        if (smsResult.success) {
          console.log('예약 확정 SMS 발송 성공!', smsResult)
        } else {
          console.log('예약 확정 SMS 발송 실패:', smsResult.message)
        }

      } catch (smsError) {
        console.error('SMS 발송 요청 오류:', smsError)
      }
    }

    // 13. 성공 응답
    console.log('=== 직원용 예약 생성 완료 ===')
    
    return Response.json({
      success: true,
      message: '예약이 성공적으로 생성되었습니다.',
      data: {
        reservationId: reservationId,
        customerName: customer_name,
        phone: cleanPhone,
        email: email.trim(),
        visitDate: visit_date,
        adultCount: adult_count,
        childCount: child_count,
        guardianCount: guardian_count,
        totalAmount: total_amount,
        status: status || '결제완료',
        paymentMethod: payment_method,
        qrCode: qrCodeData,
        qrCodeUrl: qrCodeUrl,
        paymentTime: new Date().toISOString(), // 기본값이 결제완료이므로 항상 현재 시간
        isStaffReservation: true
      }
    })

  } catch (error) {
    console.error('=== 직원용 예약 생성 전체 오류 ===', error)
    
    return Response.json({
      success: false,
      message: '예약 생성 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}