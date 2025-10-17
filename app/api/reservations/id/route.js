export const dynamic = 'force-dynamic'


import { executeQuery } from '../../../../lib/database.js'
import { NextResponse } from 'next/server'

// GET - 예약 ID로 예약 정보 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('reservationId')
    
    console.log('=== 예약 정보 조회 시작 ===')
    console.log('예약 ID:', reservationId)
    
    // 입력 검증
    if (!reservationId) {
      return NextResponse.json(
        { success: false, message: '예약번호가 필요합니다.' },
        { status: 400 }
      )
    }
    
    // 예약 정보 조회
    const reservationQuery = `
      SELECT 
        id,
        customer_name,
        phone,
        email,
        visit_date,
        adult_count,
        child_count,
        total_amount,
        status,
        qr_code,
        payment_time,
        created_at
      FROM reservations 
      WHERE id = ?
    `
    
    const reservations = await executeQuery(reservationQuery, [reservationId])
    
    if (reservations.length === 0) {
      console.log('❌ 예약 정보 없음:', reservationId)
      return NextResponse.json(
        { success: false, message: '예약 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    const reservation = reservations[0]
    
    console.log('✅ 예약 정보 조회 성공:', {
      id: reservation.id,
      customer_name: reservation.customer_name,
      total_amount: reservation.total_amount,
      status: reservation.status
    })
    
    // 날짜 포맷팅
    const visitDate = new Date(reservation.visit_date)
    const formattedVisitDate = visitDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    })
    
    return NextResponse.json({
      success: true,
      message: '예약 정보 조회 성공',
      data: {
        id: reservation.id,
        customerName: reservation.customer_name,
        phone: reservation.phone,
        email: reservation.email,
        visitDate: formattedVisitDate,
        adultCount: reservation.adult_count,
        childCount: reservation.child_count,
        totalAmount: reservation.total_amount,
        status: reservation.status,
        qrCode: reservation.qr_code,
        paymentTime: reservation.payment_time,
        createdAt: reservation.created_at
      }
    })
    
  } catch (error) {
    console.error('❌ 예약 조회 오류:', error)
    return NextResponse.json(
      { success: false, message: '예약 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}