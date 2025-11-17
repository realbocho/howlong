import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/study-records - 모든 공부 기록 조회 (랭킹용)
export async function GET() {
  try {
    const { data: records, error } = await supabase
      .from('study_records')
      .select(`
        *,
        users (
          id,
          name
        )
      `)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ records })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/study-records - 공부 기록 저장
export async function POST(request: NextRequest) {
  try {
    const { userId, studyData, photoUrl } = await request.json()

    if (!userId || !studyData || typeof studyData !== 'object') {
      return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 })
    }

    const batchTimestamp = new Date().toISOString()
    const records = []

    // 각 날짜별로 기록 생성
    for (const [date, hours] of Object.entries(studyData)) {
      if (typeof hours !== 'number' || hours < 0 || hours > 24) {
        return NextResponse.json({ error: '올바르지 않은 공부시간입니다.' }, { status: 400 })
      }

      if (hours > 0) {
        records.push({
          user_id: userId,
          date,
          hours,
          photo_url: photoUrl,
          is_part_of_batch: Object.keys(studyData).length > 1,
          batch_timestamp: batchTimestamp
        })
      }
    }

    if (records.length === 0) {
      return NextResponse.json({ error: '최소 하나의 공부시간을 입력해주세요.' }, { status: 400 })
    }

    // upsert를 사용해서 기존 데이터가 있으면 업데이트, 없으면 삽입
    const { data: savedRecords, error } = await supabase
      .from('study_records')
      .upsert(records, { 
        onConflict: 'user_id,date',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      records: savedRecords,
      summary: {
        daysCount: records.length,
        totalHours: records.reduce((sum, r) => sum + r.hours, 0),
        averageHours: records.reduce((sum, r) => sum + r.hours, 0) / records.length
      }
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}