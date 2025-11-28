// app/api/settings/route.js 수정
// 공개 설정 조회 API - bank_settings 기본값 추가

import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - 공개 설정 정보 조회 (메인/예약 페이지용)
export async function GET() {
  try {
    console.log('⚙️ 공개 설정 조회 요청...')

    // Supabase에서 모든 설정 조회
    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value')

    if (error) {
      console.error('❌ 설정 조회 오류:', error)
      
      // 설정이 없는 경우 기본값 반환
      if (error.code === 'PGRST116') { // 테이블이 비어있음
        console.log('📋 설정 테이블이 비어있음. 기본값 반환...')
        return Response.json({
          success: true,
          message: '기본 설정을 반환합니다.',
          data: getDefaultSettings()
        })
      }
      
      throw new Error(`설정 조회 실패: ${error.message}`)
    }

    console.log(`✅ 설정 조회 성공: ${settings.length}개`)

    // 설정이 없으면 기본값 반환
    if (!settings || settings.length === 0) {
      console.log('📋 설정 데이터가 없음. 기본값 반환...')
      return Response.json({
        success: true,
        message: '기본 설정을 반환합니다.',
        data: getDefaultSettings()
      })
    }

    // 설정 데이터를 객체로 변환
    const settingsObject = {}
    settings.forEach(setting => {
      settingsObject[setting.setting_key] = setting.setting_value
    })

    console.log('📋 설정 변환 완료:', Object.keys(settingsObject))

    // 기본값과 병합 (누락된 설정 보완)
    const defaultSettings = getDefaultSettings()
    const finalSettings = {
      price_settings: { ...defaultSettings.price_settings, ...settingsObject.price_settings },
      operation_settings: { ...defaultSettings.operation_settings, ...settingsObject.operation_settings },
      footer_settings: { ...defaultSettings.footer_settings, ...settingsObject.footer_settings },
      bank_settings: { ...defaultSettings.bank_settings, ...settingsObject.bank_settings },
      payment_settings: { ...defaultSettings.payment_settings, ...settingsObject.payment_settings },
      cancellation_settings: { ...defaultSettings.cancellation_settings, ...settingsObject.cancellation_settings }  // 🆕 추가!
    }
    
    // 🆕 보호자 요금 기본값 처리 (기존 설정에 guardian1Hour, guardian2Hour가 없는 경우)
    if (finalSettings.price_settings) {
      if (!finalSettings.price_settings.guardian1Hour) {
        finalSettings.price_settings.guardian1Hour = finalSettings.price_settings.guardian || 3000
      }
      if (!finalSettings.price_settings.guardian2Hour) {
        finalSettings.price_settings.guardian2Hour = finalSettings.price_settings.guardian || 3000
      }
    }

    console.log('✅ 최종 설정 준비 완료')

    return Response.json({
      success: true,
      message: '설정 조회 성공',
      data: finalSettings
    })

  } catch (error) {
    console.error('❌ 공개 설정 조회 중 오류:', error)
    
    // 네트워크 오류 확인
    if (error.message.includes('fetch failed')) {
      console.log('🔄 네트워크 오류로 기본값 반환...')
      return Response.json({
        success: true,
        message: '네트워크 오류로 기본 설정을 반환합니다.',
        data: getDefaultSettings(),
        warning: 'NETWORK_ERROR'
      })
    }

    // 치명적 오류가 아닌 경우 기본값 반환
    console.log('🔄 오류로 인해 기본값 반환...')
    return Response.json({
      success: true,
      message: '오류로 인해 기본 설정을 반환합니다.',
      data: getDefaultSettings(),
      error: error.message
    })
  }
}

// ============================================
// 기본 설정값 함수 - 보호자 요금 분리 추가
// ============================================
function getDefaultSettings() {
  return {
    price_settings: {
      child1Hour: 12000,        // 🆕 어린이 1시간
      child2Hour: 24000,        // 🆕 어린이 2시간
      adult1Hour: 17000,        // 🆕 성인 1시간
      adult2Hour: 34000,        // 🆕 성인 2시간
      guardian1Hour: 3000,      // 🆕 보호자 1시간
      guardian2Hour: 3000,      // 🆕 보호자 2시간
      guardian: 3000,           // 🆕 기존 보호자 (호환성)
      childNote: '만7세~만13세 미만',
      adultNote: '만13세 이상',
      guardianNote: '놀이시설 이용불가',
      adultPrice: 25000,        // 기존 호환성
      childPrice: 20000,        // 기존 호환성
      groupDiscount: 10,
      minGroupSize: 20,
      remark1Hour: '20:00 발권마감',
      remark2Hour: '19:00 발권마감'
    },
    operation_settings: {
      openTime: '10:00',        // 🆕 목포 플레이파크 운영시간
      closeTime: '21:00',       // 🆕 목포 플레이파크 운영시간
      lastEntry: '20:00',       // 🆕 입장 마감시간
      closedDays: [1],          // 🆕 월요일 휴무
      specialClosedDates: [],   // 🆕 특별 휴무일
      specialNotice: '시설 운영 시간은 목포 플레이파크 사정에 따라 변경될 수 있습니다.',
      notice: '안전한 이용을 위해 안전수칙을 준수해주세요.'
    },
    footer_settings: {
      footerText: `목포플레이파크 | 전라남도 목포시 남농로 115 (용해동) 목포플레이파크
    대표 : 홍주표 | 사업자등록번호 : 147-85-03093
    전화번호 : 061-272-8663 | 이메일 : mokpoplaypark@climbkorea.com
    
    온라인위탁사 | 서울시 강서구 화곡로 68길 82 강서IT밸리 1103호
    전화번호 : 02.338.1316 | 통신판매업신고번호 : 2024-서울강서-0865`
    },

    // 🆕 입금계좌 기본값 추가
    bank_settings: {
      bankName: '신한은행',
      accountNumber: '140-015-156616',
      accountHolder: '목포플레이파크',
      accountHolderName: '기업플레이파크'
    },
    
    // 🆕 결제 설정 기본값 추가
    payment_settings: {
      isPaymentBlocked: false,
      blockMessage: '현재 시스템 점검 중으로 예약이 일시 중단되었습니다.'
    },
    
    // 🆕 취소 정책 설정 기본값 추가
    cancellation_settings: {
      defaultCancelType: 'simple',
      showBothButtons: false,
      simpleCancelLabel: '단순취소',
      refundCancelLabel: '환불취소'
    }
  }
}

// POST - 설정 업데이트 (관리자용 - 여기서는 제한)
export async function POST(request) {
  try {
    console.log('⚠️ 공개 API로 설정 업데이트 시도 차단')
    
    return Response.json({
      success: false,
      message: '설정 업데이트는 관리자 API를 사용해주세요.',
      redirect: '/api/admin/settings'
    }, { status: 403 })

  } catch (error) {
    console.error('❌ 설정 업데이트 차단 중 오류:', error)
    
    return Response.json({
      success: false,
      message: '권한이 없습니다.',
      error: error.message
    }, { status: 403 })
  }
}