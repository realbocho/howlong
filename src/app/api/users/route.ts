import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/users - 모든 사용자 조회
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')  
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/users - 새 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 })
    }

    const trimmedName = name.trim()

    // 중복 닉네임 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', trimmedName)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: '이미 존재하는 닉네임입니다.' }, { status: 400 })
    }

    // 새 사용자 생성
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ name: trimmedName }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}