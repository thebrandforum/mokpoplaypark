import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'

const supabase = createClient(
  'https://rplkcijqbksheqcnvjlf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
)

// GET 요청 처리 (쿼리 파라미터)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  
  console.log('🔔 결제 완료 GET 요청 접근')
  console.log('📋 전체 쿼리 파라미터:', Object.fromEntries(searchParams))
  
  try {
    // 빌게이트 파라미터 추출
    const resultData = {
      SERVICE_CODE: searchParams.get('SERVICE_CODE'),
      SERVICE_ID: searchParams.get('SERVICE_ID'),
      ORDER_ID: searchParams.get('ORDER_ID'),
      ORDER_DATE: searchParams.get('ORDER_DATE'),
      COMMAND: searchParams.get('COMMAND')
    }
    
    const response = searchParams.get('RESPONSE')
    const message = searchParams.get('MESSAGE')
    
    return await processPaymentReturn(resultData, response, message)
  } catch (error) {
    return handleError(error)
  }
}

// POST 요청 처리 (빌게이트에서 POST body로 데이터 전송)
export async function POST(request) {
  console.log('🔔 결제 완료 POST 요청 접근')
  console.log('🕐 요청 시간:', new Date().toISOString())
  
  try {
    // === 1단계: 원본 데이터 분석 ===
    console.log('🔍 === 원본 데이터 추적 ===')
    console.log('Content-Type:', request.headers.get('content-type'))
    
    // Raw body 확인 (복사본 생성)
    const requestClone = request.clone()
    const rawBody = await requestClone.text()
    console.log('Raw body 길이:', rawBody.length)
    console.log('Raw body 앞부분:', rawBody.substring(0, 200))
    
    // FormData 파싱
    const formData = await request.formData()
    
    // === 2단계: 기본 파라미터 추출 ===
    const resultData = {
      SERVICE_CODE: formData.get('SERVICE_CODE'),
      SERVICE_ID: formData.get('SERVICE_ID'),
      ORDER_ID: formData.get('ORDER_ID'),
      ORDER_DATE: formData.get('ORDER_DATE'),
      COMMAND: formData.get('COMMAND')
    }
    
    const response = formData.get('RESPONSE')
    const rawMessage = formData.get('MESSAGE')
    
    console.log('📋 기본 파라미터:', resultData)
    console.log('📋 RESPONSE 존재:', !!response)
    console.log('📋 MESSAGE 존재:', !!rawMessage)
    
    // === 3단계: MESSAGE 상세 분석 ===
    let cleanedMessage = null
    
    if (!rawMessage) {
      console.log('⚠️ MESSAGE 파라미터가 없습니다 (테스트 모드로 진행)')
      // 테스트 환경에서는 MESSAGE 없이도 진행 가능
    } else {
      console.log('🔍 === MESSAGE 상세 분석 ===')
      console.log('📋 MESSAGE 타입:', typeof rawMessage)
      console.log('📋 MESSAGE 길이:', rawMessage.length)
      console.log('📋 MESSAGE 시작 50자:', rawMessage.substring(0, 50))
      console.log('📋 MESSAGE 끝 50자:', rawMessage.slice(-50))
      
      // URL 인코딩 확인
      const hasUrlEncoding = rawMessage.includes('%')
      console.log('📋 URL 인코딩 포함:', hasUrlEncoding)
      
      if (hasUrlEncoding) {
        console.log('🔧 URL 디코딩 시도')
        try {
          const decoded = decodeURIComponent(rawMessage)
          console.log('📋 디코딩 후 길이:', decoded.length)
        } catch (e) {
          console.log('⚠️ URL 디코딩 실패:', e.message)
        }
      }
      
      // === 4단계: MESSAGE 구조 검증 ===
      if (rawMessage.length < 38) {
        console.error('❌ MESSAGE가 너무 짧습니다 (최소 38자 필요)')
        return Response.json({
          success: false,
          error: 'MESSAGE 데이터가 유효하지 않습니다'
        }, { status: 400 })
      }
      
      // 길이 헤더 분석
      const lengthHeader = rawMessage.substring(0, 4)
      const expectedLength = parseInt(lengthHeader, 10)
      const actualLength = rawMessage.length
      
      console.log('📋 길이 헤더:', lengthHeader)
      console.log('📋 예상 길이:', expectedLength)
      console.log('📋 실제 길이:', actualLength)
      console.log('📋 길이 차이:', expectedLength - actualLength)
      
      console.log('🔍 === 4 bytes 초과 원인 분석 ===')
      const messageBytes = Buffer.from(rawMessage, 'utf8')
      console.log('📋 MESSAGE HEX (앞 100 bytes):', messageBytes.subarray(0, 100).toString('hex'))
      const expected718 = rawMessage.substring(0, 718)
      const extra4bytes = rawMessage.substring(718, 722)
      console.log('📋 초과된 4 bytes 내용:', JSON.stringify(extra4bytes))
      console.log('📋 초과된 4 bytes HEX:', Buffer.from(extra4bytes, 'utf8').toString('hex'))
      
      // 구조 정보 추출
      const version = rawMessage.substring(4, 14).trim()
      const merchantId = rawMessage.substring(14, 34).trim()
      const serviceCode = rawMessage.substring(34, 38).trim()
      
      console.log('📋 MESSAGE 구조:')
      console.log('   VERSION:', `"${version}"`)
      console.log('   MERCHANT_ID:', `"${merchantId}"`)
      console.log('   SERVICE_CODE:', `"${serviceCode}"`)
      
      // 구조 검증
      const validationErrors = []
      if (version !== '0100') validationErrors.push(`VERSION 오류: "${version}" (예상: "0100")`)
      if (merchantId !== 'M2591189') validationErrors.push(`MERCHANT_ID 오류: "${merchantId}" (예상: "M2591189")`)
      if (serviceCode !== '0900') validationErrors.push(`SERVICE_CODE 오류: "${serviceCode}" (예상: "0900")`)
      
      if (validationErrors.length > 0) {
        console.error('❌ MESSAGE 구조 검증 실패:')
        validationErrors.forEach(error => console.error('   -', error))
      }
      
      // === 5단계: MESSAGE 정리 ===
      console.log('🔧 === MESSAGE 정리 시작 ===')
      
      cleanedMessage = rawMessage
      if (rawMessage) {
        // 줄바꿈만 제거, 공백은 보존
        const originalLength = rawMessage.length
        cleanedMessage = rawMessage
          .replace(/\r/g, '')     // 캐리지 리턴 제거
          .replace(/\n/g, '')     // 줄바꿈 제거
        
        const cleanedLength = cleanedMessage.length
        const lengthDiff = originalLength - cleanedLength
        
        console.log('📋 원본 길이:', originalLength)
        console.log('📋 정리 후 길이:', cleanedLength)
        console.log('📋 제거된 문자:', lengthDiff, lengthDiff > 0 ? '(줄바꿈 제거됨)' : '(변화 없음)')
        
        // === 6단계: 길이 헤더 수정 ===
        if (cleanedMessage.length >= 4) {
          const newExpectedLength = parseInt(cleanedMessage.substring(0, 4))
          const newActualLength = cleanedMessage.length
          
          console.log('🔧 === 길이 헤더 검증 및 수정 ===')
          console.log('📋 현재 헤더:', cleanedMessage.substring(0, 4))
          console.log('📋 예상 길이:', newExpectedLength)
          console.log('📋 실제 길이:', newActualLength)
          
          if (Math.abs(newExpectedLength - newActualLength) > 0) {
            console.log('🔧 길이 불일치 감지 - 헤더 수정 필요')
            
            // 실제 길이에 맞게 헤더 수정
            const correctedLength = newActualLength.toString().padStart(4, '0')
            cleanedMessage = correctedLength + cleanedMessage.substring(4)
            
            console.log('📋 수정 전 헤더:', lengthHeader)
            console.log('📋 수정 후 헤더:', correctedLength)
            console.log('✅ 길이 헤더 수정 완료')
          } else {
            console.log('✅ 길이 헤더 정상')
          }
        }
      }
      
      console.log('✅ MESSAGE 정리 완료')
      console.log('📋 최종 MESSAGE 길이:', cleanedMessage?.length || 0)
      console.log('📋 최종 MESSAGE 시작:', cleanedMessage?.substring(0, 50) || 'N/A')
    }
    
    // === 7단계: 최종 검증 (MESSAGE가 있는 경우만) ===
    if (rawMessage && cleanedMessage && cleanedMessage.length < 38) {
      console.error('❌ 정리된 MESSAGE가 유효하지 않습니다')
      return Response.json({
        success: false,
        error: 'MESSAGE 정리 실패'
      }, { status: 400 })
    }
    
    // === 8단계: 결제 처리 ===
    console.log('🎯 결제 처리 시작')
    return await processPaymentReturn(resultData, response, cleanedMessage)
    
  } catch (error) {
    console.error('❌ POST 요청 처리 중 오류:', error)
    console.error('❌ 스택 트레이스:', error.stack)
    
    return Response.json({
      success: false,
      error: '결제 처리 중 오류가 발생했습니다: ' + error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 공통 결제 처리 함수
async function processPaymentReturn(resultData, response, message) {
  console.log('📋 결제 결과 데이터:', resultData)
  console.log('📋 RESPONSE:', response)
  console.log('📋 MESSAGE:', message ? message.substring(0, 100) + '...' : 'null')
  
  // ORDER_ID에서 예약 ID 추출
  const orderId = resultData.ORDER_ID
  let isSuccess = false
  let amount = '0'
  let finalReservationId = null
  let reservationData = null
  
  if (!orderId) {
    throw new Error('주문 ID가 없습니다.')
  }
  
  // TEMP로 시작하면 임시 예약 처리
  if (orderId.startsWith('TEMP')) {
    console.log('🔄 임시 예약 처리 시작:', orderId)
    
    // 1. 임시 예약 조회
    const { data: tempReservation, error: tempError } = await supabase
      .from('temp_reservations')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (tempError || !tempReservation) {
      console.error('임시 예약 조회 오류:', tempError)
      throw new Error('임시 예약 정보를 찾을 수 없습니다.')
    }
    
    console.log('📋 임시 예약 정보:', tempReservation)
    amount = tempReservation.total_amount?.toString() || '0'
    
    // PHP 프록시 서버를 통한 승인 API 호출
    let approvalResult = null
    if (message) {
      console.log('🎯 실승인 처리 시작...')
      approvalResult = await callApprovalAPI(message, resultData.SERVICE_CODE, resultData.SERVICE_ID)
      
      if (!approvalResult.success) {
        console.log('❌ 실승인 실패:', approvalResult.message || approvalResult.error)
        
        // 임시 예약 삭제
        await supabase
          .from('temp_reservations')
          .delete()
          .eq('id', orderId)
        
        throw new Error('결제 승인에 실패했습니다.')
      }
    }
    
    // 2. 새로운 실제 예약 ID 생성
    const now = new Date()
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '') // HHMM
    const randomNum = Math.floor(Math.random() * 90) + 10 // 10-99
    finalReservationId = `ADV${dateStr}${timeStr}${randomNum}`
    
    console.log('🆕 생성된 실제 예약번호:', finalReservationId)
    
    // 3. QR코드 데이터 생성
    const qrCodeData = finalReservationId
    const qrCode = `QR_${finalReservationId}_${Date.now()}`
    
    // 4. 실제 예약 데이터 준비
    const currentTime = new Date()
    const koreaTime = new Date(currentTime.getTime() + (9 * 60 * 60 * 1000))
    
    const newReservationData = {
      id: finalReservationId,
      customer_name: tempReservation.customer_name,
      phone: tempReservation.phone,
      email: tempReservation.email,
      visit_date: tempReservation.visit_date,
      adult_count: tempReservation.adult_count || 0,
      child_count: tempReservation.child_count || 0,
      guardian_count: tempReservation.guardian_count || 0,
      total_amount: tempReservation.total_amount,
      cart_items: tempReservation.cart_items || null,
      payment_method: 'card',
      status: '결제완료',
      entry_status: '입장_전',
      qr_code: qrCode,
      payment_time: koreaTime.toISOString(),
      created_at: koreaTime.toISOString(),
      user_id: tempReservation.user_id || null,
      transaction_id: approvalResult?.transactionId || null,
      auth_number: approvalResult?.authNumber || null,
      auth_date: approvalResult?.authDate || null,
      auth_amount: approvalResult?.authAmount || null
    }
    
    console.log('💾 실제 예약 저장 데이터:', newReservationData)
    
    // 5. 실제 예약 생성
    const { data: newReservation, error: createError } = await supabase
      .from('reservations')
      .insert([newReservationData])
      .select()
    
    if (createError) {
      console.error('예약 생성 오류:', createError)
      throw new Error('예약 생성에 실패했습니다.')
    }
    
    console.log('✅ 실제 예약 생성 성공:', newReservation)
    reservationData = newReservation[0]
    
    // 6. 티켓 생성
    if (tempReservation.cart_items && tempReservation.cart_items.length > 0) {
      console.log('🎫 티켓 생성 시작...')
      const tickets = []
      let ticketNumber = 1
      
      for (const item of tempReservation.cart_items) {
        for (let i = 0; i < item.count; i++) {
          const category = item.name.includes('성인') || item.name.includes('어른') ? '성인' :
                         item.name.includes('어린이') || item.name.includes('청소년') ? '어린이' :
                         item.name.includes('보호자') ? '보호자' : '일반'
          
          const duration = item.name.includes('2시간') ? '2시간' :
                         item.name.includes('1시간') ? '1시간' : '1DAY'
          
          tickets.push({
            // id는 자동 생성되므로 제거
            reservation_id: finalReservationId,
            ticket_type: item.name,
            category: category,
            duration: duration,
            price: item.price,
            is_discount: item.isDiscount || false,
            ticket_number: ticketNumber,
            status: '결제완료',  // 기본값에 맞춤
            entry_status: '입장_전',
			created_at: koreaTime.toISOString()
            // created_at, updated_at는 자동 생성
          })
          
          ticketNumber++
        }
      }
      
      if (tickets.length > 0) {
        const { error: ticketError } = await supabase
          .from('tickets')
          .insert(tickets)
        
        if (ticketError) {
          console.error('티켓 생성 오류:', ticketError)
          // 티켓 생성 실패해도 예약은 유지
        } else {
          console.log(`✅ ${tickets.length}개 티켓 생성 완료`)
        }
      }
    }
    
    // 7. 임시 예약 삭제
    const { error: deleteError } = await supabase
      .from('temp_reservations')
      .delete()
      .eq('id', orderId)
    
    if (deleteError) {
      console.error('임시 예약 삭제 오류:', deleteError)
    } else {
      console.log('✅ 임시 예약 삭제 완료')
    }
    
    isSuccess = true
    
  } else {
    // 기존 예약 처리 (ADV로 시작하는 경우)
    console.log('📋 일반 예약 처리:', orderId)
    
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (fetchError || !reservation) {
      console.error('예약 조회 오류:', fetchError)
      throw new Error('예약 정보를 찾을 수 없습니다.')
    }
    
    console.log('📋 예약 정보:', reservation)
    amount = reservation.total_amount?.toString() || '0'
    finalReservationId = orderId
    reservationData = reservation
    
    // 승인 API 호출 및 상태 업데이트
    if (message) {
      console.log('🎯 실승인 처리 시작...')
      const approvalResult = await callApprovalAPI(message, resultData.SERVICE_CODE, resultData.SERVICE_ID)
      
      if (approvalResult.success) {
        console.log('✅ 실승인 성공!')
        
        // 결제 성공으로 상태 업데이트
        const { data: updateData, error: updateError } = await supabase
          .from('reservations')
          .update({
            status: '결제완료',
            payment_time: new Date().toISOString(),
            transaction_id: approvalResult.transactionId,
            auth_number: approvalResult.authNumber,
            auth_date: approvalResult.authDate,
            auth_amount: approvalResult.authAmount
          })
          .eq('id', orderId)
          .select()
        
        if (updateError) {
          console.error('예약 상태 업데이트 오류:', updateError)
        } else {
          console.log('✅ 예약 상태 업데이트 완료:', updateData)
          isSuccess = true
        }
      } else {
        console.log('❌ 실승인 실패:', approvalResult.message || approvalResult.error)
        
        // 결제 실패로 상태 업데이트
        await supabase
          .from('reservations')
          .update({
            status: '결제 실패',
            payment_failure_reason: approvalResult.message || approvalResult.error
          })
          .eq('id', orderId)
      }
    } else {
      // MESSAGE가 없는 경우 (테스트 환경 등)
      const { data: updateData, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: '결제완료',
          payment_time: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
      
      if (!updateError) {
        isSuccess = true
      }
    }
  }
  
  // QR 코드 생성 (성공한 경우만)
  let qrCodeBase64 = ''
  if (isSuccess && finalReservationId && reservationData) {
    try {
      const qrData = JSON.stringify({
        reservationId: finalReservationId,
        customerName: reservationData.customer_name,
        visitDate: reservationData.visit_date,
        totalAmount: reservationData.total_amount,
        timestamp: new Date().getTime()
      })
      
      qrCodeBase64 = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (qrError) {
      console.error('QR코드 생성 오류:', qrError)
    }
  }
  
  // HTML 응답 생성
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>결제 ${isSuccess ? '완료' : '실패'}</title>
      <style>
          body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 15px; 
              background: #f5f5f5; 
              text-align: center;
              font-size: 14px;
          }
          .container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 20px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          h1 {
              font-size: 20px;
              margin: 10px 0;
          }
          h3 {
              font-size: 16px;
              margin: 10px 0;
          }
          .success { 
              background: #d4edda; 
              color: #155724; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 15px 0; 
              font-size: 14px;
          }
          .error { 
              background: #f8d7da; 
              color: #721c24; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 15px 0; 
              font-size: 14px;
          }
          .qr-section {
              margin: 20px 0;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 10px;
          }
          .qr-section p {
              font-size: 13px;
              margin: 8px 0;
          }
          .buttons { 
              text-align: center; 
              margin-top: 20px; 
          }
          .btn { 
              display: inline-block; 
              padding: 10px 18px; 
              margin: 5px; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold; 
              font-size: 13px;
              cursor: pointer;
              border: none;
          }
          .btn-primary { 
              background: #007bff; 
              color: white; 
          }
          .btn-secondary { 
              background: #6c757d; 
              color: white; 
          }
          .btn:hover { 
              opacity: 0.8; 
          }
          #qr-display img {
              max-width: 200px;
              height: auto;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>${isSuccess ? '🎉 결제 완료!' : '❌ 결제 실패!'}</h1>
          
          ${isSuccess ? `
              <div class="success">
                  <h3>결제가 성공적으로 처리되었습니다.</h3>
              </div>
              
              ${finalReservationId ? `
                  <div class="qr-section">
                      <h3>📱 입장 QR코드</h3>
                      <p><strong>예약번호:</strong> ${finalReservationId}</p>
                      <p><strong>고객명:</strong> ${reservationData.customer_name}</p>
                      <p><strong>방문일:</strong> ${reservationData.visit_date}</p>
                      <p><strong>결제금액:</strong> ${Number(amount).toLocaleString()}원</p>
                      
                      ${qrCodeBase64 ? `
                          <div id="qr-display">
                              <img src="${qrCodeBase64}" alt="QR코드" />
                          </div>
                          <p style="color: #666; font-size: 12px;">
                              * 입장 시 위 QR코드를 제시해주세요.<br>
                              * 스크린샷을 찍어 보관하시기 바랍니다.
                          </p>
                      ` : ''}
                  </div>
              ` : ''}
          ` : `
              <div class="error">
                  <h3>결제 처리에 실패했습니다.</h3>
                  <p>다시 시도해주시거나 고객센터로 문의해주세요.</p>
              </div>
          `}
          
          <div class="buttons">
              ${isSuccess ? `
                  <button onclick="goToReservationCheck()" class="btn btn-primary">예약 확인</button>
              ` : `
                  <button onclick="goToReservation()" class="btn btn-primary">다시 예약하기</button>
              `}
              <button onclick="goToHome()" class="btn btn-secondary">메인페이지</button>
          </div>
          
          <script>
              function goToReservationCheck() {
                  window.top.location.href = '/reservation-check';
              }
              
              function goToReservation() {
                  window.top.location.href = '/reservation';
              }
              
              function goToHome() {
                  window.top.location.href = '/';
              }
          </script>
      </div>
  </body>
  </html>
  `
  
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

// PHP 프록시 서버를 통한 승인 API 호출 함수
async function callApprovalAPI(messageData, serviceCode, serviceId) {
  try {
    console.log('🔄 PHP 프록시 서버를 통한 승인 API 호출 시작...')
    console.log('📋 MESSAGE 데이터:', messageData.substring(0, 100) + '...')
    console.log('📋 SERVICE_CODE:', serviceCode)
    console.log('📋 SERVICE_ID:', serviceId)
    
    // PHP 프록시 서버 URL (실제 빌게이트 연동)
    const phpProxyUrl = 'http://127.0.0.1:3000/billgate-approval.php'
    
    // PHP 서버로 전송할 데이터
    const requestData = {
      MESSAGE: messageData,
      SERVICE_CODE: serviceCode,
      SERVICE_ID: serviceId
    }
    
    console.log('🌐 PHP 프록시 서버 호출:', phpProxyUrl)
    
    // PHP 서버로 HTTP POST 요청
    const response = await fetch(phpProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData),
      timeout: 30000 // 30초 타임아웃
    })
    
    if (!response.ok) {
      throw new Error(`PHP 서버 응답 오류: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('✅ PHP 서버 응답 수신:', result)
    
    // PHP 서버의 응답 구조에 맞게 반환
    return {
      success: result.success,
      responseCode: result.responseCode,
      message: result.responseMessage || result.message,
      transactionId: result.transactionId,
      authNumber: result.additionalData?.authNumber,
      authDate: result.additionalData?.authDate,
      authAmount: result.additionalData?.authAmount,
      quota: result.additionalData?.quota,
      cardCompanyCode: result.additionalData?.cardCompanyCode,
      pinNumber: result.additionalData?.pinNumber,
      detailResponseCode: result.detailResponseCode,
      detailMessage: result.detailResponseMessage,
      server: result.server || 'PHP-Proxy'
    }
    
  } catch (error) {
    console.error('❌ PHP 프록시 서버 호출 오류:', error)
    return {
      success: false,
      error: error.message,
      server: 'PHP-Proxy-Error'
    }
  }
}

// 에러 처리 함수
function handleError(error) {
  console.error('결제 완료 처리 오류:', error)
  
  const errorHtml = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <title>오류 발생</title>
      <style>
          body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f5f5f5; 
              text-align: center;
          }
          .container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 20px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .btn { 
              display: inline-block; 
              padding: 10px 18px; 
              margin: 10px; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold; 
              background: #007bff; 
              color: white; 
          }
          .btn:hover { 
              opacity: 0.8; 
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h2>❌ 결제 처리 중 서버 오류가 발생했습니다</h2>
          <p>잠시 후 다시 시도해주세요.</p>
          <a href="/" class="btn">메인페이지로 이동</a>
      </div>
  </body>
  </html>
  `
  
  return new Response(errorHtml, {
    status: 500,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}