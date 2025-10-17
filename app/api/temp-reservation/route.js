// app/api/temp-reservation/route.js
import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// POST - 임시 예약 생성 (카드 결제용)
export async function POST(request) {
  try {
    console.log('=== 임시 예약 생성 API 시작 ===')
    
    const body = await request.json()
    console.log('받은 데이터:', body)
    
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
      user_id
    } = body

    // 1. 필수 데이터 검증
    if (!customer_name || !phone || !email || !visit_date) {
      return Response.json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      }, { status: 400 })
    }

    // 2. 임시 예약번호 생성 (TEMP + 날짜 + 시간)
    const now = new Date()
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '') // HHMM
    const randomNum = Math.floor(Math.random() * 900) + 100 // 100-999
    const tempReservationId = `TEMP${dateStr}${timeStr}${randomNum}`

    console.log('생성된 임시 예약번호:', tempReservationId)

    // 3. 만료 시간 설정 (30분 후)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    // 4. 임시 예약 데이터 준비
    const tempReservationData = {
      id: tempReservationId,
      customer_name: customer_name,
      phone: phone.replace(/[^\d]/g, ''), // 숫자만 저장
      email: email,
      visit_date: visit_date,
      adult_count: adult_count || 0,
      child_count: child_count || 0,
      guardian_count: guardian_count || 0,
      total_amount: total_amount,
      cart_items: cart_items || null,
      user_id: user_id || null,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString()
    }
    
    console.log('💾 임시 예약 저장 데이터:', tempReservationData)

    // 5. temp_reservations 테이블에 저장
    const { data, error } = await supabase
      .from('temp_reservations')
      .insert([tempReservationData])
      .select()

    if (error) {
      console.error('Supabase 저장 오류:', error)
      return Response.json({
        success: false,
        message: `임시 예약 저장 실패: ${error.message}`,
        errorCode: error.code,
        errorDetails: error
      }, { status: 500 })
    }

    console.log('✅ 임시 예약 저장 성공:', data)

    // 6. 성공 응답
    return Response.json({
      success: true,
      message: '임시 예약이 생성되었습니다.',
      data: {
        tempReservationId: tempReservationId,
        expiresAt: expiresAt.toISOString(),
        totalAmount: total_amount
      }
    })

  } catch (error) {
    console.error('=== 임시 예약 생성 오류 ===', error)
    
    return Response.json({
      success: false,
      message: '임시 예약 생성 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// GET - 임시 예약 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tempReservationId = searchParams.get('id')

    if (!tempReservationId) {
      return Response.json({
        success: false,
        message: '임시 예약 ID가 필요합니다.'
      }, { status: 400 })
    }

    console.log('🔍 임시 예약 조회:', tempReservationId)

    // 임시 예약 조회
    const { data, error } = await supabase
      .from('temp_reservations')
      .select('*')
      .eq('id', tempReservationId)
      .single()

    if (error || !data) {
      console.error('조회 오류:', error)
      return Response.json({
        success: false,
        message: '임시 예약을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 만료 시간 확인
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    
    if (now > expiresAt) {
      // 만료된 임시 예약 삭제
      await supabase
        .from('temp_reservations')
        .delete()
        .eq('id', tempReservationId)

      return Response.json({
        success: false,
        message: '임시 예약이 만료되었습니다.'
      }, { status: 410 }) // 410 Gone
    }

    // 성공 응답
    return Response.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('임시 예약 조회 오류:', error)
    
    return Response.json({
      success: false,
      message: '임시 예약 조회 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// DELETE - 임시 예약 삭제 (결제 성공 후 또는 취소 시)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tempReservationId = searchParams.get('id')

    if (!tempReservationId) {
      return Response.json({
        success: false,
        message: '임시 예약 ID가 필요합니다.'
      }, { status: 400 })
    }

    console.log('🗑️ 임시 예약 삭제:', tempReservationId)

    const { error } = await supabase
      .from('temp_reservations')
      .delete()
      .eq('id', tempReservationId)

    if (error) {
      console.error('삭제 오류:', error)
      return Response.json({
        success: false,
        message: '임시 예약 삭제 실패'
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: '임시 예약이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('임시 예약 삭제 오류:', error)
    
    return Response.json({
      success: false,
      message: '임시 예약 삭제 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}