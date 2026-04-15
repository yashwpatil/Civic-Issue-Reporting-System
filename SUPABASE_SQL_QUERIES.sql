-- ============================================================================
-- CIVIC HUB SUPABASE DATABASE SETUP
-- ============================================================================
-- Copy and paste these queries one by one into Supabase SQL Editor
-- Execute in the order shown below

-- ============================================================================
-- PART 1: CREATE TABLES
-- ============================================================================

-- 1.1 CREATE USERS TABLE
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('user', 'admin', 'department')),
  department_code TEXT CHECK (department_code IN ('water', 'roads', 'electricity', 'garbage')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_users_department_code ON users(department_code);

-- 1.2 CREATE DEPARTMENTS TABLE
CREATE TABLE departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL CHECK (code IN ('water', 'roads', 'electricity', 'garbage')),
  name TEXT NOT NULL,
  description TEXT,
  email TEXT UNIQUE NOT NULL,
  aliases TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_departments_code ON departments(code);

-- 1.3 CREATE COMPLAINTS TABLE
CREATE TABLE complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('garbage', 'roads', 'water', 'electricity', 'other')),
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  image_url TEXT,
  audio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_department TEXT CHECK (assigned_department IN ('water', 'roads', 'electricity', 'garbage')),
  contact_email TEXT,
  contact_phone TEXT,
  resolution_proof_url TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_assigned_department ON complaints(assigned_department);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX idx_complaints_resolved_at ON complaints(resolved_at);

-- 1.4 CREATE ISSUE REMARKS TABLE
CREATE TABLE issue_remarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  remark TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_issue_remarks_complaint_id ON issue_remarks(complaint_id);
CREATE INDEX idx_issue_remarks_user_id ON issue_remarks(user_id);

-- ============================================================================
-- PART 2: INSERT DEFAULT DATA
-- ============================================================================

-- 2.1 INSERT DEPARTMENTS
INSERT INTO departments (code, name, description, email, aliases) VALUES
('water', 'Water Department', 'Manage water supply, leakage repairs, and pipeline maintenance.', 'water@civic-hub.local', ARRAY['water-dept']),
('roads', 'Road Department', 'Handle pothole fixes, street repairs, and road safety complaints.', 'roads@civic-hub.local', ARRAY['road']),
('electricity', 'Electricity Department', 'Resolve power outages, streetlight issues, and electrical faults.', 'electricity@civic-hub.local', ARRAY['elec']),
('garbage', 'Garbage Department', 'Coordinate waste collection, dumping complaints, and recycling initiatives.', 'garbage@civic-hub.local', ARRAY['waste']);

-- 2.2 INSERT ADMIN USER
INSERT INTO users (email, name, password, type) VALUES
('admin@civichub.com', 'Admin User', 'Admin@123', 'admin');

-- 2.3 INSERT DEPARTMENT USERS
INSERT INTO users (email, name, password, type, department_code) VALUES
('water@civichub.com', 'Water Department', 'DeptWater2024', 'department', 'water'),
('roads@civichub.com', 'Road Department', 'DeptRoads2024', 'department', 'roads'),
('electricity@civichub.com', 'Electricity Department', 'DeptElectricity2024', 'department', 'electricity'),
('garbage@civichub.com', 'Garbage Department', 'DeptGarbage2024', 'department', 'garbage');

-- ============================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- 3.1 ENABLE RLS ON ALL TABLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_remarks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: CREATE POLICIES
-- ============================================================================

-- 4.1 USERS TABLE POLICIES
CREATE POLICY "Anyone can view users" ON users
FOR SELECT USING (true);

CREATE POLICY "Users can see their own data" ON users
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE USING (auth.uid()::text = id::text);

-- 4.2 DEPARTMENTS TABLE POLICIES
CREATE POLICY "Everyone can view departments" ON departments
FOR SELECT USING (true);

-- 4.3 COMPLAINTS TABLE POLICIES
CREATE POLICY "Users can view their own complaints" ON complaints
FOR SELECT USING (
  auth.uid()::text = user_id::text OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
);

CREATE POLICY "Departments can view assigned complaints" ON complaints
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND type = 'department' AND department_code = complaints.assigned_department
  )
);

CREATE POLICY "Admin can view all complaints" ON complaints
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
);

CREATE POLICY "Users can create complaints" ON complaints
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own complaints" ON complaints
FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Departments can update assigned complaints" ON complaints
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND type = 'department' AND department_code = complaints.assigned_department
  )
);

-- 4.4 ISSUE REMARKS TABLE POLICIES
CREATE POLICY "Users can view remarks for their complaints" ON issue_remarks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM complaints 
    WHERE id = complaint_id AND (user_id = auth.uid() OR assigned_department IN (
      SELECT department_code FROM users WHERE id = auth.uid() AND type = 'department'
    ))
  )
);

CREATE POLICY "Anyone can add remarks" ON issue_remarks
FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 5: CREATE STORAGE BUCKETS
-- ============================================================================
-- NOTE: These cannot be created via SQL. Create them in the Supabase Dashboard:
-- 1. Go to Storage
-- 2. Click "Create new bucket" for each:
--    - complaint-images (Public)
--    - complaint-audio (Public)
--    - resolution-proofs (Public)

-- ============================================================================
-- PART 6: HELPER QUERIES FOR DATA ANALYSIS
-- ============================================================================

-- 6.1 GET ALL COMPLAINTS WITH USER INFO
SELECT 
  c.id,
  c.title,
  c.status,
  c.category,
  c.priority,
  u.name as reported_by,
  u.email,
  c.location,
  c.created_at,
  c.resolved_at
FROM complaints c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 6.2 GET COMPLAINTS BY DEPARTMENT
SELECT 
  c.id,
  c.title,
  c.status,
  c.priority,
  c.location,
  COUNT(ir.id) as remark_count,
  c.created_at
FROM complaints c
LEFT JOIN issue_remarks ir ON c.id = ir.complaint_id
WHERE c.assigned_department = 'water'
GROUP BY c.id
ORDER BY c.created_at DESC;

-- 6.3 GET STATISTICS BY DEPARTMENT
SELECT 
  assigned_department,
  COUNT(*) as total_complaints,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_resolution_days
FROM complaints
WHERE assigned_department IS NOT NULL
GROUP BY assigned_department
ORDER BY total_complaints DESC;

-- 6.4 GET AVERAGE RESOLUTION TIME
SELECT 
  assigned_department,
  COUNT(*) as resolved_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/86400)::numeric, 1) as avg_days,
  MIN(resolved_at - reported_at) as min_time,
  MAX(resolved_at - reported_at) as max_time
FROM complaints
WHERE status = 'resolved' AND resolved_at IS NOT NULL
GROUP BY assigned_department
ORDER BY resolved_count DESC;

-- 6.5 GET CLOSURE RATE PERCENTAGE
SELECT 
  assigned_department,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  ROUND((COUNT(CASE WHEN status = 'resolved' THEN 1 END)::numeric / COUNT(*) * 100), 1) as closure_rate_percent
FROM complaints
GROUP BY assigned_department
ORDER BY closure_rate_percent DESC;

-- 6.6 GET USER WITH MOST COMPLAINTS
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(c.id) as complaint_count,
  COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) as resolved_count
FROM users u
LEFT JOIN complaints c ON u.id = c.user_id
WHERE u.type = 'user'
GROUP BY u.id, u.name, u.email
ORDER BY complaint_count DESC
LIMIT 10;

-- 6.7 GET COMPLAINTS BY CATEGORY
SELECT 
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
FROM complaints
GROUP BY category
ORDER BY total DESC;

-- 6.8 GET COMPLAINTS BY PRIORITY
SELECT 
  priority,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
FROM complaints
GROUP BY priority
ORDER BY total DESC;

-- ============================================================================
-- DONE!
-- All tables, policies, and indexes have been created successfully.
-- Create the storage buckets manually in the Supabase Dashboard.
-- ============================================================================
