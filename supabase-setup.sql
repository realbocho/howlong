-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Records 테이블
CREATE TABLE IF NOT EXISTS study_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(4,1) NOT NULL CHECK (hours >= 0 AND hours <= 24),
    photo_url TEXT,
    is_part_of_batch BOOLEAN DEFAULT FALSE,
    batch_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Comments 테이블
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    commenter_name VARCHAR(255) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_study_records_user_id ON study_records(user_id);
CREATE INDEX IF NOT EXISTS idx_study_records_date ON study_records(date);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Study records are viewable by everyone" ON study_records FOR SELECT USING (true);
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);

-- 사용자는 자신의 데이터만 삽입/수정/삭제 가능
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);

CREATE POLICY "Users can insert their own study records" ON study_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own study records" ON study_records FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own study records" ON study_records FOR DELETE USING (true);

CREATE POLICY "Anyone can insert comments" ON comments FOR INSERT WITH CHECK (true);

-- Storage 버킷 생성 (증거사진용)
INSERT INTO storage.buckets (id, name, public) VALUES ('study-photos', 'study-photos', true);

-- Storage 정책 설정
CREATE POLICY "Anyone can upload study photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'study-photos');
CREATE POLICY "Anyone can view study photos" ON storage.objects FOR SELECT USING (bucket_id = 'study-photos');
CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING (bucket_id = 'study-photos');