// app/api/admin/facility/route.js
// 시설 관리 API - 사진 업로드/삭제 포함

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 시설 정보 조회
export async function GET(request) {
  try {
    console.log('🏗️ 시설 정보 조회 요청...')

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') // easy, adventure, extreme, amenities

    if (section) {
      // 특정 섹션만 조회
      const { data: facilityData, error } = await supabase
        .from('facility_sections')
        .select('*')
        .eq('section', section)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('특정 섹션 조회 오류:', error)
        throw new Error(`시설 정보 조회 실패: ${error.message}`)
      }

      console.log(`✅ ${section} 시설 정보 조회 완료`)

      return Response.json({
        success: true,
        message: `${section} 시설 정보 조회 성공`,
        data: facilityData ? facilityData.data : getDefaultFacilityData(section)
      })
    } else {
      // 모든 섹션 조회
      const { data: allFacilities, error } = await supabase
        .from('facility_sections')
        .select('*')
        .order('section')

      if (error) {
        console.error('전체 시설 조회 오류:', error)
        // 테이블이 없거나 비어있는 경우 기본값 반환
        if (error.code === 'PGRST116' || error.message.includes('relation')) {
          console.log('테이블이 없거나 비어있음. 기본값 반환')
          return Response.json({
            success: true,
            message: '기본 시설 정보 반환',
            data: getAllDefaultFacilities()
          })
        }
        throw new Error(`전체 시설 정보 조회 실패: ${error.message}`)
      }

      console.log(`✅ 전체 시설 정보 조회 완료: ${allFacilities.length}개 섹션`)

      // 데이터가 없으면 기본값 반환
      if (!allFacilities || allFacilities.length === 0) {
        return Response.json({
          success: true,
          message: '기본 시설 정보 반환',
          data: getAllDefaultFacilities()
        })
      }

      // 데이터 형태로 변환
      const facilitiesObject = {}
      allFacilities.forEach(facility => {
        facilitiesObject[facility.section] = facility.data
      })

      // 기본값과 병합 (누락된 섹션 보완)
      const defaultFacilities = getAllDefaultFacilities()
      const mergedFacilities = { ...defaultFacilities, ...facilitiesObject }

      return Response.json({
        success: true,
        message: '전체 시설 정보 조회 성공',
        data: mergedFacilities
      })
    }

  } catch (error) {
    console.error('❌ 시설 정보 조회 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '시설 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// POST - 시설 정보 저장 및 추가/삭제
export async function POST(request) {
  try {
    console.log('💾 시설 정보 저장 요청...')

    const { section, data, action, itemId } = await request.json()

    if (!section) {
      return Response.json({
        success: false,
        message: '섹션이 필요합니다.'
      }, { status: 400 })
    }

    console.log(`📝 ${section} 시설 정보 ${action || '저장'} 중...`)

    // 기존 데이터 조회
    const { data: existingData, error: selectError } = await supabase
      .from('facility_sections')
      .select('*')
      .eq('section', section)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      throw new Error(`기존 데이터 확인 실패: ${selectError.message}`)
    }

    let result
    if (existingData) {
      // 업데이트
      const { data: updateData, error: updateError } = await supabase
        .from('facility_sections')
        .update({
          data: data,
          updated_at: new Date().toISOString()
        })
        .eq('section', section)
        .select()

      if (updateError) {
        throw new Error(`시설 정보 업데이트 실패: ${updateError.message}`)
      }
      result = updateData
    } else {
      // 새로 생성
      const { data: insertData, error: insertError } = await supabase
        .from('facility_sections')
        .insert({
          section: section,
          data: data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (insertError) {
        throw new Error(`시설 정보 생성 실패: ${insertError.message}`)
      }
      result = insertData
    }

    console.log(`✅ ${section} 시설 정보 저장 완료`)

    return Response.json({
      success: true,
      message: `${section} 시설 정보가 성공적으로 저장되었습니다.`,
      data: result
    })

  } catch (error) {
    console.error('❌ 시설 정보 저장 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '시설 정보 저장 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// DELETE - 시설 이미지 삭제
export async function DELETE(request) {
  try {
    console.log('🗑️ 시설 이미지 삭제 요청...')

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('imageUrl')

    if (!imageUrl) {
      return Response.json({
        success: false,
        message: '이미지 URL이 필요합니다.'
      }, { status: 400 })
    }

    // Supabase Storage에서 이미지 삭제
    if (imageUrl.includes('supabase')) {
      const fileName = imageUrl.split('/').pop()
      const filePath = `facility/${fileName}`

      const { error: deleteError } = await supabase.storage
        .from('content-images')
        .remove([filePath])

      if (deleteError) {
        console.error('❌ 이미지 삭제 실패:', deleteError)
        throw new Error(`이미지 삭제 실패: ${deleteError.message}`)
      }

      console.log(`✅ 이미지 삭제 완료: ${fileName}`)
    }

    return Response.json({
      success: true,
      message: '이미지가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('❌ 시설 이미지 삭제 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '이미지 삭제 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// 기본 시설 데이터 생성 (전체)
function getAllDefaultFacilities() {
  return {
    easy: getDefaultFacilityData('easy'),
    adventure: getDefaultFacilityData('adventure'),
    extreme: getDefaultFacilityData('extreme'),
    amenities: getDefaultFacilityData('amenities')
  }
}

// 기본 시설 데이터 생성
function getDefaultFacilityData(section) {
  const defaultData = {
    easy: {
      title: '이지코스',
      subtitle: '남녀노소 누구나 즐길 수 있는 신나는 모험의 시작되는 이지코스',
      items: [
        {
          id: 1,
          name: '멀티 트램폴린 1, 2',
          description: '어른도 아이도 모두 좋아하는 방방',
          requirements: [
            '필수 착용: 미끄럼방지 양말, 바지',
            '신장 제한: 최소 100cm 이상',
            '동시 체험 가능 인원: 6명'
          ],
          image: ''
        }
      ]
    },
    adventure: {
      title: '어드벤처코스',
      subtitle: '스릴 만점 모험의 정점을 찍는 어드벤처코스',
      items: [
        {
          id: 1,
          name: '스카이로프 (RCI)',
          description: '출렁이는 바닥, 흔들리는 내 마음\n아래가 한눈에 내려다보이는 높이에서 장애물을 건너는 스릴을 경험해보세요',
          requirements: [
            '필수 착용: 미끄럼방지 양말, 바지',
            '신장 제한: 최소 122cm 이상 최대 200cm 이하',
            '몸무게 제한: 최대 136kg 이하',
            '동시 체험 가능 인원: 30명'
          ],
          image: ''
        },
        {
          id: 2,
          name: '하늘오르기',
          description: '한 걸음, 한 걸음, 눈앞의 기둥을 올라\n하늘 가까이로!\n마지막 기둥까지 올라갔다면 점프로 낙하!',
          requirements: [
            '필수 착용: 운동화, 바지, 헬멧, 하네스',
            '신장 제한: 최소 100cm 이상',
            '몸무게 제한: 최소 15kg 이상 최대 140kg 이하',
            '연령 제한: 5세 이상'
          ],
          image: ''
        }
      ]
    },
    extreme: {
      title: '익스트림코스',
      subtitle: '짜릿한 익사이팅 어트랙션에서 극한의 즐거움을 느낄 수 있는 익스트림코스',
      items: [
        {
          id: 1,
          name: '점핑타워',
          description: '높은 타워에서 샌드백을 향해 점프!\n용기를 내서 샌드백을 향해 힘껏 뛰어보세요',
          requirements: [
            '필수 착용: 운동화, 바지, 헬멧, 하네스',
            '신장 제한: 최소 100cm 이상',
            '몸무게 제한: 최소 15kg 이상 최대 140kg 이하',
            '연령 제한: 5세 이상'
          ],
          image: ''
        }
      ]
    },
    amenities: {
      title: '편의시설',
      subtitle: '편안하고 안전한 시설 이용을 위한 다양한 편의시설',
      items: [
        {
          id: 1,
          name: '보관함',
          description: '소지품을 안전하게 보관할 수 있는 개인 사물함',
          requirements: [],
          image: ''
        },
        {
          id: 2,
          name: '보건실',
          description: '응급상황 시 즉시 이용 가능한 의료시설',
          requirements: [],
          image: ''
        }
      ]
    }
  }

  return defaultData[section] || { title: '', subtitle: '', items: [] }
}