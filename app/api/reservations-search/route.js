// app/api/reservations-search/route.js
// 회원/비회원 구분 검색 지원 버전 + 예약번호 검색 + 이름 검색 추가

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 예약 검색 (user_id, 전화번호, 이메일, 예약번호, 이름)
export async function GET(request) {
  try {
    console.log('🔍 예약 검색 요청 시작...')
    
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')
    const userId = searchParams.get('user_id')
    const reservationId = searchParams.get('reservationId')
    const name = searchParams.get('name')  // 🆕 이 줄 추가!
    const excludeDeleted = searchParams.get('excludeDeleted')
    
    console.log('검색 조건:', { phone, email, userId, reservationId, name })

    // 검색 조건 확인
    if (!phone && !email && !userId && !reservationId && !name) {
      return Response.json(
        { success: false, message: '검색 조건을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 기본 쿼리
    let query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    
    // 🆕 삭제된 예약 제외 (이 부분 추가!)
    if (excludeDeleted === 'true') {
      query = query.is('deleted_at', null)
    }
    
    // 예약번호로 검색
    if (reservationId) {
      console.log('🎫 예약번호 검색:', reservationId)
      
      // TEMP로 시작하면 temp_reservations 테이블에서 검색
      if (reservationId.startsWith('TEMP')) {
        console.log('📋 임시 예약 테이블에서 검색')
        
        const { data: tempReservations, error: tempError } = await supabase
          .from('temp_reservations')
          .select('*')
          .eq('id', reservationId)
          .single()
        
        if (tempError) {
          console.error('❌ 임시 예약 검색 오류:', tempError)
          return Response.json({
            success: false,
            message: '임시 예약을 찾을 수 없습니다.',
            data: { reservations: [] }
          })
        }
        
        if (tempReservations) {
          // temp_reservations 데이터를 reservations 형식으로 변환
          return Response.json({
            success: true,
            message: '임시 예약을 찾았습니다.',
            data: [{
              id: tempReservations.id,
              reservationId: tempReservations.id,
              customerName: tempReservations.customer_name,
              phone: tempReservations.phone,
              email: tempReservations.email,
              visitDate: tempReservations.visit_date,
              adultCount: tempReservations.adult_count,
              childCount: tempReservations.child_count,
              cartItems: tempReservations.cart_items,
              totalAmount: tempReservations.total_amount,
              status: '결제 진행중',  // 임시 예약은 결제 진행중 상태
              createdAt: tempReservations.created_at,
              userId: tempReservations.user_id
            }]
          })
        }
      }
      
      // 일반 예약번호는 기존 로직대로
      query = query.eq('id', reservationId)
    }
    // 회원 검색 (user_id)
    else if (userId) {
      console.log('👤 회원 검색 - user_id:', userId)
      query = query.eq('user_id', userId)
    }
    // 비회원 검색 (이름 + 전화번호)
    else if (name && phone) {
      // 🆕 이름과 전화번호 모두 일치하는 경우만 검색
      console.log('🔍 이름 + 전화번호 검색:', { name, phone })
      
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      const phoneFormats = [
        phone,
        cleanPhone,
        `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,7)}-${cleanPhone.slice(7)}`,
        `${cleanPhone.slice(0,3)}${cleanPhone.slice(3,7)}${cleanPhone.slice(7)}`
      ]
      
      // 이름 뒤에 공백이 있을 수 있으므로 두 가지 경우 모두 검색
      query = query
        .or(`customer_name.eq.${name.trim()},customer_name.eq.${name.trim() + ' '}`)
        .eq('phone', cleanPhone)

      
    }
    // 기존 로직 (전화번호나 이메일로만 검색)
    else {
      // 전화번호로 검색
      if (phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '')
        const phoneFormats = [
          phone,
          cleanPhone,
          `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,7)}-${cleanPhone.slice(7)}`,
          `${cleanPhone.slice(0,3)}${cleanPhone.slice(3,7)}${cleanPhone.slice(7)}`
        ]
        
        console.log('📞 전화번호 검색 형식들:', phoneFormats)
        
        const phoneConditions = phoneFormats.map(format => `phone.eq.${format}`).join(',')
        query = query.or(phoneConditions)
      }
      
      // 이메일로 검색
      if (email) {
        console.log('📧 이메일 검색:', email)
        if (phone) {
          query = query.or(`email.eq.${email.toLowerCase()}`)
        } else {
          query = query.eq('email', email.toLowerCase())
        }
      }
      
      // 🆕 이름으로만 검색
      if (name && !phone && !email) {
        console.log('👤 이름으로만 검색:', name)
        // 이름 뒤에 공백이 있을 수 있으므로 두 가지 경우 모두 검색
        const nameVariations = [`customer_name.eq.${name.trim()}`, `customer_name.eq.${name.trim() + ' '}`]
        query = query.or(nameVariations.join(','))
      }
    }

    console.log('🚀 Supabase 쿼리 실행...')
    const { data: reservations, error } = await query

    if (error) {
      console.error('❌ Supabase 검색 오류:', error)
      return Response.json(
        { 
          success: false, 
          message: `검색 실패: ${error.message}`,
          errorCode: error.code
        },
        { status: 500 }
      )
    }

    console.log(`✅ 검색 완료: ${reservations.length}개 예약 발견`)

    // 결과가 없으면
    if (reservations.length === 0) {
      return Response.json({
        success: false,
        message: reservationId ? '해당 예약번호를 찾을 수 없습니다.' : 
                 userId ? '예약 내역이 없습니다.' : 
                 '일치하는 예약을 찾을 수 없습니다.',
        data: {
          reservations: [],
          searchCondition: { phone, email, userId, reservationId, name }
        }
      })
    }

    // 성공 응답
    return Response.json({
      success: true,
      message: `${reservations.length}개의 예약을 찾았습니다.`,
      data: reservations.map(reservation => ({
          id: reservation.id,
          reservationId: reservation.id,
          customerName: reservation.customer_name,
          phone: reservation.phone,
          email: reservation.email,
          visitDate: reservation.visit_date,
          adultCount: reservation.adult_count,
          childCount: reservation.child_count,
          cartItems: reservation.cart_items,
          totalAmount: reservation.total_amount,
          status: reservation.status,
          entryStatus: reservation.entry_status,
          qrCode: reservation.qr_code,
          paymentTime: reservation.payment_time,
          createdAt: reservation.created_at,
          checkinTime: reservation.checkin_time,
          userId: reservation.user_id,
          transaction_id: reservation.transaction_id,
		  payment_method: reservation.payment_method
      }))
    })

  } catch (error) {
    console.error('❌ 예약 검색 중 오류:', error)
    
    return Response.json(
      { 
        success: false, 
        message: '예약 검색 중 오류가 발생했습니다.',
        error: error.message
      },
      { status: 500 }
    )
  }
}

// POST - 더 복잡한 검색 (기존 코드 유지)
export async function POST(request) {
  try {
    console.log('🔍 고급 예약 검색 요청...')
    
    const body = await request.json()
    const { phone, email, visitDate, status, customerName } = body

    console.log('고급 검색 조건:', body)

    let query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    
    // 삭제된 예약 제외 (🆕 추가)
    if (excludeDeleted === 'true') {
      query = query.is('deleted_at', null)
    }

    // 전화번호 검색 (개선된 방식)
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      const phoneFormats = [
        phone,
        cleanPhone,
        `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,7)}-${cleanPhone.slice(7)}`,
        `${cleanPhone.slice(0,3)}${cleanPhone.slice(3,7)}${cleanPhone.slice(7)}`
      ]
      const phoneConditions = phoneFormats.map(format => `phone.eq.${format}`).join(',')
      query = query.or(phoneConditions)
    }

    if (email) {
      query = query.eq('email', email.toLowerCase())
    }

    if (visitDate) {
      query = query.eq('visit_date', visitDate)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (customerName) {
      // 🆕 부분 매칭 대신 정확한 매칭으로 변경 옵션
      // query = query.eq('customer_name', customerName)  // 정확한 매칭
      query = query.ilike('customer_name', `%${customerName}%`)  // 부분 매칭 유지
    }

    const { data: reservations, error } = await query

    if (error) {
      console.error('❌ 고급 검색 오류:', error)
      return Response.json(
        { 
          success: false, 
          message: `검색 실패: ${error.message}`,
          errorCode: error.code
        },
        { status: 500 }
      )
    }

    console.log(`✅ 고급 검색 완료: ${reservations.length}개 발견`)

    return Response.json({
      success: true,
      message: `${reservations.length}개의 예약을 찾았습니다.`,
      data: {
        reservations: reservations,
        total: reservations.length,
        searchCondition: body
      }
    })

  } catch (error) {
    console.error('❌ 고급 검색 중 오류:', error)
    
    return Response.json(
      { 
        success: false, 
        message: '고급 검색 중 오류가 발생했습니다.',
        error: error.message 
      },
      { status: 500 }
    )
  }
}