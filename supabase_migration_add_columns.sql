-- ============================================================
-- Migration: Add missing columns to match application schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ============================================================
-- NOTE: PostgreSQL folds unquoted identifiers to lowercase.
-- All column names here are lowercase to match convention.

-- 1. TRANSACTIONS — add columns the app depends on
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS vendor TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_no TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS projectid TEXT DEFAULT '';

-- 2. EMPLOYEES — add columns the app depends on
ALTER TABLE employees ADD COLUMN IF NOT EXISTS wage DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS wage_type TEXT DEFAULT 'daily';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'permanent';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_end_date TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS overtime_rate_multiplier DECIMAL(4, 2) DEFAULT 1.5;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS project_ids TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 3. BUDGETS — ensure projectid column exists
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS projectid TEXT DEFAULT '';

-- 4. PONDS — add extra columns the app uses
-- The original schema already had: name, area, shrimptype, farmingtype,
-- targetdensity, seedamount, expectedcount, watersource, currentstock,
-- status, stockingdate, created_at
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS length DECIMAL(8, 2) DEFAULT 0;
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS width DECIMAL(8, 2) DEFAULT 0;
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS currentphase TEXT DEFAULT '';
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS currentstage TEXT DEFAULT 'planning';
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS cycleday INTEGER DEFAULT 0;
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS linkedprojectid TEXT;

-- Verify
SELECT 'Migration complete — all columns added!' AS result;
