import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export interface User {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface StudyRecord {
  id: string
  user_id: string
  date: string
  hours: number
  photo_url?: string
  is_part_of_batch: boolean
  batch_timestamp?: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  commenter_name: string
  comment_text: string
  created_at: string
}

export interface UserStats {
  user_id: string
  name: string
  total_hours: number
  average_hours: number
  study_days: number
  rank: number
}