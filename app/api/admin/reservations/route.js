// app/api/admin/reservations/route.js
// 관리자 예약 관리 API - 리팩토링 완전판

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// 상수 및 헬퍼 함수
// ============================================

// 예약 테이블 SELECT 컬럼 목록
const RESERVATION_COLUMNS = `
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
  checkin_time,
  user_id
`

// 결제 상태 매핑
const mapPaymentStatus = (status) => {
  return status === '결제완료' ? '결제 완료' : status
}

// ============================================
// GET - 관리자 예약 목록 조회
// ============================================
export async function GET(request) {
  try {
    console.log('📋 관리자 예약 목록 조회 요청...')
    const { searchParams } = new URL(request.url)
    
    // 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const showByTicket = searchParams.get('showByTicket') === 'true'
    
    const statusList = searchParams.get('statusList')
    const entryStatusList = searchParams.get('entryStatusList')
    const additionalStatusList = searchParams.get('additionalStatusList')
    const memberType = searchParams.get('memberType')
    const visitMonth = searchParams.get('visitMonth')
    const searchKeyword = searchParams.get('searchKeyword')
    const reservationId = searchParams.get('reservationId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    console.log('📊 조회 조건:', { 
      page, limit, showByTicket, statusList, entryStatusList, 
      sortBy, sortOrder 
    })

    // ============================================
    // 정렬별 쿼리 생성
    // ============================================
    
    let query
    let count = 0
    let data = []

    if (sortBy === 'cancelledAt') {
      // ========== 취소시간 정렬 - VIEW 사용 ==========
      query = supabase
        .from('reservations_with_cancel_time')
        .select('*', { count: 'exact' })
        .eq('status', '취소')
        .is('deleted_at', null)
        .order('latest_cancelled_at', { 
          ascending: sortOrder === 'asc',
          nullsFirst: false 
        })
      
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)
      
      const result = await query
      data = result.data
      count = result.count
      
      console.log('✅ 취소시간 정렬 완료:', count, '건')
      
    } else if (sortBy === 'checkinTime') {
      // ========== 입장시간 정렬 - 티켓 기반 ==========
      
      if (showByTicket) {
        // ===== ON: 입장완료 티켓만 개별 표시 =====
        console.log('🎫 티켓별 보기 ON - 입장완료 티켓만 조회')
        
        // 입장완료 티켓만 조회 (페이징 포함)
        let ticketQuery = supabase
          .from('tickets')
          .select('*', { count: 'exact' })
          .not('used_at', 'is', null)
          .eq('ticket_status', '결제완료')
          .is('deleted_at', null)
          .order('used_at', { ascending: sortOrder === 'asc' })
        
        const offset = (page - 1) * limit
        ticketQuery = ticketQuery.range(offset, offset + limit - 1)
        
        const { data: completedTickets, count: ticketCount } = await ticketQuery
        
        console.log('🎫 입장완료 티켓 조회:', ticketCount, '건')
        
        if (completedTickets && completedTickets.length > 0) {
          // 티켓들의 예약 ID 수집
          const reservationIds = [...new Set(completedTickets.map(t => t.reservation_id))]
          
          // 예약 정보 조회
          const { data: reservations } = await supabase
            .from('reservations')
            .select(RESERVATION_COLUMNS)
            .in('id', reservationIds)
            .is('deleted_at', null)
          
          // 티켓 정보와 예약 정보 매핑
          data = completedTickets.map(ticket => {
            const reservation = reservations.find(r => r.id === ticket.reservation_id)
            return reservation ? {
              ...reservation,
              _singleTicket: ticket  // 단일 티켓 정보 (프론트엔드에서 사용)
            } : null
          }).filter(Boolean)
          
          count = ticketCount
        } else {
          data = []
          count = 0
        }
        
        console.log('✅ 티켓별 보기 완료:', data.length, '건')
        
      } else {
        // ===== OFF: 하나라도 입장완료면 예약 전체 표시 =====
        console.log('📋 예약별 보기 OFF - 가장 빠른 입장시간 기준')
        
        // 1. 입장완료 티켓 전체 조회
        const { data: completedTickets } = await supabase
          .from('tickets')
          .select('reservation_id, used_at')
          .not('used_at', 'is', null)
          .eq('ticket_status', '결제완료')
          .is('deleted_at', null)
        
        console.log('🎫 입장완료 티켓 조회:', completedTickets?.length || 0, '건')
        
        if (!completedTickets || completedTickets.length === 0) {
          data = []
          count = 0
        } else {
          // 2. 예약별로 가장 빠른 used_at 계산
          const reservationMap = new Map()
          
          completedTickets.forEach(ticket => {
            const existing = reservationMap.get(ticket.reservation_id)
            if (!existing || new Date(ticket.used_at) < new Date(existing.earliest_used_at)) {
              reservationMap.set(ticket.reservation_id, {
                reservation_id: ticket.reservation_id,
                earliest_used_at: ticket.used_at
              })
            }
          })
          
          // 3. 정렬
          const sortedReservations = Array.from(reservationMap.values()).sort((a, b) => {
            const dateA = new Date(a.earliest_used_at)
            const dateB = new Date(b.earliest_used_at)
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
          })
          
          console.log('📊 예약별 그룹화 완료:', sortedReservations.length, '건')
          
          count = sortedReservations.length
          
          // 4. 페이징 적용
          const offset = (page - 1) * limit
          const pagedReservations = sortedReservations.slice(offset, offset + limit)
          const pagedIds = pagedReservations.map(r => r.reservation_id)
          
          console.log('📄 페이징 적용:', pagedIds.length, '건')
          
          // 5. 예약 정보 조회
          if (pagedIds.length > 0) {
            const { data: reservations } = await supabase
              .from('reservations')
              .select(RESERVATION_COLUMNS)
              .in('id', pagedIds)
              .is('deleted_at', null)
            
            // 정렬 순서 유지하면서 매핑
            data = pagedIds.map(id => 
              reservations.find(r => r.id === id)
            ).filter(Boolean)
          } else {
            data = []
          }
        }
        
        console.log('✅ 예약별 보기 완료:', data.length, '건, 총', count, '건')
      }
      
    } else {
      // ========== 일반 정렬 ==========
      console.log('📊 일반 정렬:', sortBy)
      
      query = supabase
        .from('reservations')
        .select(RESERVATION_COLUMNS, { count: 'exact' })
        .is('deleted_at', null)
      
      // ===== 필터 적용 =====
      
      // 결제 상태 필터
      if (statusList) {
        const statuses = statusList.split(',').map(mapPaymentStatus)
        if (statuses.includes('결제 전') || statuses.includes('결제 완료')) {
          query = query.in('status', statuses).neq('status', '취소')
          console.log('🔍 결제 상태 필터:', statuses)
        }
      }
      
      // 입장 상태 필터 (JOIN 방식)
      let useJoinForEntry = false
      if (entryStatusList) {
        const entryStatuses = entryStatusList.split(',')
        useJoinForEntry = true
        console.log('🔍 입장 상태 필터 (JOIN):', entryStatuses)
        
        // 기존 query를 JOIN 포함 query로 교체
        query = supabase
          .from('reservations')
          .select(`
            ${RESERVATION_COLUMNS},
            tickets!inner(entry_status)
          `, { count: 'exact' })
          .is('deleted_at', null)
        
        if (entryStatuses.length === 1) {
          query = query
            .eq('tickets.entry_status', entryStatuses[0])
            .neq('tickets.ticket_status', '취소')
        } else {
          query = query
            .in('tickets.entry_status', entryStatuses)
            .neq('tickets.ticket_status', '취소')
        }
        
        // 이전 상태 필터 재적용
        if (statusList) {
          const statuses = statusList.split(',').map(mapPaymentStatus)
          query = query.in('status', statuses)
        }
      }
      
      // 취소 상태 필터
      let cancelReservationIds = null
      if (additionalStatusList) {
        const additionalStatuses = additionalStatusList.split(',')
        console.log('🔍 추가 상태 필터 (취소 등):', additionalStatuses)
        
        const { data: cancelledTickets } = await supabase
          .from('tickets')
          .select('reservation_id')
          .in('ticket_status', additionalStatuses)
          .is('deleted_at', null)
          .limit(50000)
        
        if (cancelledTickets && cancelledTickets.length > 0) {
          cancelReservationIds = [...new Set(cancelledTickets.map(t => t.reservation_id))]
          console.log('🔍 취소 상태 필터 적용:', cancelReservationIds.length, '개 예약')
        }
      }
      
      // JOIN 방식을 사용하지 않는 경우에만 ID 필터 적용
      if (!useJoinForEntry && cancelReservationIds && cancelReservationIds.length > 0) {
        query = query.in('id', cancelReservationIds)
      }
      
      // 회원 구분
      if (memberType === 'member') {
        query = query.not('user_id', 'is', null)
        console.log('🔍 회원만 필터링')
      } else if (memberType === 'non-member') {
        query = query.is('user_id', null)
        console.log('🔍 비회원만 필터링')
      }
      
      // 이용월
      if (visitMonth) {
        const [year, month] = visitMonth.split('-')
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)
        
        query = query
          .gte('visit_date', startDate.toISOString())
          .lte('visit_date', endDate.toISOString())
        console.log('📅 이용월 필터:', visitMonth)
      }
      
      // 통합 검색
      if (searchKeyword && searchKeyword.trim()) {
        const keyword = searchKeyword.trim()
        const cleanPhone = keyword.replace(/[^0-9]/g, '')
        
        if (cleanPhone && cleanPhone.length >= 1) {
          query = query.or(`customer_name.ilike.%${keyword}%,phone.ilike.%${cleanPhone}%`)
          console.log('🔍 통합 검색 (이름+전화):', keyword, '/', cleanPhone)
        } else {
          query = query.ilike('customer_name', `%${keyword}%`)
          console.log('🔍 통합 검색 (이름):', keyword)
        }
      }
      
      // 예약번호 검색
      if (reservationId && reservationId.trim()) {
        query = query.ilike('id', `%${reservationId.trim()}%`)
        console.log('🔍 예약번호 검색:', reservationId.trim())
      }
      
      // 정렬 컬럼 매핑
      const sortColumn = {
        'createdAt': 'created_at',
        'visitDate': 'visit_date',
        'totalAmount': 'total_amount',
        'customerName': 'customer_name'
      }[sortBy] || 'created_at'
      
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' })
      console.log('📊 정렬:', sortColumn, sortOrder)
      
      // 페이지네이션
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)
      
      // 쿼리 실행
      console.log('🚀 Supabase 쿼리 실행...')
      const result = await query
      
      if (result.error) {
        console.error('❌ 쿼리 오류:', result.error)
        throw new Error(`Query failed: ${result.error.message}`)
      }
      
      data = result.data
      count = result.count
      
      console.log('✅ 일반 정렬 완료:', data?.length || 0, '건, 총', count, '건')
    }

    // ============================================
    // 데이터 변환
    // ============================================
    
    const transformedData = (data || []).map(reservation => ({
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
      checkinTime: reservation.checkin_time,
      userId: reservation.user_id
    }))

    // ============================================
    // 티켓 카운트 계산
    // ============================================
    
    // 전체 티켓 수
    const { count: allTicketsCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
    
    let totalTicketCount = allTicketsCount || 0
    let filteredTicketCount = 0
    
    // 현재 페이지 티켓 개수 (티켓별 보기 ON)
    if (showByTicket && transformedData.length > 0) {
      const reservationIds = transformedData.map(r => r.id)
      const { count: ticketCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('reservation_id', reservationIds)
        .is('deleted_at', null)
      
      filteredTicketCount = ticketCount || 0
      console.log('✅ 티켓 개수:', filteredTicketCount)
    }
    
    // 필터가 적용된 경우 전체 티켓 수 재계산
    const hasFilters = statusList || entryStatusList || additionalStatusList || 
                      memberType || visitMonth || searchKeyword || reservationId
    
    if (hasFilters && count > 0 && sortBy !== 'checkinTime') {
      // 입장 상태 필터만 있는 경우
      if (entryStatusList && !additionalStatusList) {
        const entryStatuses = entryStatusList.split(',')
        const { count: entryTicketCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .in('entry_status', entryStatuses)
          .neq('ticket_status', '취소')
          .is('deleted_at', null)
        
        totalTicketCount = entryTicketCount || 0
        console.log('✅ 입장 상태 필터 티켓 수:', totalTicketCount)
      } else {
        // 필터링된 전체 예약의 티켓 수 계산
        let freshQuery = supabase
          .from('reservations')
          .select('id')
          .is('deleted_at', null)
        
        // 모든 필터 조건 재적용
        if (statusList) {
          const statuses = statusList.split(',').map(mapPaymentStatus)
          if (statuses.includes('결제 전') || statuses.includes('결제 완료')) {
            freshQuery = freshQuery.in('status', statuses).neq('status', '취소')
          }
        }
        
        if (memberType === 'member') {
          freshQuery = freshQuery.not('user_id', 'is', null)
        } else if (memberType === 'non-member') {
          freshQuery = freshQuery.is('user_id', null)
        }
        
        if (visitMonth) {
          const [year, month] = visitMonth.split('-')
          const startDate = new Date(year, month - 1, 1)
          const endDate = new Date(year, month, 0, 23, 59, 59)
          freshQuery = freshQuery
            .gte('visit_date', startDate.toISOString())
            .lte('visit_date', endDate.toISOString())
        }
        
        if (searchKeyword && searchKeyword.trim()) {
          const keyword = searchKeyword.trim()
          const cleanPhone = keyword.replace(/[^0-9]/g, '')
          if (cleanPhone && cleanPhone.length >= 1) {
            freshQuery = freshQuery.or(`customer_name.ilike.%${keyword}%,phone.ilike.%${cleanPhone}%`)
          } else {
            freshQuery = freshQuery.ilike('customer_name', `%${keyword}%`)
          }
        }
        
        if (reservationId && reservationId.trim()) {
          freshQuery = freshQuery.ilike('id', `%${reservationId.trim()}%`)
        }
        
        // 필터별 예약 ID 수집
        let filterReservationIds = null
        
        if (entryStatusList) {
          const entryStatuses = entryStatusList.split(',')
          const { data: entryTickets } = await supabase
            .from('tickets')
            .select('reservation_id')
            .in('entry_status', entryStatuses)
            .neq('ticket_status', '취소')
            .is('deleted_at', null)
            .limit(50000)
          
          if (entryTickets && entryTickets.length > 0) {
            filterReservationIds = [...new Set(entryTickets.map(t => t.reservation_id))]
          }
        }
        
        if (additionalStatusList) {
          const additionalStatuses = additionalStatusList.split(',')
          const { data: cancelledTickets } = await supabase
            .from('tickets')
            .select('reservation_id')
            .in('ticket_status', additionalStatuses)
            .is('deleted_at', null)
            .limit(50000)
          
          if (cancelledTickets && cancelledTickets.length > 0) {
            const cancelIds = [...new Set(cancelledTickets.map(t => t.reservation_id))]
            
            if (filterReservationIds) {
              filterReservationIds = filterReservationIds.filter(id => cancelIds.includes(id))
            } else {
              filterReservationIds = cancelIds
            }
          }
        }
        
        if (filterReservationIds && filterReservationIds.length > 0) {
          freshQuery = freshQuery.in('id', filterReservationIds)
        }
        
        const { data: allFilteredReservations } = await freshQuery.limit(10000)
        
        if (allFilteredReservations && allFilteredReservations.length > 0) {
          const allReservationIds = allFilteredReservations.map(r => r.id)
          
          console.log('🔍 티켓 카운트 시작, additionalStatusList:', additionalStatusList)
          
          let ticketQuery = supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .in('reservation_id', allReservationIds)
            .is('deleted_at', null)
          
          if (additionalStatusList) {
            const additionalStatuses = additionalStatusList.split(',')
            console.log('🎯 취소 필터 적용, 상태:', additionalStatuses)
            ticketQuery = ticketQuery.in('ticket_status', additionalStatuses)
          }
          
          const { count: filteredTicketCount } = await ticketQuery
          
          console.log('📊 필터링된 티켓 수:', filteredTicketCount)
          
          totalTicketCount = filteredTicketCount || 0
        }
      }
    }

    console.log('✅ 예약 목록 조회 성공:', transformedData.length, '건, 총', count, '건')

    return Response.json({
      success: true,
      message: 'Reservations retrieved successfully',
      data: transformedData,
      total: count || 0,
      totalTickets: totalTicketCount,
      filteredTicketCount: showByTicket ? filteredTicketCount : null,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      itemsPerPage: limit
    })

  } catch (error) {
    console.error('❌ 예약 목록 조회 중 예외 발생:', error)
    
    return Response.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
}

// ============================================
// PUT - 예약 상태 변경
// ============================================
export async function PUT(request) {
  try {
    console.log('🔄 예약 상태 변경 요청...')
    
    const body = await request.json()
    const { reservationId, newStatus, newEntryStatus, visitDate } = body
    
    if (!reservationId) {
      return Response.json({
        success: false,
        message: 'Reservation ID is required'
      }, { status: 400 })
    }
    
    // 이용월 변경 처리
    if (visitDate) {
      console.log('📅 이용월 변경:', { reservationId, visitDate })
      
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ visit_date: visitDate })
        .eq('id', reservationId)
      
      if (updateError) {
        console.error('❌ 이용월 변경 오류:', updateError)
        return Response.json({
          success: false,
          message: '이용월 변경 실패'
        }, { status: 500 })
      }
      
      return Response.json({
        success: true,
        message: '이용월이 변경되었습니다.'
      })
    }

    console.log('🎯 예약 상태 변경:', { reservationId, newStatus, newEntryStatus })

    // 기존 예약 정보 확인
    const { data: existingReservation, error: checkError } = await supabase
      .from('reservations')
      .select('id, customer_name, status, entry_status')
      .eq('id', reservationId)
      .single()

    if (checkError || !existingReservation) {
      console.error('❌ 예약 조회 실패:', checkError)
      return Response.json({
        success: false,
        message: 'Reservation not found'
      }, { status: 404 })
    }

    // 업데이트할 데이터 준비
    const updateData = {}
    let successMessage = ''

    if (newStatus) {
      updateData.status = newStatus
      
      if (newStatus === '취소') {
        successMessage = '예약이 취소되었습니다.'
        console.log('📝 예약 취소')
      } else if (newStatus === '결제완료' || newStatus === '결제 완료') {
        if (existingReservation.status === '취소') {
          successMessage = '예약이 복구되었습니다.'
          console.log('📝 예약 복구')
        } else if (existingReservation.status === '결제 전') {
          successMessage = '입금이 확인되어 결제가 완료되었습니다.'
          console.log('📝 입금 확인 완료')
        } else {
          successMessage = '예약 상태가 결제완료로 변경되었습니다.'
          console.log('📝 결제 상태 변경')
        }
      } else if (newStatus === '결제 전') {
        if (existingReservation.status === '결제 완료' || existingReservation.status === '결제완료') {
          successMessage = '결제가 취소되었습니다.'
          console.log('📝 결제 취소')
        }
      }
    }

    if (newEntryStatus) {
      updateData.entry_status = newEntryStatus
      if (newEntryStatus === '입장완료') {
        updateData.checkin_time = new Date().toISOString()
        successMessage = '입장 처리가 완료되었습니다.'
        console.log('📝 입장 처리 시간:', updateData.checkin_time)
      } else if (newEntryStatus === '입장_전') {
        updateData.checkin_time = null
        successMessage = '입장이 취소되었습니다.'
        console.log('📝 입장 취소')
      }
    }

    // 같은 값 체크
    if (updateData.entry_status && updateData.entry_status === existingReservation.entry_status) {
      console.log('⚠️ 같은 입장 상태:', updateData.entry_status)
      return Response.json({
        success: true,
        message: '이미 같은 상태입니다.'
      })
    }

    if (updateData.status && updateData.status === existingReservation.status) {
      console.log('⚠️ 같은 예약 상태:', updateData.status)
      return Response.json({
        success: true,
        message: '이미 같은 상태입니다.'
      })
    }

    console.log('📊 업데이트 데이터:', updateData)

    // 예약 업데이트
    const { error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
    
    if (updateError) {
      console.error('❌ 예약 상태 변경 오류:', updateError)
      throw new Error(`업데이트 실패: ${updateError.message}`)
    }
    
    // 티켓 상태도 함께 변경
    if (newStatus) {
      console.log('🎫 티켓 상태도 함께 변경:', newStatus)
      
      const ticketUpdateData = {
        status: newStatus,
        ticket_status: newStatus
      }
      
      if (newStatus === '취소') {
        ticketUpdateData.cancelled_at = new Date().toISOString()
      } else if (newStatus === '결제완료' || newStatus === '결제 완료') {
        ticketUpdateData.cancelled_at = null
      }
      
      const { error: ticketError } = await supabase
        .from('tickets')
        .update(ticketUpdateData)
        .eq('reservation_id', reservationId)
      
      if (ticketError) {
        console.error('❌ 티켓 상태 변경 오류:', ticketError)
      } else {
        console.log('✅ 티켓 상태 변경 성공')
      }
    }

    console.log('✅ 예약 상태 변경 성공')

    return Response.json({
      success: true,
      message: successMessage,
      data: {
        reservationId: reservationId,
        customerName: existingReservation.customer_name
      }
    })

  } catch (error) {
    console.error('❌ 예약 상태 변경 중 오류:', error)
    
    return Response.json({
      success: false,
      message: 'Failed to update reservation status',
      error: error.message
    }, { status: 500 })
  }
}

// ============================================
// DELETE - 예약 삭제
// ============================================
export async function DELETE(request) {
  try {
    console.log('🗑️ 예약 삭제 요청...')
    
    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('id')

    if (!reservationId) {
      return Response.json({
        success: false,
        message: 'Reservation ID is required'
      }, { status: 400 })
    }

    console.log('🎯 삭제할 예약번호:', reservationId)

    // 예약 존재 확인
    const { data: existingReservation, error: checkError } = await supabase
      .from('reservations')
      .select('id, customer_name, status')
      .eq('id', reservationId)
      .single()

    if (checkError || !existingReservation) {
      return Response.json({
        success: false,
        message: 'Reservation not found'
      }, { status: 404 })
    }

    // 입장완료된 예약은 삭제 불가
    if (existingReservation.status === '입장완료') {
      return Response.json({
        success: false,
        message: 'Cannot delete completed reservations'
      }, { status: 400 })
    }

    console.log('✅ 삭제 가능한 예약:', existingReservation.customer_name)

    // 예약 삭제 실행
    const { error: deleteError } = await supabase
      .from('reservations')
      .update({ 
        deleted_at: new Date().toISOString()
      })
      .eq('id', reservationId)

    if (deleteError) {
      console.error('❌ 예약 삭제 오류:', deleteError)
      throw new Error(`삭제 실패: ${deleteError.message}`)
    }

    console.log('✅ 예약 삭제 성공')

    return Response.json({
      success: true,
      message: '예약이 삭제 처리되었습니다.',
      data: {
        reservationId: reservationId,
        customerName: existingReservation.customer_name
      }
    })

  } catch (error) {
    console.error('❌ 예약 삭제 중 오류:', error)
    
    return Response.json({
      success: false,
      message: 'Failed to delete reservation',
      error: error.message
    }, { status: 500 })
  }
}