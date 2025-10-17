import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성
const supabase = createClient(
  'https://rplkcijqbksheqcnvjlf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'
)

// GET: 홈페이지 설정 조회
export async function GET() {
  try {
    console.log('📥 홈페이지 설정 조회 시작...')
    
    // settings 테이블에서 homepage_settings 조회 (id=1)
    const { data, error } = await supabase
      .from('settings')
      .select('homepage_settings')
      .eq('id', 1)
      .single()

    console.log('조회 결과:', { data, error })

    if (error) {
      console.error('Supabase 조회 오류:', error)
      throw error
    }

    // 기본값 설정
    const defaultSettings = {
      mainImages: [
        { id: 1, url: '/images/hero/main1.jpg', file: null },
        { id: 2, url: '/images/hero/main2.jpg', file: null },
        { id: 3, url: '/images/hero/main3.jpg', file: null }
      ],
      contactInfo: {
        fieldPhone: '061-272-8663',
        customerService: '1588-0000'
      }
    }

    // 데이터가 있으면 사용, 없으면 기본값
    const settings = data?.homepage_settings || defaultSettings

    return NextResponse.json({ 
      success: true, 
      data: settings 
    })

  } catch (error) {
    console.error('홈페이지 설정 조회 오류:', error)
    return NextResponse.json(
      { success: false, message: '설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 홈페이지 설정 저장
export async function POST(request) {
  try {
    console.log('📤 홈페이지 설정 저장 시작...')
    
    const body = await request.json()
    const { mainImages, contactInfo } = body

    console.log('저장할 데이터:', { mainImages, contactInfo })

    // 유효성 검사
    if (!mainImages || !contactInfo) {
      return NextResponse.json(
        { success: false, message: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // settings 테이블에 homepage_settings 업데이트 (id=1)
    const { error: updateError } = await supabase
      .from('settings')
      .update({ 
        homepage_settings: {
          mainImages,
          contactInfo
        }
      })
      .eq('id', 1)

    if (updateError) {
      console.error('업데이트 오류:', updateError)
      throw updateError
    }

    // 현장 문의 번호는 basic_info의 phone에도 업데이트
    if (contactInfo.fieldPhone) {
      // 먼저 현재 basic_info 조회 (id=2)
      const { data: currentData, error: fetchError } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'basic_info')
        .single()

      if (!fetchError && currentData) {
        const currentBasicInfo = currentData.setting_value || {}
        
        // phone 필드 업데이트
        const { error: phoneUpdateError } = await supabase
          .from('settings')
          .update({
            setting_value: {
              ...currentBasicInfo,
              phone: contactInfo.fieldPhone
            }
          })
          .eq('setting_key', 'basic_info')

        if (phoneUpdateError) {
          console.error('전화번호 업데이트 오류:', phoneUpdateError)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '설정이 저장되었습니다.' 
    })

  } catch (error) {
    console.error('홈페이지 설정 저장 오류:', error)
    return NextResponse.json(
      { success: false, message: '설정 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}