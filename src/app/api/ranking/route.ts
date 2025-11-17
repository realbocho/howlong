import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/ranking - 공부시간 랭킹 조회
export async function GET() {
  try {
    // 사용자별 통계 계산하는 쿼리
    const { data: userStats, error } = await supabase.rpc('get_user_rankings')

    if (error) {
      // RPC 함수가 없다면 수동으로 계산
      const { data: allRecords, error: recordsError } = await supabase
        .from('study_records')
        .select(`
          user_id,
          hours,
          users (
            name
          )
        `)

      if (recordsError) {
        return NextResponse.json({ error: recordsError.message }, { status: 500 })
      }

      // 사용자별 통계 수동 계산
      const userStatsMap = new Map()

      allRecords.forEach(record => {
        const userId = record.user_id
        const hours = Number(record.hours)
        const userName = (record.users as any)?.name

        if (!userStatsMap.has(userId)) {
          userStatsMap.set(userId, {
            user_id: userId,
            name: userName,
            total_hours: 0,
            study_days: 0
          })
        }

        const stats = userStatsMap.get(userId)
        stats.total_hours += hours
        stats.study_days += 1
      })

      // 평균 계산 및 정렬
      const rankings = Array.from(userStatsMap.values())
        .map(stats => ({
          ...stats,
          average_hours: stats.study_days > 0 ? stats.total_hours / stats.study_days : 0
        }))
        .sort((a, b) => b.total_hours - a.total_hours)
        .map((stats, index) => ({
          ...stats,
          rank: index + 1
        }))

      return NextResponse.json({ rankings })
    }

    return NextResponse.json({ rankings: userStats })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}