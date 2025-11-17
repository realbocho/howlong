'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import ProfileModal from './ProfileModal'

interface RankingListProps {
  currentUser: string
}

interface RankingItem {
  user_id: string
  name: string
  total_hours: number
  average_hours: number
  study_days: number
  rank: number
}

export default function RankingList({ currentUser }: RankingListProps) {
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<RankingItem | null>(null)

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ranking')
      
      if (response.ok) {
        const { rankings: rankingData } = await response.json()
        setRankings(rankingData)
      }
    } catch (error) {
      console.error('랭킹 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />
      case 2:
        return <Medal className="text-gray-400" size={24} />
      case 3:
        return <Award className="text-amber-600" size={24} />
      default:
        return <span className="text-gray-600 font-bold text-lg">{rank}</span>
    }
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '📚'
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-200 to-yellow-300 border-yellow-400'
      case 2:
        return 'bg-gradient-to-r from-gray-200 to-gray-300 border-gray-400'
      case 3:
        return 'bg-gradient-to-r from-amber-200 to-amber-300 border-amber-400'
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-gray-700 mb-5 flex items-center gap-2">
          🏆 공부시간 랭킹
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-gray-700 mb-5 flex items-center gap-2">
          🏆 공부시간 랭킹
        </h2>

        {rankings.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>아직 랭킹 데이터가 없습니다.</p>
            <p className="text-sm mt-1">첫 번째 기록을 남겨보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((item) => (
              <div
                key={item.user_id}
                onClick={() => setSelectedUser(item)}
                className={`${getRankStyle(item.rank)} border-2 rounded-2xl p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getRankIcon(item.rank)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        {item.name}
                        {item.name === currentUser && (
                          <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">나</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        총 {item.total_hours.toFixed(1)}시간 (평균 {item.average_hours.toFixed(1)}시간)
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl">
                    {getRankEmoji(item.rank)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 프로필 모달 */}
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  )
}