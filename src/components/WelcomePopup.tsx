'use client'

import { useState, useEffect, useRef } from 'react'
import { Key, Edit, AlertTriangle } from 'lucide-react'

interface WelcomePopupProps {
  onClose: () => void
  onUserLogin: (userName: string) => void
}

interface User {
  id: string
  name: string
}

export default function WelcomePopup({ onClose, onUserLogin }: WelcomePopupProps) {
  const [existingUsers, setExistingUsers] = useState<User[]>([])
  const [loginName, setLoginName] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  const popupRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchExistingUsers()
    initializeDrag()
  }, [])

  const fetchExistingUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const { users } = await response.json()
        setExistingUsers(users)
      }
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error)
    }
  }

  const initializeDrag = () => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !popupRef.current) return
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // 화면 경계 체크
      const popup = popupRef.current
      const rect = popup.getBoundingClientRect()
      const maxX = window.innerWidth - rect.width - 10
      const maxY = window.innerHeight - rect.height - 10
      
      const constrainedX = Math.max(10, Math.min(maxX, newX))
      const constrainedY = Math.max(10, Math.min(maxY, newY))
      
      setPosition({ x: constrainedX, y: constrainedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!popupRef.current) return
    
    const rect = popupRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setPosition({ x: rect.left, y: rect.top })
    setIsDragging(true)
  }

  const handleLogin = async () => {
    if (!loginName.trim()) {
      setLoginError('닉네임을 입력해주세요.')
      return
    }

    const existingUser = existingUsers.find(user => user.name === loginName.trim())
    if (!existingUser) {
      setLoginError('등록되지 않은 닉네임입니다. 새로 등록해주세요.')
      return
    }

    onUserLogin(loginName.trim())
  }

  const selectUser = (userName: string) => {
    setLoginName(userName)
    setLoginError('')
  }

  const getPopupStyle = () => {
    if (isDragging) {
      return {
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
        transform: 'none',
        cursor: 'grabbing',
        scale: '1.02',
        zIndex: 1000
      }
    }
    return {}
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-5">
      <div
        ref={popupRef}
        style={getPopupStyle()}
        className={`bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200 transition-all ${
          isDragging ? 'shadow-3xl' : 'hover:shadow-3xl'
        }`}
      >
        {/* 드래그 핸들 */}
        <div
          ref={dragHandleRef}
          onMouseDown={handleMouseDown}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-t-3xl cursor-move hover:from-indigo-600 hover:to-purple-700 transition-all select-none"
        >
          <div className="text-center font-medium text-sm">
            {isDragging ? '드래그 중...' : '팝업을 드래그하여 이동할 수 있습니다'}
          </div>
        </div>

        <div className="p-6">
          {/* 환영 메시지 */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              How Long에 오신 것을 환영합니다!
            </h2>
          </div>

          {/* 기존 사용자 로그인 */}
          {existingUsers.length > 0 && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
                  <Key size={20} />
                  기존 사용자이신가요?
                </h3>
                <p className="text-gray-600 mb-4">이전에 등록한 닉네임을 입력하세요</p>
                
                <div className="mb-3">
                  <div className="text-sm text-gray-600 font-medium mb-2">
                    📋 등록된 사용자 ({existingUsers.length}명)
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {existingUsers.slice(0, 6).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => selectUser(user.name)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105"
                      >
                        {user.name}
                      </button>
                    ))}
                    {existingUsers.length > 6 && (
                      <span className="text-gray-500 text-sm self-center">
                        +{existingUsers.length - 6}명 더
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => {
                      setLoginName(e.target.value)
                      setLoginError('')
                    }}
                    placeholder="등록된 닉네임 입력"
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    onClick={handleLogin}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <Key size={16} />
                    로그인
                  </button>
                </div>

                {loginError && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {loginError}
                  </div>
                )}
              </div>

              <div className="text-center my-4">
                <span className="bg-white px-4 text-gray-500 font-medium">또는</span>
                <div className="border-t border-gray-200 -mt-3 -mx-6"></div>
              </div>
            </div>
          )}

          {/* 신규 사용자 안내 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center gap-2">
              <Edit size={20} />
              처음 사용하시나요?
            </h3>
            <p className="text-gray-600 mb-4">
              공부시간 랭킹을 확인하기 위해서는<br />
              먼저 본인의 공부시간을 입력해야 합니다.
            </p>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 text-yellow-800 font-semibold mb-2">
                <AlertTriangle size={18} />
                중요 안내
              </div>
              <p className="text-yellow-700 text-sm leading-relaxed">
                📝 닉네임과 순공부시간을 입력하고<br />
                📸 증거사진을 첨부해주세요!
              </p>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              입력 후에는 다른 사람들과의 랭킹 비교와<br />
              상세한 통계를 확인할 수 있습니다.
            </p>
            
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-2xl font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Edit size={20} />
              새로 등록하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}