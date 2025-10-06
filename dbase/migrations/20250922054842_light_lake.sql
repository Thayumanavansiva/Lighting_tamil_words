/*
# Initial Tamil Word Game Database Schema

1. New Tables
   - `users` - User authentication and profile data
   - `words` - Tamil extinct words database
   - `game_sessions` - Game play history and scores
   - `assignments` - Teacher assignments to students
   - `word_requests` - Teacher word submission requests
   - `achievements` - User achievements and badges

2. Security
   - Enable RLS on all tables
   - Add policies for role-based access control
   - Secure student data from unauthorized access

3. Features
   - Point system for gamification
   - Multi-role user management
   - Word approval workflow
   - Assignment system for teachers
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  avatar_url text,
  school_name text,
  grade text,
  teacher_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Words table
CREATE TABLE IF NOT EXISTS words (
  id serial PRIMARY KEY,
  word text NOT NULL UNIQUE,
  meaning_ta text,
  meaning_en text,
  domain text,
  period text,
  modern_equivalent text,
  status text,
  notes text,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  approved boolean DEFAULT false
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  game_type text NOT NULL CHECK (game_type IN ('match', 'mcq', 'jumbled', 'hints')),
  score integer DEFAULT 0,
  max_score integer NOT NULL,
  questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  difficulty_level text DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  completed_at timestamptz DEFAULT now()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) NOT NULL,
  title text NOT NULL,
  description text,
  word_ids integer[] DEFAULT '{}',
  game_types text[] DEFAULT '{}',
  assigned_students uuid[] DEFAULT '{}',
  due_date timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at timestamptz DEFAULT now()
);

-- Word requests table
CREATE TABLE IF NOT EXISTS word_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) NOT NULL,
  word text NOT NULL,
  meaning_ta text NOT NULL,
  meaning_en text,
  domain text,
  period text,
  modern_equivalent text,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  title text NOT NULL,
  description text,
  points_awarded integer DEFAULT 0,
  category text DEFAULT 'games' CHECK (category IN ('games', 'learning', 'social', 'special')),
  unlocked_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teachers can read their students" ON users FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'teacher') AND teacher_id = auth.uid()
);
CREATE POLICY "Admins can read all users" ON users FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Words policies
CREATE POLICY "Everyone can read approved words" ON words FOR SELECT USING (approved = true);
CREATE POLICY "Teachers and admins can read all words" ON words FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('teacher', 'admin'))
);
CREATE POLICY "Admins can manage words" ON words FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Game sessions policies
CREATE POLICY "Users can read own sessions" ON game_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sessions" ON game_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers can read student sessions" ON game_sessions FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE teacher_id = auth.uid())
);

-- Assignments policies
CREATE POLICY "Teachers can manage own assignments" ON assignments FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students can read their assignments" ON assignments FOR SELECT USING (
  auth.uid() = ANY(assigned_students)
);

-- Word requests policies
CREATE POLICY "Teachers can manage own requests" ON word_requests FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admins can manage all requests" ON word_requests FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Achievements policies
CREATE POLICY "Users can read own achievements" ON achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert achievements" ON achievements FOR INSERT WITH CHECK (true);

-- Insert sample words
INSERT INTO words (word, meaning_ta, meaning_en, domain, period, modern_equivalent, status, notes, created_by, approved) VALUES
('படி', 'அளவுக் குடுவை (கோரையால்/மரத்தால்)', 'Padi: dry/volume measure', 'Volume', 'Classical/Medieval', 'லிட்டர்', 'traditional; still seen rurally', '2 உறி = 1 படி', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), true),
('குறணி', 'அளவுக் கருவி', 'Small measure unit', 'Volume', 'Classical', 'மில்லிலிட்டர்', 'extinct', 'குறிய அளவு', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), true),
('நாழிகை', 'காலஅளவு', 'Time measurement unit', 'Time', 'Ancient', 'நிமிடம்', 'extinct', '24 நிமிடங்கள்', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), true),
('கलம்', 'நீர் சேமிப்பு பாத்திரம்', 'Water storage vessel', 'Container', 'Medieval', 'தொட்டி', 'rare', 'பெரிய பானை', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), true),
('வளை', 'கை அணி', 'Hand ornament', 'Jewelry', 'Classical', 'வளையல்', 'traditional', 'கையில் அணியும் அணி', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), true);