import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/study-records/[userId] - 특정 사용자의 공부 기록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const { data: records, error } = await supabase
      .from('study_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 통계 계산
    const totalHours = records.reduce((sum, record) => sum + Number(record.hours), 0)
    const averageHours = records.length > 0 ? totalHours / records.length : 0
    const studyDays = records.length

    return NextResponse.json({ 
      records,
      stats: {
        totalHours,
        averageHours,
        studyDays
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}