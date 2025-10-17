// app/api/test-supabase/route.js
// Supabase PostgreSQL 연결 테스트 API

import { createClient } from '@supabase/supabase-js'

// Supabase 설정 (기존 프로젝트 정보)
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

// Supabase 클라이언트 초기화
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  const startTime = Date.now()
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: 'Goorm IDE',
    tests: []
  }

  try {
    console.log('🚀 Supabase 연결 테스트 시작...')
    
    // ============================================
    // 테스트 1: 기본 연결 확인
    // ============================================
    console.log('📡 테스트 1: 기본 연결 확인')
    const connectionTest = {
      name: '기본 연결',
      status: 'pending',
      message: '',
      duration: 0
    }
    
    try {
      const testStart = Date.now()
      
      // 간단한 쿼리로 연결 테스트
      const { data, error, count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .limit(1)
      
      connectionTest.duration = Date.now() - testStart
      
      if (error) {
        connectionTest.status = 'failed'
        connectionTest.message = `연결 실패: ${error.message}`
        connectionTest.errorCode = error.code
      } else {
        connectionTest.status = 'success'
        connectionTest.message = `연결 성공! 총 ${count}개 예약 데이터 확인`
        connectionTest.sampleData = data?.[0] || null
      }
    } catch (err) {
      connectionTest.status = 'error'
      connectionTest.message = `예외 발생: ${err.message}`
    }
    
    testResults.tests.push(connectionTest)
    console.log(`✅ 테스트 1 결과:`, connectionTest.status)

    // ============================================
    // 테스트 2: 데이터 삽입 테스트
    // ============================================
    console.log('📝 테스트 2: 데이터 삽입 테스트')
    const insertTest = {
      name: '데이터 삽입',
      status: 'pending',
      message: '',
      duration: 0
    }
    
    try {
      const testStart = Date.now()
      
      const testReservation = {
        id: `TEST_${Date.now()}`,
        customer_name: '테스트고객',
        phone: '010-0000-0000',
        email: 'test@test.com',
        visit_date: '2025-06-15',
        adult_count: 1,
        child_count: 0,
        total_amount: 15000,
        status: '결제완료',
        qr_code: `TEST_QR_${Date.now()}`,
        payment_time: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('reservations')
        .insert([testReservation])
        .select()
      
      insertTest.duration = Date.now() - testStart
      
      if (error) {
        insertTest.status = 'failed'
        insertTest.message = `삽입 실패: ${error.message}`
        insertTest.errorCode = error.code
      } else {
        insertTest.status = 'success'
        insertTest.message = '테스트 데이터 삽입 성공'
        insertTest.insertedData = data?.[0]
      }
    } catch (err) {
      insertTest.status = 'error'
      insertTest.message = `예외 발생: ${err.message}`
    }
    
    testResults.tests.push(insertTest)
    console.log(`✅ 테스트 2 결과:`, insertTest.status)

    // ============================================
    // 테스트 3: 데이터 조회 테스트
    // ============================================
    console.log('🔍 테스트 3: 데이터 조회 테스트')
    const selectTest = {
      name: '데이터 조회',
      status: 'pending',
      message: '',
      duration: 0
    }
    
    try {
      const testStart = Date.now()
      
      const { data, error, count } = await supabase
        .from('reservations')
        .select('id, customer_name, phone, visit_date, total_amount', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5)
      
      selectTest.duration = Date.now() - testStart
      
      if (error) {
        selectTest.status = 'failed'
        selectTest.message = `조회 실패: ${error.message}`
        selectTest.errorCode = error.code
      } else {
        selectTest.status = 'success'
        selectTest.message = `총 ${count}개 데이터 중 최근 ${data?.length}개 조회 성공`
        selectTest.recentData = data
      }
    } catch (err) {
      selectTest.status = 'error'
      selectTest.message = `예외 발생: ${err.message}`
    }
    
    testResults.tests.push(selectTest)
    console.log(`✅ 테스트 3 결과:`, selectTest.status)

    // ============================================
    // 테스트 4: 네트워크 속도 테스트
    // ============================================
    console.log('⚡ 테스트 4: 네트워크 속도 테스트')
    const speedTest = {
      name: '네트워크 속도',
      status: 'pending',
      message: '',
      duration: 0
    }
    
    try {
      const testStart = Date.now()
      
      // 10번 연속 간단한 쿼리로 속도 측정
      const speedTests = []
      for (let i = 0; i < 3; i++) {
        const queryStart = Date.now()
        const { error } = await supabase
          .from('reservations')
          .select('count(*)')
          .limit(1)
        
        const queryTime = Date.now() - queryStart
        speedTests.push(queryTime)
        
        if (error) throw error
      }
      
      speedTest.duration = Date.now() - testStart
      const avgSpeed = speedTests.reduce((a, b) => a + b, 0) / speedTests.length
      
      speedTest.status = 'success'
      speedTest.message = `평균 응답시간: ${avgSpeed.toFixed(0)}ms`
      speedTest.individualTests = speedTests
      speedTest.averageSpeed = avgSpeed
      
    } catch (err) {
      speedTest.status = 'error'
      speedTest.message = `속도 테스트 실패: ${err.message}`
    }
    
    testResults.tests.push(speedTest)
    console.log(`✅ 테스트 4 결과:`, speedTest.status)

    // ============================================
    // 최종 결과 정리
    // ============================================
    const totalDuration = Date.now() - startTime
    const successCount = testResults.tests.filter(t => t.status === 'success').length
    const totalCount = testResults.tests.length
    
    testResults.summary = {
      totalDuration,
      successRate: `${successCount}/${totalCount}`,
      successPercentage: Math.round((successCount / totalCount) * 100),
      overallStatus: successCount === totalCount ? 'success' : 'partial'
    }

    console.log('🎉 모든 테스트 완료!')
    console.log(`📊 성공률: ${testResults.summary.successRate} (${testResults.summary.successPercentage}%)`)
    console.log(`⏱️ 총 소요시간: ${totalDuration}ms`)

    return Response.json({
      success: true,
      message: 'Supabase 연결 테스트 완료',
      data: testResults
    })

  } catch (error) {
    console.error('❌ 치명적 오류:', error)
    
    return Response.json({
      success: false,
      message: 'Supabase 연결 테스트 실패',
      error: error.message,
      data: testResults
    }, { status: 500 })
  }
}