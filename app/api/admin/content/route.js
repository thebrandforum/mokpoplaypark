// app/api/admin/content/route.js
// 콘텐츠 관리 API

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 콘텐츠 조회
export async function GET() {
  try {
    console.log('📄 콘텐츠 조회 요청...')

    const { data: content, error } = await supabase
      .from('content')
      .select('content_type, content_data, updated_at')

    if (error && error.code !== 'PGRST116') {
      throw new Error(`콘텐츠 조회 실패: ${error.message}`)
    }

    // 콘텐츠가 없으면 기본값 반환
    if (!content || content.length === 0) {
      return Response.json({
        success: true,
        message: '기본 콘텐츠를 반환합니다.',
        data: getDefaultContent()
      })
    }

    // 콘텐츠 데이터를 객체로 변환
    const contentObject = {}
    content.forEach(item => {
      contentObject[item.content_type] = item.content_data
    })

    return Response.json({
      success: true,
      message: '콘텐츠 조회 성공',
      data: contentObject
    })

  } catch (error) {
    console.error('❌ 콘텐츠 조회 중 오류:', error)
    return Response.json({
      success: false,
      message: '콘텐츠 조회 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// POST - 콘텐츠 저장
export async function POST(request) {
  try {
    console.log('💾 콘텐츠 저장 요청...')
    
    const body = await request.json()
    const { section, data } = body

    if (!section || !data) {
      return Response.json({
        success: false,
        message: 'section과 data가 필요합니다.'
      }, { status: 400 })
    }

    // Supabase upsert
    const { data: result, error } = await supabase
      .from('content')
      .upsert({
        content_type: section,
        content_data: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'content_type'
      })
      .select()

    if (error) {
      throw new Error(`콘텐츠 저장 실패: ${error.message}`)
    }

    return Response.json({
      success: true,
      message: `${getSectionDisplayName(section)} 콘텐츠가 저장되었습니다.`,
      data: result
    })

  } catch (error) {
    console.error('❌ 콘텐츠 저장 중 오류:', error)
    return Response.json({
      success: false,
      message: '콘텐츠 저장 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// 기본 콘텐츠 데이터
// 기존 getDefaultContent() 함수를 이것으로 교체
function getDefaultContent() {
  return {
    about: {
      title: '목포플레이파크',
      subtitle1: '전남 최초의 실내 모험 스포츠 테마파크',
      subtitle2: '13종의 모험스포츠 어트랙션',
      subtitle3: '남녀노소 즐기는 스릴과 넘치는 도전',
      description1: '스포츠클라이밍, 서바이벌 체험을 위한 최고의 모험 스포츠를 즐기며 서바이벌과 클라이머들을 꿈꾸는 청소년 성인 700평 구성을 서바이벌 모험 스포츠 테마파크로 구성',
      description2: '총 13종류의 모험스포츠 체험이 내일 아침 가능한 아드레날린 스포츠를 위한 가장 최적의 등반을 소개한 스포츠들 수 있는 내룡을 체험을 만날 수 있습니다. 당 시설을 코스와의 성단은 기반의 강화 시범에 남녀노소 체험수 다양한 는 스릴을 체험을 만날 수 있는 내룡을 체험을 만날 수 있습니다.',
      description3: '놀이 아임의 새로운 경험 스포츠 이상의 무시의! 무시의 정점을 는 본능을 개발을 스포츠에서 시험 아동 장치를 뒤어올 수 정확을 시간을 시각을 쇼케이스.',
      images: ['', '', '']
    },
    gallery: {
      title: '갤러리',
      description: '목포 플레이파크의 생생한 모습들',
      images: []
    },
    location: {
      title: '오시는길',
      address: '전라남도 목포시 용해동 7-20 목포 플레이파크',
      driving: {
        title: '자가용으로 오시는 길',
        routes: [
          '서울에서 출발: 경부고속도로 → 서해안고속도로 → 목포IC → 목포플레이파크',
          '광주에서 출발: 무안광주고속도로 → 서해안고속도로 → 목포IC → 목포플레이파크',
          '대구에서 출발: 광주대구고속도로 → 무안광주고속도로 → 서해안고속도로 → 목포플레이파크',
          '부산에서 출발: 남해고속도로 → 호남고속도로 → 무안광주고속도로 → 목포플레이파크',
          '진주에서 출발: 남해고속도로 → 충무공로 → 남해고속도로 → 목포플레이파크'
        ],
        navigation: '전라남도 목포시 용해동 7-20'
      },
      publicTransport: {
        title: '대중교통으로 오시는 길',
        train: '목포역 하차 → 버스 66번 탑승 → 이로동주민센터 하차 또는 시내버스 88번 탑승 → 문화예술회관 하차',
        bus: '목포종합버스터미널 하차 → 버스 66-1번 탑승 → 목포고용노동부 하차',
        taxi: '목포역 및 목포종합버스터미널에서 약 9분 소요 (약 6,000원)'
      }
    }
  }
}


function getSectionDisplayName(section) {
  const displayNames = {
    about: '소개',
    gallery: '갤러리',
    location: '오시는길'
  }
  return displayNames[section] || section
}