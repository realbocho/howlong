'use client'

import { useState, useRef } from 'react'
import { Calendar, Plus, Camera } from 'lucide-react'

interface StudyFormProps {
  onUserCreated: (userName: string) => void
}

interface StudyHours {
  [date: string]: number
}

export default function StudyForm({ onUserCreated }: StudyFormProps) {
  const [userName, setUserName] = useState('')
  const [studyHours, setStudyHours] = useState<StudyHours>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [averageHours, setAverageHours] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 최근 4일 날짜 생성
  const generateDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push({
        dateString: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }),
        label: i === 0 ? '오늘' : i === 1 ? '어제' : `${i}일 전`,
        isToday: i === 0,
        isYesterday: i === 1
      })
    }
    return dates
  }

  const dates = generateDates()

  const handleHoursChange = (date: string, hours: string) => {
    const numHours = parseFloat(hours) || 0
    const newStudyHours = { ...studyHours, [date]: numHours }
    setStudyHours(newStudyHours)
    
    // 평균 계산
    const validHours = Object.values(newStudyHours).filter(h => h > 0)
    const avg = validHours.length > 0 ? validHours.reduce((sum, h) => sum + h, 0) / validHours.length : 0
    setAverageHours(avg)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userName.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }
    
    if (!selectedFile) {
      alert('증거사진을 첨부해주세요.')
      return
    }
    
    const validHours = Object.values(studyHours).filter(h => h > 0)
    if (validHours.length === 0) {
      alert('최소 하루의 공부시간을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 사용자 생성
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName.trim() })
      })

      if (!userResponse.ok) {
        const error = await userResponse.json()
        throw new Error(error.error)
      }

      const { user } = await userResponse.json()

      // 2. 이미지 업로드
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error)
      }

      const { url: photoUrl } = await uploadResponse.json()

      // 3. 공부 기록 저장
      const recordResponse = await fetch('/api/study-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          studyData: studyHours,
          photoUrl
        })
      })

      if (!recordResponse.ok) {
        const error = await recordResponse.json()
        throw new Error(error.error)
      }

      const { summary } = await recordResponse.json()

      alert(`${summary.daysCount}일간의 공부기록이 저장되었습니다! 총 ${summary.totalHours.toFixed(1)}시간, 평균 ${summary.averageHours.toFixed(1)}시간 🎉`)

      // 폼 초기화
      setUserName('')
      setStudyHours({})
      setSelectedFile(null)
      setPreviewUrl(null)
      setAverageHours(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // 사용자 로그인 처리
      onUserCreated(user.name)

    } catch (error) {
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl mb-5">
      <h2 className="text-xl font-semibold text-gray-700 mb-5">내 정보 입력하기</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 닉네임 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            닉네임
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors text-black"
            placeholder="닉네임을 입력하세요"
            required
          />
        </div>

        {/* 날짜별 공부시간 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Calendar size={16} />
            최근 3일간 순공부 시간 입력
          </label>
          
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {dates.map((date) => (
              <div key={date.dateString} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{date.displayDate}</div>
                  <div className={`text-sm ${date.isToday ? 'text-indigo-600 font-medium' : date.isYesterday ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                    {date.label}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={studyHours[date.dateString] || ''}
                  onChange={(e) => handleHoursChange(date.dateString, e.target.value)}
                  className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg text-center font-medium focus:border-indigo-500 focus:outline-none transition-colors text-black"
                  placeholder="0"
                />
              </div>
            ))}
            
            {averageHours > 0 && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl text-center mt-4">
                <div className="text-sm opacity-90">평균 순공부시간:</div>
                <div className="text-xl font-bold">{averageHours.toFixed(1)}시간</div>
              </div>
            )}
          </div>
        </div>

        {/* 증거사진 업로드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            대표 증거사진 첨부
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
            required
          />
          <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
            <Camera size={14} />
            다른 사람들이 볼 수 있습니다 (최근 공부의 대표 사진)
          </p>
          
          {previewUrl && (
            <div className="mt-3 text-center">
              <img 
                src={previewUrl} 
                alt="미리보기" 
                className="max-w-full max-h-48 rounded-xl shadow-md mx-auto"
              />
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Plus size={20} />
              기록 추가하기
            </>
          )}
        </button>
      </form>
    </div>
  )
}