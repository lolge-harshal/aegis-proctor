-- ============================================================
-- Add role column to profiles table
-- ============================================================

-- Create the user_role enum
CREATE TYPE user_role AS ENUM ('admin', 'proctor', 'candidate');

-- Add role column to profiles, defaulting to 'proctor' for existing rows
ALTER TABLE public.profiles
  ADD COLUMN role user_role NOT NULL DEFAULT 'proctor';

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON public.profiles(role);
