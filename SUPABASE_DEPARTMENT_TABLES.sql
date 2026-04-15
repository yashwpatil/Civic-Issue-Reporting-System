-- ============================================================================
-- DROP EXISTING TABLES - Run this FIRST
-- ============================================================================
-- WARNING: This will delete all existing data in complaints and remarks!
-- If you need to backup, export first.

-- Drop issue_remarks first (foreign key dependency)
DROP TABLE IF EXISTS issue_remarks CASCADE;

-- Drop complaints table
DROP TABLE IF EXISTS complaints CASCADE;

-- ============================================================================
-- CREATE DEPARTMENT-SPECIFIC COMPLAINT TABLES
-- ============================================================================

-- 1.1 WATER COMPLAINTS TABLE
CREATE TABLE water_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  image_url TEXT,
  audio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  resolution_proof_url TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_water_complaints_user_id ON water_complaints(user_id);
CREATE INDEX idx_water_complaints_status ON water_complaints(status);
CREATE INDEX idx_water_complaints_priority ON water_complaints(priority);
CREATE INDEX idx_water_complaints_created_at ON water_complaints(created_at DESC);
CREATE INDEX idx_water_complaints_resolved_at ON water_complaints(resolved_at);

-- 1.2 ROADS COMPLAINTS TABLE
CREATE TABLE roads_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  image_url TEXT,
  audio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  resolution_proof_url TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_roads_complaints_user_id ON roads_complaints(user_id);
CREATE INDEX idx_roads_complaints_status ON roads_complaints(status);
CREATE INDEX idx_roads_complaints_priority ON roads_complaints(priority);
CREATE INDEX idx_roads_complaints_created_at ON roads_complaints(created_at DESC);
CREATE INDEX idx_roads_complaints_resolved_at ON roads_complaints(resolved_at);

-- 1.3 ELECTRICITY COMPLAINTS TABLE
CREATE TABLE electricity_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  image_url TEXT,
  audio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  resolution_proof_url TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_electricity_complaints_user_id ON electricity_complaints(user_id);
CREATE INDEX idx_electricity_complaints_status ON electricity_complaints(status);
CREATE INDEX idx_electricity_complaints_priority ON electricity_complaints(priority);
CREATE INDEX idx_electricity_complaints_created_at ON electricity_complaints(created_at DESC);
CREATE INDEX idx_electricity_complaints_resolved_at ON electricity_complaints(resolved_at);

-- 1.4 GARBAGE COMPLAINTS TABLE
CREATE TABLE garbage_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  image_url TEXT,
  audio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  resolution_proof_url TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_garbage_complaints_user_id ON garbage_complaints(user_id);
CREATE INDEX idx_garbage_complaints_status ON garbage_complaints(status);
CREATE INDEX idx_garbage_complaints_priority ON garbage_complaints(priority);
CREATE INDEX idx_garbage_complaints_created_at ON garbage_complaints(created_at DESC);
CREATE INDEX idx_garbage_complaints_resolved_at ON garbage_complaints(resolved_at);

-- ============================================================================
-- RECREATE ISSUE REMARKS TABLE (Department-Agnostic)
-- ============================================================================

CREATE TABLE issue_remarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL CHECK (department IN ('water', 'roads', 'electricity', 'garbage')),
  complaint_id UUID NOT NULL,
  remark TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_issue_remarks_department ON issue_remarks(department);
CREATE INDEX idx_issue_remarks_complaint_id ON issue_remarks(complaint_id);
CREATE INDEX idx_issue_remarks_user_id ON issue_remarks(user_id);

-- ============================================================================
-- ENABLE RLS ON DEPARTMENT-SPECIFIC TABLES
-- ============================================================================

ALTER TABLE water_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE roads_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE garbage_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_remarks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE POLICIES FOR WATER COMPLAINTS
-- ============================================================================

-- Users can view all water complaints
CREATE POLICY "Anyone can view water complaints" ON water_complaints
FOR SELECT USING (true);

-- Users can create water complaints
CREATE POLICY "Users can create water complaints" ON water_complaints
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own water complaints
CREATE POLICY "Users can update their own water complaints" ON water_complaints
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Water department can update water complaints
CREATE POLICY "Water department can update water complaints" ON water_complaints
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'department' AND department_code = 'water')
);

-- ============================================================================
-- CREATE POLICIES FOR ROADS COMPLAINTS
-- ============================================================================

-- Users can view all roads complaints
CREATE POLICY "Anyone can view roads complaints" ON roads_complaints
FOR SELECT USING (true);

-- Users can create roads complaints
CREATE POLICY "Users can create roads complaints" ON roads_complaints
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own roads complaints
CREATE POLICY "Users can update their own roads complaints" ON roads_complaints
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Roads department can update roads complaints
CREATE POLICY "Roads department can update roads complaints" ON roads_complaints
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'department' AND department_code = 'roads')
);

-- ============================================================================
-- CREATE POLICIES FOR ELECTRICITY COMPLAINTS
-- ============================================================================

-- Users can view all electricity complaints
CREATE POLICY "Anyone can view electricity complaints" ON electricity_complaints
FOR SELECT USING (true);

-- Users can create electricity complaints
CREATE POLICY "Users can create electricity complaints" ON electricity_complaints
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own electricity complaints
CREATE POLICY "Users can update their own electricity complaints" ON electricity_complaints
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Electricity department can update electricity complaints
CREATE POLICY "Electricity department can update electricity complaints" ON electricity_complaints
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'department' AND department_code = 'electricity')
);

-- ============================================================================
-- CREATE POLICIES FOR GARBAGE COMPLAINTS
-- ============================================================================

-- Users can view all garbage complaints
CREATE POLICY "Anyone can view garbage complaints" ON garbage_complaints
FOR SELECT USING (true);

-- Users can create garbage complaints
CREATE POLICY "Users can create garbage complaints" ON garbage_complaints
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own garbage complaints
CREATE POLICY "Users can update their own garbage complaints" ON garbage_complaints
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Garbage department can update garbage complaints
CREATE POLICY "Garbage department can update garbage complaints" ON garbage_complaints
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'department' AND department_code = 'garbage')
);

-- ============================================================================
-- CREATE POLICIES FOR ISSUE REMARKS
-- ============================================================================

CREATE POLICY "Anyone can view remarks" ON issue_remarks
FOR SELECT USING (true);

CREATE POLICY "Anyone can add remarks" ON issue_remarks
FOR INSERT WITH CHECK (true);

-- ============================================================================
-- HELPER QUERIES FOR ANALYTICS
-- ============================================================================

-- 1. GET ALL WATER COMPLAINTS WITH STATS
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_resolution_days
FROM water_complaints;

-- 2. GET ALL ROADS COMPLAINTS WITH STATS
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_resolution_days
FROM roads_complaints;

-- 3. GET ALL ELECTRICITY COMPLAINTS WITH STATS
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_resolution_days
FROM electricity_complaints;

-- 4. GET ALL GARBAGE COMPLAINTS WITH STATS
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_resolution_days
FROM garbage_complaints;

-- 5. GET COMPLAINTS BY PRIORITY (WATER)
SELECT 
  priority,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
FROM water_complaints
GROUP BY priority
ORDER BY total DESC;

-- 6. GET COMPLAINTS BY PRIORITY (ROADS)
SELECT 
  priority,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
FROM roads_complaints
GROUP BY priority
ORDER BY total DESC;

-- 7. GET COMPLAINTS BY PRIORITY (ELECTRICITY)
SELECT 
  priority,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
FROM electricity_complaints
GROUP BY priority
ORDER BY total DESC;

-- 8. GET COMPLAINTS BY PRIORITY (GARBAGE)
SELECT 
  priority,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
FROM garbage_complaints
GROUP BY priority
ORDER BY total DESC;

-- 9. GET DEPARTMENT COMPARISON
SELECT 
  'water' as department,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_days
FROM water_complaints
UNION ALL
SELECT 
  'roads' as department,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_days
FROM roads_complaints
UNION ALL
SELECT 
  'electricity' as department,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_days
FROM electricity_complaints
UNION ALL
SELECT 
  'garbage' as department,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_days
FROM garbage_complaints;
