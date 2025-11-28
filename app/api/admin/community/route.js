// app/api/admin/community/route.js
// 커뮤니티 관리 API - Supabase PostgreSQL 기반

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// 테이블 초기화 함수 (처음 한 번만 실행)
async function initializeCommunityTables() {
  try {
    console.log('📋 커뮤니티 테이블 초기화 중...')

    // 공지사항 테이블 생성 SQL
    const createNoticesTable = `
      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT DEFAULT '관리자',
        important BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // FAQ 테이블 생성 SQL
    const createFaqsTable = `
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // 이벤트 테이블 생성 SQL
    const createEventsTable = `
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT CHECK (status IN ('ongoing', 'upcoming', 'ended')) DEFAULT 'upcoming',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // 테이블 생성 실행
    await supabase.rpc('exec_sql', { sql: createNoticesTable })
    await supabase.rpc('exec_sql', { sql: createFaqsTable })
    await supabase.rpc('exec_sql', { sql: createEventsTable })

    console.log('✅ 커뮤니티 테이블 초기화 완료')
    return true

  } catch (error) {
    console.error('❌ 테이블 초기화 실패:', error)
    return false
  }
}

// GET - 모든 커뮤니티 데이터 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // notices, faqs, events

    console.log(`📥 커뮤니티 데이터 조회 요청: ${type || 'all'}`)

    let result = {}

    if (!type || type === 'notices') {
      const { data: notices, error: noticesError } = await supabase
        .from('notices')
        .select('*')
        .order('important', { ascending: false })  // 중요 공지 먼저
        .order('created_at', { ascending: false }) // 최신순

      if (noticesError && noticesError.code !== 'PGRST116') {
        throw new Error(`공지사항 조회 실패: ${noticesError.message}`)
      }

      result.notices = notices || []
    }

    if (!type || type === 'faqs') {
      const { data: faqs, error: faqsError } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false })

      if (faqsError && faqsError.code !== 'PGRST116') {
        throw new Error(`FAQ 조회 실패: ${faqsError.message}`)
      }

      result.faqs = faqs || []
    }

    if (!type || type === 'events') {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false })

      if (eventsError && eventsError.code !== 'PGRST116') {
        throw new Error(`이벤트 조회 실패: ${eventsError.message}`)
      }

      result.events = events || []
    }

    console.log(`✅ 커뮤니티 데이터 조회 성공`)
    return Response.json({
      success: true,
      message: '커뮤니티 데이터 조회 성공',
      data: result
    })

  } catch (error) {
    console.error('❌ 커뮤니티 데이터 조회 실패:', error)
    
    // 테이블이 없는 경우 초기화 시도
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('🔄 테이블이 없음. 초기화 시도...')
      await initializeCommunityTables()
      
      return Response.json({
        success: true,
        message: '테이블이 초기화되었습니다. 다시 시도해주세요.',
        data: { notices: [], faqs: [], events: [] }
      })
    }

    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 })
  }
}

// POST - 새 항목 추가
export async function POST(request) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log(`📝 새 ${type} 추가 요청:`, data)

    let result

    if (type === 'notices') {
      const { data: insertedData, error } = await supabase
        .from('notices')
        .insert([{
          title: data.title,
          content: data.content,
          author: data.author || '관리자',
          important: data.important || false
        }])
        .select()

      if (error) throw new Error(`공지사항 추가 실패: ${error.message}`)
      result = insertedData[0]

    } else if (type === 'faqs') {
      const { data: insertedData, error } = await supabase
        .from('faqs')
        .insert([{
          question: data.question,
          answer: data.answer,
          category: data.category
        }])
        .select()

      if (error) throw new Error(`FAQ 추가 실패: ${error.message}`)
      result = insertedData[0]

    } else if (type === 'events') {
      const { data: insertedData, error } = await supabase
        .from('events')
        .insert([{
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          status: data.status || 'upcoming'
        }])
        .select()

      if (error) throw new Error(`이벤트 추가 실패: ${error.message}`)
      result = insertedData[0]

    } else {
      throw new Error('유효하지 않은 타입입니다.')
    }

    console.log(`✅ ${type} 추가 성공:`, result.id)
    return Response.json({
      success: true,
      message: `${type} 추가 성공`,
      data: result
    })

  } catch (error) {
    console.error('❌ 항목 추가 실패:', error)
    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 })
  }
}

// PUT - 항목 수정
export async function PUT(request) {
  try {
    const body = await request.json()
    const { type, id, data } = body

    console.log(`✏️ ${type} 수정 요청 (ID: ${id}):`, data)

    let result

    if (type === 'notices') {
      const { data: updatedData, error } = await supabase
        .from('notices')
        .update({
          title: data.title,
          content: data.content,
          important: data.important,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()

      if (error) throw new Error(`공지사항 수정 실패: ${error.message}`)
      result = updatedData[0]

    } else if (type === 'faqs') {
      const { data: updatedData, error } = await supabase
        .from('faqs')
        .update({
          question: data.question,
          answer: data.answer,
          category: data.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()

      if (error) throw new Error(`FAQ 수정 실패: ${error.message}`)
      result = updatedData[0]

    } else if (type === 'events') {
      const { data: updatedData, error } = await supabase
        .from('events')
        .update({
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()

      if (error) throw new Error(`이벤트 수정 실패: ${error.message}`)
      result = updatedData[0]

    } else {
      throw new Error('유효하지 않은 타입입니다.')
    }

    console.log(`✅ ${type} 수정 성공:`, result.id)
    return Response.json({
      success: true,
      message: `${type} 수정 성공`,
      data: result
    })

  } catch (error) {
    console.error('❌ 항목 수정 실패:', error)
    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 })
  }
}

// DELETE - 항목 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    console.log(`🗑️ ${type} 삭제 요청 (ID: ${id})`)

    let tableName
    if (type === 'notices') tableName = 'notices'
    else if (type === 'faqs') tableName = 'faqs'
    else if (type === 'events') tableName = 'events'
    else throw new Error('유효하지 않은 타입입니다.')

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) throw new Error(`${type} 삭제 실패: ${error.message}`)

    console.log(`✅ ${type} 삭제 성공 (ID: ${id})`)
    return Response.json({
      success: true,
      message: `${type} 삭제 성공`
    })

  } catch (error) {
    console.error('❌ 항목 삭제 실패:', error)
    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 })
  }
}