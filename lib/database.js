// lib/database.js
// Supabase PostgreSQL 연결 - MySQL 완전 대체

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

console.log('🔗 Supabase 데이터베이스 모듈 초기화...')

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// MySQL executeQuery() 함수와 호환되는 Supabase 함수
// ============================================

/**
 * MySQL의 executeQuery를 대체하는 Supabase 함수
 * 기존 MySQL 코드 호환성을 위해 유사한 인터페이스 제공
 * 
 * @param {string} query - SQL 쿼리 (Supabase용으로 변환됨)
 * @param {array} params - 쿼리 파라미터
 * @returns {Promise<array>} - 결과 배열
 */
export async function executeQuery(query, params = []) {
  try {
    console.log('🔍 executeQuery 호출:', { query: query.substring(0, 50) + '...', paramsCount: params.length })

    // ============================================
    // SELECT 쿼리 처리
    // ============================================
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      return await handleSelectQuery(query, params)
    }

    // ============================================
    // INSERT 쿼리 처리
    // ============================================
    if (query.trim().toUpperCase().startsWith('INSERT')) {
      return await handleInsertQuery(query, params)
    }

    // ============================================
    // UPDATE 쿼리 처리
    // ============================================
    if (query.trim().toUpperCase().startsWith('UPDATE')) {
      return await handleUpdateQuery(query, params)
    }

    // ============================================
    // DELETE 쿼리 처리
    // ============================================
    if (query.trim().toUpperCase().startsWith('DELETE')) {
      return await handleDeleteQuery(query, params)
    }

    // 기타 쿼리는 오류
    throw new Error(`지원하지 않는 쿼리 유형: ${query.substring(0, 20)}`)

  } catch (error) {
    console.error('❌ executeQuery 오류:', error)
    throw error
  }
}

// ============================================
// SELECT 쿼리 처리 함수
// ============================================
async function handleSelectQuery(query, params) {
  console.log('📊 SELECT 쿼리 처리:', query)

  // 테이블명 추출
  const tableMatch = query.match(/FROM\s+(\w+)/i)
  if (!tableMatch) {
    throw new Error('테이블명을 찾을 수 없습니다.')
  }
  
  const tableName = tableMatch[1]
  console.log('📋 테이블:', tableName)

  // 기본 쿼리 빌더
  let supabaseQuery = supabase.from(tableName)

  // SELECT 컬럼 처리
  if (query.includes('SELECT *')) {
    supabaseQuery = supabaseQuery.select('*')
  } else {
    // 특정 컬럼 선택 (간단한 경우만)
    supabaseQuery = supabaseQuery.select('*')
  }

  // WHERE 조건 처리
  if (query.includes('WHERE')) {
    supabaseQuery = await applyWhereConditions(supabaseQuery, query, params)
  }

  // ORDER BY 처리
  if (query.includes('ORDER BY')) {
    const orderMatch = query.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i)
    if (orderMatch) {
      const column = orderMatch[1]
      const direction = orderMatch[2]?.toLowerCase() === 'desc' ? false : true
      supabaseQuery = supabaseQuery.order(column, { ascending: direction })
    }
  }

  // LIMIT 처리
  if (query.includes('LIMIT')) {
    const limitMatch = query.match(/LIMIT\s+(\d+)/i)
    if (limitMatch) {
      supabaseQuery = supabaseQuery.limit(parseInt(limitMatch[1]))
    }
  }

  // 쿼리 실행
  const { data, error } = await supabaseQuery

  if (error) {
    console.error('❌ SELECT 쿼리 오류:', error)
    throw new Error(`SELECT 실패: ${error.message}`)
  }

  console.log(`✅ SELECT 성공: ${data.length}개 결과`)
  return data || []
}

// ============================================
// INSERT 쿼리 처리 함수
// ============================================
async function handleInsertQuery(query, params) {
  console.log('➕ INSERT 쿼리 처리:', query)

  // 테이블명 추출
  const tableMatch = query.match(/INSERT INTO\s+(\w+)/i)
  if (!tableMatch) {
    throw new Error('INSERT 테이블명을 찾을 수 없습니다.')
  }

  const tableName = tableMatch[1]
  console.log('📋 INSERT 테이블:', tableName)

  // 컬럼명 추출
  const columnsMatch = query.match(/\(([^)]+)\)\s+VALUES/i)
  if (!columnsMatch) {
    throw new Error('INSERT 컬럼명을 찾을 수 없습니다.')
  }

  const columns = columnsMatch[1].split(',').map(col => col.trim())
  console.log('📝 INSERT 컬럼들:', columns)

  // 데이터 객체 생성
  const insertData = {}
  columns.forEach((column, index) => {
    if (params[index] !== undefined) {
      insertData[column] = params[index]
    }
  })

  console.log('💾 INSERT 데이터:', insertData)

  // Supabase INSERT 실행
  const { data, error } = await supabase
    .from(tableName)
    .insert([insertData])
    .select()

  if (error) {
    console.error('❌ INSERT 쿼리 오류:', error)
    throw new Error(`INSERT 실패: ${error.message}`)
  }

  console.log('✅ INSERT 성공:', data)
  return data || []
}

// ============================================
// UPDATE 쿼리 처리 함수
// ============================================
async function handleUpdateQuery(query, params) {
  console.log('✏️ UPDATE 쿼리 처리:', query)

  // 테이블명 추출
  const tableMatch = query.match(/UPDATE\s+(\w+)/i)
  if (!tableMatch) {
    throw new Error('UPDATE 테이블명을 찾을 수 없습니다.')
  }

  const tableName = tableMatch[1]
  console.log('📋 UPDATE 테이블:', tableName)

  // SET 절 처리 (간단한 경우)
  const setMatch = query.match(/SET\s+(\w+)\s*=\s*\?/i)
  if (!setMatch) {
    throw new Error('UPDATE SET 절을 찾을 수 없습니다.')
  }

  const column = setMatch[1]
  const value = params[0]

  // WHERE 절 처리 (간단한 경우)
  const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i)
  if (!whereMatch) {
    throw new Error('UPDATE WHERE 절을 찾을 수 없습니다.')
  }

  const whereColumn = whereMatch[1]
  const whereValue = params[1]

  console.log('✏️ UPDATE 조건:', { column, value, whereColumn, whereValue })

  // Supabase UPDATE 실행
  const { data, error } = await supabase
    .from(tableName)
    .update({ [column]: value })
    .eq(whereColumn, whereValue)
    .select()

  if (error) {
    console.error('❌ UPDATE 쿼리 오류:', error)
    throw new Error(`UPDATE 실패: ${error.message}`)
  }

  console.log('✅ UPDATE 성공:', data)
  return data || []
}

// ============================================
// DELETE 쿼리 처리 함수
// ============================================
async function handleDeleteQuery(query, params) {
  console.log('🗑️ DELETE 쿼리 처리:', query)

  // 테이블명 추출
  const tableMatch = query.match(/DELETE FROM\s+(\w+)/i)
  if (!tableMatch) {
    throw new Error('DELETE 테이블명을 찾을 수 없습니다.')
  }

  const tableName = tableMatch[1]

  // WHERE 절 처리
  const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i)
  if (!whereMatch) {
    throw new Error('DELETE WHERE 절을 찾을 수 없습니다.')
  }

  const whereColumn = whereMatch[1]
  const whereValue = params[0]

  console.log('🗑️ DELETE 조건:', { tableName, whereColumn, whereValue })

  // Supabase DELETE 실행
  const { data, error } = await supabase
    .from(tableName)
    .delete()
    .eq(whereColumn, whereValue)
    .select()

  if (error) {
    console.error('❌ DELETE 쿼리 오류:', error)
    throw new Error(`DELETE 실패: ${error.message}`)
  }

  console.log('✅ DELETE 성공:', data)
  return data || []
}

// ============================================
// WHERE 조건 적용 함수
// ============================================
async function applyWhereConditions(supabaseQuery, query, params) {
  console.log('🔍 WHERE 조건 처리 중...')

  // 간단한 WHERE 절 처리 (id = ? 형태)
  const simpleWhereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i)
  if (simpleWhereMatch && params.length > 0) {
    const column = simpleWhereMatch[1]
    const value = params[0]
    console.log('🎯 간단한 WHERE:', { column, value })
    return supabaseQuery.eq(column, value)
  }

  // 복잡한 WHERE 절은 나중에 추가...
  console.log('⚠️ 복잡한 WHERE 절은 아직 지원하지 않습니다.')
  return supabaseQuery
}

// ============================================
// 연결 테스트 함수 (MySQL 호환성)
// ============================================
export async function testConnection() {
  try {
    console.log('🔄 Supabase 연결 테스트...')
    
    const { data, error } = await supabase
      .from('reservations')
      .select('count(*)')
      .limit(1)

    if (error) {
      console.error('❌ Supabase 연결 실패:', error)
      return false
    }

    console.log('✅ Supabase 연결 성공!')
    return true

  } catch (error) {
    console.error('❌ Supabase 연결 테스트 실패:', error)
    return false
  }
}

// ============================================
// 직접 Supabase 클라이언트 접근 (고급 사용자용)
// ============================================
export { supabase }

// ============================================
// 유틸리티 함수들
// ============================================

// 예약 테이블 전용 함수들
export const reservationsQueries = {
  // 모든 예약 조회
  getAll: async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // ID로 예약 조회
  getById: async (id) => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 전화번호로 예약 조회
  getByPhone: async (phone) => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 새 예약 생성
  create: async (reservationData) => {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 예약 상태 업데이트
  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  }
}

// 설정 테이블 전용 함수들
export const settingsQueries = {
  // 모든 설정 조회
  getAll: async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
    
    if (error) throw error
    return data
  },

  // 특정 설정 조회
  getByKey: async (key) => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', key)
      .single()
    
    if (error) throw error
    return data
  },

  // 설정 저장/업데이트
  upsert: async (key, value) => {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (error) throw error
    return data[0]
  }
}

console.log('✅ Supabase 데이터베이스 모듈 로드 완료!')