// app/api/community/route.js
// 사용자용 커뮤니티 조회 API - Supabase PostgreSQL 기반

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 사용자용 커뮤니티 데이터 조회 (공개)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // notices, faqs, events
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log(`📥 사용자 커뮤니티 데이터 조회: ${type || 'all'}, 페이지: ${page}`)

    let result = {}

    if (!type || type === 'notices') {
      const startIndex = (page - 1) * limit
      
      const { data: notices, error: noticesError } = await supabase
        .from('notices')
        .select('id, title, content, author, important, created_at')
        .order('important', { ascending: false })  // 중요 공지 먼저
        .order('created_at', { ascending: false }) // 최신순
        .range(startIndex, startIndex + limit - 1)

      if (noticesError) {
        console.error('공지사항 조회 실패:', noticesError)
        result.notices = []
      } else {
        // 전체 중요 공지 개수 조회
        const { count: importantCount } = await supabase
          .from('notices')
          .select('*', { count: 'exact', head: true })
          .eq('important', true)

        // 날짜 포맷 변환 및 번호 계산
        const formattedNotices = notices.map((notice, index) => {
          let displayNumber = null
          if (!notice.important) {
            // 현재 페이지에서 일반 공지사항의 순번 계산
            const normalNoticesBeforeThis = notices.slice(0, index).filter(n => !n.important).length
            // 이전 페이지들의 일반 공지사항 개수 + 현재 페이지에서의 순번 + 1
            const previousPagesNormalCount = Math.max(0, (page - 1) * limit - (importantCount || 0))
            displayNumber = previousPagesNormalCount + normalNoticesBeforeThis + 1
          }
          
          return {
            ...notice,
            date: new Date(notice.created_at).toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1),
            displayNumber
          }
        })
        result.notices = formattedNotices
      }

      // 총 개수도 조회
      const { count } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
      
      result.noticesTotal = count || 0
    }

    if (!type || type === 'faqs') {
      const startIndex = (page - 1) * limit
      
      const { data: faqs, error: faqsError } = await supabase
        .from('faqs')
        .select('id, question, answer, category, created_at')
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + limit - 1)

      if (faqsError) {
        console.error('FAQ 조회 실패:', faqsError)
        result.faqs = []
      } else {
        result.faqs = faqs
      }

      // 총 개수도 조회
      const { count } = await supabase
        .from('faqs')
        .select('*', { count: 'exact', head: true })
      
      result.faqsTotal = count || 0
    }

    if (!type || type === 'events') {
      const startIndex = (page - 1) * limit
      
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, description, start_date, end_date, status, created_at')
        .order('start_date', { ascending: false })
        .range(startIndex, startIndex + limit - 1)

      if (eventsError) {
        console.error('이벤트 조회 실패:', eventsError)
        result.events = []
      } else {
        // 날짜 포맷 변환
        const formattedEvents = events.map(event => ({
          ...event,
          startDate: event.start_date,
          endDate: event.end_date
        }))
        result.events = formattedEvents
      }

      // 총 개수도 조회
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
      
      result.eventsTotal = count || 0
    }

    console.log(`✅ 사용자 커뮤니티 데이터 조회 성공`)
    return Response.json({
      success: true,
      message: '커뮤니티 데이터 조회 성공',
      data: result,
      pagination: {
        page,
        limit,
        hasMore: type === 'notices' ? result.noticesTotal > page * limit :
                type === 'faqs' ? result.faqsTotal > page * limit :
                type === 'events' ? result.eventsTotal > page * limit : false
      }
    })

  } catch (error) {
    console.error('❌ 사용자 커뮤니티 데이터 조회 실패:', error)
    
    return Response.json({
      success: false,
      message: '커뮤니티 데이터를 불러올 수 없습니다.',
      data: { notices: [], faqs: [], events: [] }
    }, { status: 500 })
  }
}