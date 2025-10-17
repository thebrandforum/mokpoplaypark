// app/api/admin/reservations/cancellist/route.js
// 취소 예약 관리 전용 API

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 취소 예약 목록 조회
export async function GET(request) {
  try {
    console.log('📋 취소 예약 목록 조회 요청...')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const searchKeyword = searchParams.get('searchKeyword')
    const sortBy = searchParams.get('sortBy') || 'cancelledAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const cancelType = searchParams.get('cancelType')

    console.log('📊 조회 조건:', { 
      page, 
      limit, 
      searchKeyword,
      sortBy,
      sortOrder,
      cancelType
    })

    // 기본 쿼리 - 취소 상태만 조회
    let query
    
    if (sortBy === 'cancelledAt') {
      // 취소시간 정렬을 위해 VIEW 사용
      query = supabase
        .from('reservations_with_cancel_time')
        .select('*', { count: 'exact' })
        .eq('status', '취소')
        .is('deleted_at', null)
    } else {
      // 일반 테이블 사용 (기본은 취소시간 정렬이므로 거의 사용 안됨)
      query = supabase
        .from('reservations')
        .select(`
          id,
          customer_name,
          phone,
          email,
          visit_date,
          adult_count,
          child_count,
          cart_items,
          total_amount,
          payment_method,
          status,
          entry_status,
          qr_code,
          payment_time,
          created_at,
          user_id
        `, { count: 'exact' })
        .eq('status', '취소')
        .is('deleted_at', null)
    }

    // 고객 검색 조건
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim()
      const cleanPhone = keyword.replace(/[^0-9]/g, '')
      
      if (cleanPhone && cleanPhone.length >= 1) {
        // 숫자가 포함되면 전화번호로도 검색
        query = query.or(`customer_name.ilike.%${keyword}%,phone.ilike.%${cleanPhone}%`)
        console.log('🔍 통합 검색 (이름+전화):', keyword, '/', cleanPhone)
      } else {
        // 고객명으로만 검색
        query = query.ilike('customer_name', `%${keyword}%`)
        console.log('🔍 통합 검색 (이름):', keyword)
      }
    }

    // 취소 타입 필터링
    if (cancelType && cancelType !== 'all') {
      // tickets 테이블과 조인해서 cancelled_by 필터링
      query = query
        .select('*, tickets!inner(cancelled_by)')
        .eq('tickets.cancelled_by', cancelType)
      console.log('🔍 취소 타입 필터:', cancelType)
    }

    // 정렬 처리
    if (sortBy === 'cancelledAt') {
      query = query.order('latest_cancelled_at', { 
        ascending: sortOrder === 'asc',
        nullsFirst: false 
      })
      console.log('📊 취소시간 정렬:', sortOrder)
    } else {
      // 다른 정렬 기준 (필요시 추가)
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }

    // 페이지네이션
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    console.log('🚀 Supabase 쿼리 실행...')

    const { data, error, count } = await query

    if (error) {
      console.error('❌ 취소 예약 목록 조회 오류:', error)
      return Response.json({
        success: false,
        message: 'Database query failed',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ 취소 예약 목록 조회 성공:', data?.length, '건, 총', count, '건')

    // 데이터 변환 (프론트엔드 친화적으로)
    const transformedData = data?.map(reservation => ({
      id: reservation.id,
      customerName: reservation.customer_name,
      phone: reservation.phone,
      email: reservation.email,
      visitDate: reservation.visit_date,
      adultCount: reservation.adult_count || 0,
      childCount: reservation.child_count || 0,
      cartItems: reservation.cart_items || [],
      totalAmount: reservation.total_amount,
      paymentMethod: reservation.payment_method,
      status: reservation.status,
      entryStatus: reservation.entry_status,
      qrCode: reservation.qr_code,
      paymentTime: reservation.payment_time,
      createdAt: reservation.created_at,
      cancelledAt: reservation.latest_cancelled_at || null,  // VIEW에서 가져온 취소시간
      userId: reservation.user_id
    })) || []

    return Response.json({
      success: true,
      message: 'Cancelled reservations retrieved successfully',
      data: transformedData,
      total: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      itemsPerPage: limit
    })

  } catch (error) {
    console.error('❌ 취소 예약 목록 조회 중 예외 발생:', error)
    
    return Response.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
}

// PUT - 취소 예약 처리 (향후 기능 추가용)
export async function PUT(request) {
  try {
    console.log('🔄 취소 예약 처리 요청...')
    
    const body = await request.json()
    const { reservationId, action } = body
    
    if (!reservationId) {
      return Response.json({
        success: false,
        message: 'Reservation ID is required'
      }, { status: 400 })
    }

    // 예약 존재 확인
    const { data: existingReservation, error: checkError } = await supabase
      .from('reservations')
      .select('id, customer_name, status')
      .eq('id', reservationId)
      .single()

    if (checkError || !existingReservation) {
      console.error('❌ 예약 조회 실패:', checkError)
      return Response.json({
        success: false,
        message: 'Reservation not found'
      }, { status: 404 })
    }

    // 취소 상태가 아닌 경우 에러
    if (existingReservation.status !== '취소') {
      return Response.json({
        success: false,
        message: 'This reservation is not cancelled'
      }, { status: 400 })
    }

    // 향후 기능 추가 예정
    // - 환불 처리
    // - 복구
    // - 기타 취소 관련 작업

    return Response.json({
      success: true,
      message: 'Action completed successfully',
      data: {
        reservationId: reservationId,
        customerName: existingReservation.customer_name
      }
    })

  } catch (error) {
    console.error('❌ 취소 예약 처리 중 오류:', error)
    
    return Response.json({
      success: false,
      message: 'Failed to process cancelled reservation',
      error: error.message
    }, { status: 500 })
  }
}