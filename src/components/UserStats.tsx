'use client'

import { useState, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'

interface UserStatsProps {
  userName: string
  onLogout: () => void
}

interface UserStatsData {
  totalHours: number
  averageHours: number
  studyDays: number
  rank?: number
}

export default function UserStats({ userName, onLogout }: UserStatsProps) {
  const [stats, setStats] = useState<UserStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [userName])

  const fetchUserStats = async () => {
    try {
      setLoading(true)
      
      // 사용자 정보 가져오기
      const userResponse = await fetch(`/api/users/${encodeURIComponent(userName)}`)
      if (!userResponse.ok) {
        throw new Error('사용자를 찾을 수 없습니다.')
      }
      
      const { user } = await userResponse.json()
      
      // 사용자 통계 가져오기
      const statsResponse = await fetch(`/api/study-records/${user.id}`)
      if (!statsResponse.ok) {
        throw new Error('통계를 불러올 수 없습니다.')
      }
      
      const { stats: userStats } = await statsResponse.json()
      
      // 랭킹 정보 가져오기
      const rankingResponse = await fetch('/api/ranking')
      if (rankingResponse.ok) {
        const { rankings } = await rankingResponse.json()
        const userRanking = rankings.find((r: any) => r.user_id === user.id)
        userStats.rank = userRanking?.rank || null
      }
      
      setStats(userStats)
    } catch (error) {
      console.error('통계 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (confirm('정말 로그아웃하시겠습니까?')) {
      onLogout()
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-2xl mb-5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl mb-5">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">내 공부 통계</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
        >
          <LogOut size={14} />
          로그아웃
        </button>
      </div>

      {/* 현재 사용자 표시 */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full font-medium">
          <User size={16} />
          {userName}
        </div>
      </div>

      {/* 통계 그리드 */}
      {stats ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {stats.totalHours.toFixed(1)}시간
            </div>
            <div className="text-sm text-gray-600">총 공부시간</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {stats.averageHours.toFixed(1)}시간
            </div>
            <div className="text-sm text-gray-600">평균 공부시간</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {stats.studyDays}일
            </div>
            <div className="text-sm text-gray-600">공부일수</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.rank ? `${stats.rank}위` : '-'}
            </div>
            <div className="text-sm text-gray-600">내 순위</div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>아직 공부 기록이 없습니다.</p>
          <p className="text-sm mt-1">공부시간을 입력해보세요!</p>
        </div>
      )}
    </div>
  )
}