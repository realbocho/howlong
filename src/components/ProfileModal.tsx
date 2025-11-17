'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ProfileModalProps {
  user: {
    user_id: string
    name: string
    total_hours: number
    average_hours: number
    study_days: number
    rank: number
  }
  currentUser: string
  onClose: () => void
}

interface StudyRecord {
  id: string
  date: string
  hours: number
  photo_url?: string
  is_part_of_batch: boolean
  batch_timestamp?: string
}

interface Comment {
  id: string
  commenter_name: string
  comment_text: string
  created_at: string
}

interface BatchGroup {
  isBatch: boolean
  records: StudyRecord[]
}

export default function ProfileModal({ user, currentUser, onClose }: ProfileModalProps) {
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [user.user_id])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // 공부 기록 가져오기
      const recordsResponse = await fetch(`/api/study-records/${user.user_id}`)
      if (recordsResponse.ok) {
        const { records } = await recordsResponse.json()
        setStudyRecords(records)
      }

      // 댓글 가져오기
      const commentsResponse = await fetch(`/api/comments/${user.user_id}`)
      if (commentsResponse.ok) {
        const { comments: commentData } = await commentsResponse.json()
        setComments(commentData)
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupBatchRecords = (records: StudyRecord[]): BatchGroup[] => {
    const groups: BatchGroup[] = []
    let currentBatch: StudyRecord[] = []
    
    const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    for (const record of sortedRecords) {
      if (record.is_part_of_batch && record.batch_timestamp) {
        if (currentBatch.length === 0 || currentBatch[0].batch_timestamp === record.batch_timestamp) {
          currentBatch.push(record)
        } else {
          if (currentBatch.length > 0) {
            groups.push({
              isBatch: true,
              records: [...currentBatch].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            })
          }
          currentBatch = [record]
        }
      } else {
        if (currentBatch.length > 0) {
          groups.push({
            isBatch: true,
            records: [...currentBatch].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          })
          currentBatch = []
        }
        groups.push({
          isBatch: false,
          records: [record]
        })
      }
    }
    
    if (currentBatch.length > 0) {
      groups.push({
        isBatch: true,
        records: [...currentBatch].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      })
    }
    
    return groups
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (dateString === today.toISOString().split('T')[0]) {
      return '오늘'
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return '어제'
    } else {
      return format(date, 'M월 d일 (E)', { locale: ko })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/comments/${user.user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commenterName: currentUser,
          commentText: newComment.trim()
        })
      })

      if (response.ok) {
        const { comment } = await response.json()
        setComments([comment, ...comments])
        setNewComment('')
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      alert('댓글 추가 중 오류가 발생했습니다.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const batchGroups = groupBatchRecords(studyRecords)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <h3 className="text-xl font-bold">{user.name}님의 프로필</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              {/* 통계 */}
              <div className="p-6 border-b">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {user.total_hours.toFixed(1)}시간
                    </div>
                    <div className="text-sm text-gray-600">총 공부시간</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {user.average_hours.toFixed(1)}시간
                    </div>
                    <div className="text-sm text-gray-600">평균 공부시간</div>
                  </div>
                </div>
              </div>

              {/* 공부 기록 */}
              <div className="p-6 border-b">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📖 공부 기록
                </h4>
                
                {batchGroups.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    아직 기록이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batchGroups.map((group, groupIndex) => (
                      <div key={groupIndex}>
                        {group.isBatch && group.records.length > 1 ? (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                            <div className="text-indigo-700 font-semibold mb-2">
                              {formatDate(group.records[group.records.length - 1].date)} ~ {formatDate(group.records[0].date)} ({group.records.length}일간)
                            </div>
                            <div className="text-gray-700 font-medium mb-3">
                              📊 총 {group.records.reduce((sum, r) => sum + r.hours, 0).toFixed(1)}시간 | 
                              평균 {(group.records.reduce((sum, r) => sum + r.hours, 0) / group.records.length).toFixed(1)}시간/일
                            </div>
                            <div className="bg-white/70 rounded-lg p-3 mb-3">
                              {group.records.map((record) => (
                                <div key={record.id} className="flex justify-between py-1 text-sm">
                                  <span className="text-gray-600">{formatDate(record.date)}</span>
                                  <span className="font-medium">{record.hours}시간</span>
                                </div>
                              ))}
                            </div>
                            {group.records[0].photo_url && (
                              <div className="text-center">
                                <img 
                                  src={group.records[0].photo_url} 
                                  alt="공부 증거사진" 
                                  className="max-w-full max-h-48 rounded-lg shadow-md mx-auto cursor-pointer hover:scale-105 transition-transform"
                                  onClick={(e) => {
                                    const img = e.target as HTMLImageElement
                                    img.style.transform = img.style.transform ? '' : 'scale(1.5)'
                                    img.style.zIndex = img.style.zIndex ? '' : '1000'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          group.records.map((record) => (
                            <div key={record.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                              <div className="text-gray-600 text-sm mb-1">{formatDate(record.date)}</div>
                              <div className="font-medium text-gray-800 mb-3">⏰ {record.hours}시간 공부</div>
                              {record.photo_url && (
                                <div className="text-center">
                                  <img 
                                    src={record.photo_url} 
                                    alt="공부 증거사진" 
                                    className="max-w-full max-h-48 rounded-lg shadow-md mx-auto cursor-pointer hover:scale-105 transition-transform"
                                    onClick={(e) => {
                                      const img = e.target as HTMLImageElement
                                      img.style.transform = img.style.transform ? '' : 'scale(1.5)'
                                      img.style.zIndex = img.style.zIndex ? '' : '1000'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 댓글 섹션 */}
              <div className="p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare size={20} />
                  댓글
                </h4>

                {/* 댓글 입력 */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="응원 메시지를 남겨보세요!"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-black"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Send size={16} />
                    댓글
                  </button>
                </div>

                {/* 댓글 목록 */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      아직 댓글이 없습니다.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 border-l-4 border-indigo-500 p-3 rounded-r-lg">
                        <div className="text-gray-800">{comment.comment_text}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          by {comment.commenter_name} · {format(new Date(comment.created_at), 'M월 d일 HH:mm', { locale: ko })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}