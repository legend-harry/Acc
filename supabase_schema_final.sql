-- Drop existing tables to start fresh
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS ponds CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 1. Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Aquaculture Ponds
CREATE TABLE ponds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  area DECIMAL(8, 2),
  shrimpType TEXT,
  farmingType TEXT,
  targetDensity INTEGER,
  seedAmount INTEGER,
  expectedCount INTEGER,
  waterSource TEXT,
  currentStock INTEGER,
  status TEXT DEFAULT 'active',
  stockingDate TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  pondId TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Finance Budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  projectId TEXT
);

-- 6. HR Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  salary DECIMAL(12, 2) NOT NULL
);

-- 7. HR Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL
);

------------------------------------------------------------------
-- RLS CONFIGURATION (Temporarily Relaxed for Client-Context Auth)
------------------------------------------------------------------

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policy allowing any frontend request that manually specifies the client_id
-- Once you integrate proper Supabase Auth, you will change "true" to "auth.uid() IS NOT NULL"
CREATE POLICY "Allow anon select based on client_id" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow anon insert based on client_id" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update based on client_id" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete based on client_id" ON projects FOR DELETE USING (true);

CREATE POLICY "Allow anon select based on client_id" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow anon insert based on client_id" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update based on client_id" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete based on client_id" ON transactions FOR DELETE USING (true);

CREATE POLICY "Allow anon select based on client_id" ON ponds FOR SELECT USING (true);
CREATE POLICY "Allow anon insert based on client_id" ON ponds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update based on client_id" ON ponds FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete based on client_id" ON ponds FOR DELETE USING (true);

CREATE POLICY "Allow anon select based on client_id" ON alerts FOR SELECT USING (true);
CREATE POLICY "Allow anon insert based on client_id" ON alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update based on client_id" ON alerts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete based on client_id" ON alerts FOR DELETE USING (true);

CREATE POLICY "Allow anon select based on client_id" ON budgets FOR SELECT USING (true);
CREATE POLICY "Allow anon insert based on client_id" ON budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update based on client_id" ON budgets FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete based on client_id" ON budgets FOR DELETE USING (true);

CREATE POLICY "Allow anon select based on client_id" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow anon insert based on client_id" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update based on client_id" ON employees FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete based on client_id" ON employees FOR DELETE USING (true);

CREATE POLICY "Allow anon select based on client_id" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow anon insert based on client_id" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update based on client_id" ON attendance FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete based on client_id" ON attendance FOR DELETE USING (true);
