// app/api/admin/upload-image/route.js
// 이미지 업로드 API - Supabase Storage 사용

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Supabase 설정
const supabaseUrl = 'https://rplkcijqbksheqcnvjlf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbGtjaWpxYmtzaGVxY252amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMTUzMiwiZXhwIjoyMDY1Mjk3NTMyfQ.bSSd6MS6SZVwTucSF5iL8HvLBoxxfwRIcTeunO5v7YI'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request) {
  try {
    console.log('🖼️ 이미지 업로드 요청 시작...')

    // FormData에서 파일 추출
    const formData = await request.formData()
    const file = formData.get('image')
    const type = formData.get('type') || 'general'

    if (!file) {
      return NextResponse.json({
        success: false,
        message: '파일이 선택되지 않았습니다.'
      }, { status: 400 })
    }

    console.log('📁 파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        message: '파일 크기는 10MB 이하여야 합니다.'
      }, { status: 400 })
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        message: '이미지 파일만 업로드 가능합니다.'
      }, { status: 400 })
    }

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${type}-${timestamp}.${fileExtension}`
    const filePath = `banners/${fileName}`

    console.log('📤 Supabase Storage 업로드 시작:', filePath)

    // ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images') // 'images' 버킷 사용
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true // 같은 이름 파일이 있으면 덮어쓰기
      })

    if (uploadError) {
      console.error('❌ Supabase 업로드 실패:', uploadError)
      
      // 버킷이 없는 경우 생성 시도
      if (uploadError.message?.includes('not found')) {
        console.log('🪣 images 버킷 생성 시도...')
        
        const { error: bucketError } = await supabase.storage
          .createBucket('images', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          })

        if (bucketError) {
          console.error('❌ 버킷 생성 실패:', bucketError)
          return NextResponse.json({
            success: false,
            message: 'Storage 버킷 생성에 실패했습니다.'
          }, { status: 500 })
        }

        // 버킷 생성 후 다시 업로드 시도
        const { data: retryData, error: retryError } = await supabase.storage
          .from('images')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: true
          })

        if (retryError) {
          console.error('❌ 재시도 업로드 실패:', retryError)
          return NextResponse.json({
            success: false,
            message: `업로드 실패: ${retryError.message}`
          }, { status: 500 })
        }

        uploadData = retryData
      } else {
        return NextResponse.json({
          success: false,
          message: `업로드 실패: ${uploadError.message}`
        }, { status: 500 })
      }
    }

    console.log('✅ 업로드 성공:', uploadData)

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    const imageUrl = urlData.publicUrl

    console.log('🔗 이미지 URL:', imageUrl)

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '이미지가 성공적으로 업로드되었습니다.',
      imageUrl: imageUrl,
      fileName: fileName,
      filePath: filePath,
      fileSize: file.size
    })

  } catch (error) {
    console.error('❌ 이미지 업로드 중 오류:', error)
    
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// GET 요청 (업로드된 이미지 목록 조회)
export async function GET(request) {
  try {
    console.log('📂 이미지 목록 조회...')

    const { data: files, error } = await supabase.storage
      .from('images')
      .list('banners', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('❌ 파일 목록 조회 실패:', error)
      return NextResponse.json({
        success: false,
        message: '파일 목록을 불러올 수 없습니다.'
      }, { status: 500 })
    }

    // 공개 URL 포함해서 반환
    const fileList = files.map(file => {
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(`banners/${file.name}`)
      
      return {
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at,
        url: urlData.publicUrl
      }
    })

    return NextResponse.json({
      success: true,
      files: fileList,
      count: files.length
    })

  } catch (error) {
    console.error('❌ 파일 목록 조회 중 오류:', error)
    
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

// DELETE 요청 (이미지 삭제)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json({
        success: false,
        message: '삭제할 파일명이 지정되지 않았습니다.'
      }, { status: 400 })
    }

    console.log('🗑️ 파일 삭제:', fileName)

    const { error } = await supabase.storage
      .from('images')
      .remove([`banners/${fileName}`])

    if (error) {
      console.error('❌ 파일 삭제 실패:', error)
      return NextResponse.json({
        success: false,
        message: `파일 삭제 실패: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('❌ 파일 삭제 중 오류:', error)
    
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}