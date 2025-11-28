const mysql = require('mysql2/promise')

// MySQL 연결 설정
const dbConfig = {
  host: 'localhost',
  user: 'root',              // root 사용자로 변경
  password: 'password123',   // 우리가 설정한 비밀번호
  database: 'adventure_park',
  charset: 'utf8mb4'
}

// 연결 풀 생성
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// 데이터베이스 연결 테스트 함수
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('MySQL 연결 성공!')
    connection.release()
    return true
  } catch (error) {
    console.error('MySQL 연결 실패:', error)
    return false
  }
}

// 쿼리 실행 함수
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params)
    return results
  } catch (error) {
    console.error('쿼리 실행 오류:', error)
    throw error
  }
}

module.exports = {
  testConnection,
  executeQuery,
  pool
}