import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/comments/[userId] - 특정 사용자의 댓글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/comments/[userId] - 특정 사용자에게 댓글 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { commenterName, commentText } = await request.json()

    if (!commenterName || !commentText) {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    }

    if (commentText.trim().length === 0) {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        user_id: userId,
        commenter_name: commenterName.trim(),
        comment_text: commentText.trim()
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}