// app/api/admin/usage-info/route.js
// 이용안내 관리 API (시설이용안내, 이용안전수칙, 이용제한 및 유의사항)

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 이용안내 정보 조회
export async function GET(request) {
  try {
    console.log('📋 이용안내 정보 조회 요청...')

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') // usage, safety, restrictions

    if (section) {
      // 특정 섹션만 조회
      const { data: usageData, error } = await supabase
        .from('usage_info')
        .select('*')
        .eq('section', section)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('특정 섹션 조회 오류:', error)
        throw new Error(`이용안내 정보 조회 실패: ${error.message}`)
      }

      console.log(`✅ ${section} 이용안내 정보 조회 완료`)

      return Response.json({
        success: true,
        message: `${section} 이용안내 정보 조회 성공`,
        data: usageData ? usageData.data : getDefaultUsageData(section)
      })
    } else {
      // 모든 섹션 조회
      const { data: allUsageInfo, error } = await supabase
        .from('usage_info')
        .select('*')
        .order('section')

      if (error) {
        console.error('전체 이용안내 조회 오류:', error)
        // 테이블이 없거나 비어있는 경우 기본값 반환
        if (error.code === 'PGRST116' || error.message.includes('relation')) {
          console.log('테이블이 없거나 비어있음. 기본값 반환')
          return Response.json({
            success: true,
            message: '기본 이용안내 정보 반환',
            data: getAllDefaultUsageData()
          })
        }
        throw new Error(`전체 이용안내 정보 조회 실패: ${error.message}`)
      }

      console.log(`✅ 전체 이용안내 정보 조회 완료: ${allUsageInfo.length}개 섹션`)

      // 데이터가 없으면 기본값 반환
      if (!allUsageInfo || allUsageInfo.length === 0) {
        return Response.json({
          success: true,
          message: '기본 이용안내 정보 반환',
          data: getAllDefaultUsageData()
        })
      }

      // 데이터 형태로 변환
      const usageObject = {}
      allUsageInfo.forEach(usage => {
        usageObject[usage.section] = usage.data
      })

      // 기본값과 병합 (누락된 섹션 보완)
      const defaultUsageData = getAllDefaultUsageData()
      const mergedUsageData = { ...defaultUsageData, ...usageObject }

      return Response.json({
        success: true,
        message: '전체 이용안내 정보 조회 성공',
        data: mergedUsageData
      })
    }

  } catch (error) {
    console.error('❌ 이용안내 정보 조회 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '이용안내 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// POST - 이용안내 정보 저장
export async function POST(request) {
  try {
    console.log('💾 이용안내 정보 저장 요청...')

    const { section, data } = await request.json()

    if (!section || !data) {
      return Response.json({
        success: false,
        message: '섹션과 데이터가 필요합니다.'
      }, { status: 400 })
    }

    console.log(`📝 ${section} 이용안내 정보 저장 중...`)

    // 기존 데이터 조회
    const { data: existingData, error: selectError } = await supabase
      .from('usage_info')
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
        .from('usage_info')
        .update({
          data: data,
          updated_at: new Date().toISOString()
        })
        .eq('section', section)
        .select()

      if (updateError) {
        throw new Error(`이용안내 정보 업데이트 실패: ${updateError.message}`)
      }
      result = updateData
    } else {
      // 새로 생성
      const { data: insertData, error: insertError } = await supabase
        .from('usage_info')
        .insert({
          section: section,
          data: data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (insertError) {
        throw new Error(`이용안내 정보 생성 실패: ${insertError.message}`)
      }
      result = insertData
    }

    console.log(`✅ ${section} 이용안내 정보 저장 완료`)

    return Response.json({
      success: true,
      message: `${section} 이용안내 정보가 성공적으로 저장되었습니다.`,
      data: result
    })

  } catch (error) {
    console.error('❌ 이용안내 정보 저장 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '이용안내 정보 저장 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// 기본 이용안내 데이터 생성 (전체)
function getAllDefaultUsageData() {
  return {
    usage: getDefaultUsageData('usage'),
    safety: getDefaultUsageData('safety'),
    restrictions: getDefaultUsageData('restrictions')
  }
}

// 기본 이용안내 데이터 생성
function getDefaultUsageData(section) {
  const defaultData = {
    usage: {
      title: '시설 이용 안내',
      sections: [
        {
          id: 1,
          title: '이용시간',
          content: {
            note: '시설 운영 시간은 목포 플레이파크 사정에 따라 변경될 수 있습니다.'
          }
        },
        {
          id: 2,
          title: '이용약관',
          content: [
            '홈페이지에서 예매한 이용권은 지정월에 한하여 유효하며, 지정월 이후에는 이용한 것으로 간주합니다.',
            '현장 발권 이용권은 당일에 한하여 유효하며, 당일 이용 시간이 경과 시 이용한 것으로 간주합니다.',
            '내부 수리, 점검 등 불가피한 사정으로 운영이 일시적으로 중단될 수 있으며, 미 사용된 이용권은 환불이 가능합니다.',
            '기타 이용권 양도 등의 부정한 방식으로 사용된 이용권은 무효이며 회수될 수 있습니다.',
            '이용자는 이용 중 안전장구의 임의 탈의를 하여서는 안됩니다.'
          ]
        },
        {
          id: 3,
          title: '고객센터',
          content: {
            phone: '000-000-0000',
            hours: '10:00~18:00',
            lunch: '12:00~13:00',
            weekday: '시설 및 이용안내, 결제 완료 확인, 은행계좌 입금 안내, 현금 영수증 발행, 취소 및 환불 안내',
            weekend: '시설 및 이용안내, 결제 완료 확인'
          }
        }
      ]
    },
    safety: {
      title: '이용안전수칙',
      sections: [
        {
          id: 1,
          title: '이용자 안전수칙',
          content: [
            '시설 이용 중에 안전장비의 착용은 의무이며, 개인소유의 장비는 사용할 수 없습니다.',
            '이용자는 착용하고 있는 안전장비의 사용 및 관리를 책임져야 합니다.',
            '한 개의 어트랙션 내에는 1명만 이용할 수 있으므로 앞선 이용자가 이용을 종료한 후 이용해야 합니다. 다만, 2명 이상 이용이 가능한 어트랙션은 허용된 인원의 이용이 가능합니다.',
            '시설 이용이 종료된 이후 안전요원이 안전장비를 탈의하기 전까지 임의로 안전장비를 탈의해서는 안됩니다.'
          ]
        },
        {
          id: 2,
          title: '이용자의 책임',
          content: [
            '모든 이용자는 안전수칙을 준수하고, 개인안전장비를 항상 착용해야 합니다.',
            '시설 이용자의 라커에 보관하지 않은 개인 소지품의 손상 이나 분실은 책임지지 않습니다.',
            '시설 이용 시 현기증, 불편함 및 가벼운 상처 등으로 위험에 처한 이용자는 직원에게 도움을 요청해야 합니다.',
            '거짓 신고, 안전 수칙 무시 및 직원의 지시 불이행에 따라 발생되는 사고에 대해서는 책임을 지지 않습니다.',
            '이용자가 고의나 과실로 시설물이나 시설물에 비치된 물품 등을 멸실 또는 훼손하였을 때에는 원상복구 하여야 하며, 복구가 불가능한 때에는 정당한 손해배상을 하여야 합니다.',
            '어린이와 청소년을 동반한 보호자 및 인솔자는 성실한 보호자의 주의 의무를 다하여야 합니다.'
          ]
        }
      ]
    },
    restrictions: {
      title: '이용제한 및 유의사항',
      sections: [
        {
          id: 1,
          title: '이용시 유의사항',
          content: [
            '어트랙션당 1명만 이용해야 합니다. (단, 트램펄린, 스카이로프는 어트랙션 별 동시이용 가능인원에 따름)',
            '휴대폰, 지갑 등 낙하 시 파손 및 분실의 우려가 있는 물품은 물품보관함에 보관합니다.',
            '어트랙션 이용 중에는 장난을 치거나 무리한 행동을 금지합니다.',
            '물품 보관함 열쇠 분실 시 분실요금이 부과됩니다.',
            '운동화, 바지, 양말 미착용 시 시설이용이 제한될 수 있습니다.',
            '퇴장 후 재입장은 불가합니다.'
          ]
        },
        {
          id: 2,
          title: '이용제한 안내',
          content: [
            '만 70세 이상 이용불가',
            '어트랙션에 따라 신장, 무게, 연령 등의 제한으로 이용이 어려울 수 있습니다.',
            '신장 100cm 미만, 200cm 이상 이용불가 (단, 공중놀이시설은 94cm 미만, 100kg 초과시 이용불가)',
            '체중 15kg 미만, 140kg 초과는 이용불가',
            '연령 5세 미만 이용불가',
            '시설이용으로 건강이 악화될 수 있는 자, 최근 수술자, 만성적 허리 건강 문제가 있는 자 이용불가',
            '임산부, 주취자, 약물에 영향을 받고 있는 자 이용불가',
            '신발은 운동화를 착용하셔야 하며 슬리퍼, 쪼리 등은 이용불가'
          ]
        }
      ]
    }
  }

  return defaultData[section] || { title: '', sections: [] }
}

function getSectionDisplayName(section) {
  const displayNames = {
    usage: '시설이용안내',
    safety: '이용안전수칙',
    restrictions: '이용제한 및 유의사항'
  }
  return displayNames[section] || section
}