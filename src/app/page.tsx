'use client'

import { useState, useEffect } from 'react'
import StudyForm from '@/components/StudyForm'
import RankingList from '@/components/RankingList'
import UserStats from '@/components/UserStats'
import WelcomePopup from '@/components/WelcomePopup'
import { Clock } from 'lucide-react'

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)

  useEffect(() => {
    // localStorage에서 현재 사용자 확인
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setCurrentUser(savedUser)
    } else {
      setShowWelcomePopup(true)
    }
  }, [])

  const handleUserLogin = (userName: string) => {
    setCurrentUser(userName)
    localStorage.setItem('currentUser', userName)
    setShowWelcomePopup(false)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
    setShowWelcomePopup(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* 헤더 */}
      <header className="text-center text-white py-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
          <Clock className="text-yellow-300" size={48} />
          How Long
        </h1>
        <p className="text-xl opacity-90 font-light">공부시간 랭킹 비교</p>
      </header>

      {/* 메인 컨테이너 */}
      <div className="max-w-md mx-auto px-5 pb-8">
        {currentUser ? (
          <>
            {/* 사용자 통계 */}
            <UserStats userName={currentUser} onLogout={handleLogout} />
            
            {/* 랭킹 */}
            <RankingList currentUser={currentUser} />
          </>
        ) : (
          <>
            {/* 공부시간 입력 폼 */}
            <StudyForm onUserCreated={handleUserLogin} />
            
            {/* 랭킹 (안내 메시지만) */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl mb-5">
              <h2 className="text-xl font-semibold text-gray-700 mb-5 flex items-center gap-2">
                🏆 공부시간 랭킹
              </h2>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">⚠️</div>
                <p className="text-yellow-800 font-semibold mb-2">
                  본인의 공부시간을 먼저 입력해야<br />랭킹을 확인할 수 있습니다!
                </p>
                <p className="text-yellow-700 text-sm opacity-80">
                  위의 양식을 작성하고 증거사진을 첨부해주세요.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 환영 팝업 */}
      {showWelcomePopup && (
        <WelcomePopup 
          onClose={() => setShowWelcomePopup(false)}
          onUserLogin={handleUserLogin}
        />
      )}
    </div>
  )
}
