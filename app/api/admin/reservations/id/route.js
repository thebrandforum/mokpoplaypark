// app/api/admin/reservations/id/route.js
// 관리자 예약 상세 조회/삭제 API - Supabase PostgreSQL 버전

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 특정 예약 상세 조회 (고객 정보 포함)
export async function GET(request) {
  try {
    console.log('📋 예약 상세 조회 요청...')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({
        success: false,
        message: 'Reservation ID is required'
      }, { status: 400 })
    }

    console.log('🎯 조회할 예약번호:', id)

    // 1. 예약 상세 정보 조회
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (reservationError || !reservation) {
      console.error('❌ 예약 조회 실패:', reservationError)
      return Response.json({
        success: false,
        message: 'Reservation not found'
      }, { status: 404 })
    }

    console.log('✅ 예약 정보 확인:', reservation.customer_name)

    // 2. 해당 고객의 다른 예약들 조회 (예약 이력)
    const { data: customerHistory, error: historyError } = await supabase
      .from('reservations')
      .select('id, visit_date, adult_count, child_count, total_amount, status, created_at')
      .eq('phone', reservation.phone)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('⚠️ 고객 이력 조회 실패:', historyError)
    }

    console.log(`📊 고객 이력: ${customerHistory?.length || 0}개`)

    // 3. 고객 통계 정보 계산
    const { data: customerStats, error: statsError } = await supabase
      .from('reservations')
      .select('total_amount, adult_count, child_count, created_at')
      .eq('phone', reservation.phone)
      .in('status', ['결제완료', '입장완료'])

    let customerStatsCalculated = {
      totalReservations: 0,
      totalSpent: 0,
      totalGuests: 0,
      firstVisit: null,
      lastVisit: null
    }

    if (!statsError && customerStats && customerStats.length > 0) {
      customerStatsCalculated = {
        totalReservations: customerStats.length,
        totalSpent: customerStats.reduce((sum, res) => sum + (res.total_amount || 0), 0),
        totalGuests: customerStats.reduce((sum, res) => sum + (res.adult_count || 0) + (res.child_count || 0), 0),
        firstVisit: customerStats.reduce((earliest, res) => 
          !earliest || res.created_at < earliest ? res.created_at : earliest, null),
        lastVisit: customerStats.reduce((latest, res) => 
          !latest || res.created_at > latest ? res.created_at : latest, null)
      }
    }

    console.log('📊 고객 통계 계산 완료')

    // 4. 응답 데이터 구성
    const responseData = {
      reservation: {
        id: reservation.id,
        customerName: reservation.customer_name,
        phone: reservation.phone,
        email: reservation.email,
        visitDate: reservation.visit_date,
        adultCount: reservation.adult_count,
        childCount: reservation.child_count,
        totalAmount: reservation.total_amount,
        status: reservation.status,
        qrCode: reservation.qr_code,
        paymentTime: reservation.payment_time,
        checkinTime: reservation.checkin_time,
        createdAt: reservation.created_at,
        totalPeople: reservation.adult_count + reservation.child_count
      },
      customerHistory: customerHistory || [],
      customerStats: customerStatsCalculated
    }

    return Response.json({
      success: true,
      message: 'Reservation details retrieved successfully',
      data: responseData
    })

  } catch (error) {
    console.error('❌ 예약 상세 조회 중 오류:', error)
    
    if (error.message && error.message.includes('fetch failed')) {
      return Response.json({
        success: false,
        message: 'Network connection failed',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }

    return Response.json({
      success: false,
      message: 'Failed to retrieve reservation details',
      error: error.message
    }, { status: 500 })
  }
}

// DELETE - 예약 삭제 (관리자용)
export async function DELETE(request) {
  try {
    console.log('🗑️ 예약 삭제 요청...')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({
        success: false,
        message: 'Reservation ID is required'
      }, { status: 400 })
    }

    console.log('🎯 삭제할 예약번호:', id)

    // 1. 예약 존재 및 상태 확인
    const { data: existingReservation, error: checkError } = await supabase
      .from('reservations')
      .select('id, customer_name, status')
      .eq('id', id)
      .single()

    if (checkError || !existingReservation) {
      console.error('❌ 예약 조회 실패:', checkError)
      return Response.json({
        success: false,
        message: 'Reservation not found'
      }, { status: 404 })
    }

    // 2. 입장완료된 예약은 삭제 불가
    if (existingReservation.status === '입장완료') {
      return Response.json({
        success: false,
        message: 'Cannot delete completed reservations'
      }, { status: 400 })
    }

    console.log('✅ 삭제 가능한 예약:', existingReservation.customer_name)

    // 3. 예약 삭제 실행
    // 실제 삭제 대신 상태를 '삭제됨'으로 변경하는 것이 더 안전하지만,
    // 요구사항에 따라 실제 삭제 수행
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ 예약 삭제 오류:', deleteError)
      throw new Error(`삭제 실패: ${deleteError.message}`)
    }

    console.log('✅ 예약 삭제 완료')

    return Response.json({
      success: true,
      message: 'Reservation deleted successfully',
      data: {
        deletedId: id,
        customerName: existingReservation.customer_name
      }
    })

  } catch (error) {
    console.error('❌ 예약 삭제 중 오류:', error)
    
    if (error.message && error.message.includes('fetch failed')) {
      return Response.json({
        success: false,
        message: 'Network connection failed',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }

    return Response.json({
      success: false,
      message: 'Failed to delete reservation',
      error: error.message
    }, { status: 500 })
  }
}

// PUT - 예약 수정 (옵션)
export async function PUT(request) {
  try {
    console.log('✏️ 예약 수정 요청...')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({
        success: false,
        message: 'Reservation ID is required'
      }, { status: 400 })
    }

    const body = await request.json()
    const { 
      customerName, 
      phone, 
      email, 
      visitDate, 
      adultCount, 
      childCount, 
      status 
    } = body

    console.log('📝 수정할 데이터:', body)

    // 예약 존재 확인
    const { data: existingReservation, error: checkError } = await supabase
      .from('reservations')
      .select('id, customer_name')
      .eq('id', id)
      .single()

    if (checkError || !existingReservation) {
      return Response.json({
        success: false,
        message: 'Reservation not found'
      }, { status: 404 })
    }

    // 업데이트 데이터 준비
    const updateData = {}
    
    if (customerName) updateData.customer_name = customerName
    if (phone) updateData.phone = phone
    if (email) updateData.email = email
    if (visitDate) updateData.visit_date = visitDate
    if (adultCount !== undefined) updateData.adult_count = adultCount
    if (childCount !== undefined) updateData.child_count = childCount
    if (status) updateData.status = status
    
    // 금액 재계산 (인원수가 변경된 경우)
    if (adultCount !== undefined || childCount !== undefined) {
      const finalAdultCount = adultCount !== undefined ? adultCount : existingReservation.adult_count
      const finalChildCount = childCount !== undefined ? childCount : existingReservation.child_count
      
      // 기본 가격 (실제로는 설정에서 가져와야 함)
      const adultPrice = 25000
      const childPrice = 20000
      
      updateData.total_amount = (finalAdultCount * adultPrice) + (finalChildCount * childPrice)
    }

    updateData.updated_at = new Date().toISOString()

    console.log('📊 최종 업데이트 데이터:', updateData)

    // 업데이트 실행
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ 예약 수정 오류:', updateError)
      throw new Error(`수정 실패: ${updateError.message}`)
    }

    console.log('✅ 예약 수정 완료')

    return Response.json({
      success: true,
      message: 'Reservation updated successfully',
      data: {
        id: updatedReservation.id,
        customerName: updatedReservation.customer_name,
        updatedAt: updatedReservation.updated_at
      }
    })

  } catch (error) {
    console.error('❌ 예약 수정 중 오류:', error)
    
    if (error.message && error.message.includes('fetch failed')) {
      return Response.json({
        success: false,
        message: 'Network connection failed',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }

    return Response.json({
      success: false,
      message: 'Failed to update reservation',
      error: error.message
    }, { status: 500 })
  }
}