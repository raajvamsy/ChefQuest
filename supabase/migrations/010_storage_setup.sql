-- ================================================
-- MIGRATION 010: STORAGE BUCKETS SETUP
-- Create storage buckets and policies
-- ================================================

-- Note: Storage buckets are typically created via Supabase Dashboard or API
-- This file documents the required buckets

-- Required buckets:
-- 1. recipe-images (public)
-- 2. step-validation-images (private)
-- 3. kitchen-tools-images (private)
-- 4. user-avatars (public)
-- 5. failure-evidence-images (private)

-- These can be created via the Supabase Dashboard or with the following API calls
-- We'll create a helper function to document this

-- Storage policies should be:

-- recipe-images: Public read, authenticated write
-- step-validation-images: User can only access their own
-- kitchen-tools-images: User can only access their own
-- user-avatars: Public read, user can only update their own
-- failure-evidence-images: User can only access their own

-- Note: Execute these in Supabase Dashboard > Storage or via supabase CLI
