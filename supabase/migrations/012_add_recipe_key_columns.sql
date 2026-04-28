-- Migration 012: Add recipe_key TEXT column to all interaction/session tables
-- Background: recipes use deterministic slug-hash IDs (TEXT), but old schema used UUID.
-- This migration adds recipe_key TEXT as the primary join column for string-based IDs,
-- and relaxes constraints so both UUID and TEXT-based recipe references work.

-- =============================================
-- user_recipe_interactions
-- =============================================
ALTER TABLE user_recipe_interactions
  ADD COLUMN IF NOT EXISTS recipe_key TEXT;

-- Drop the FK constraint on recipe_id so NULL / mismatched UUIDs don't block inserts.
-- We retain recipe_id for backwards compatibility but don't enforce FK anymore.
ALTER TABLE user_recipe_interactions
  DROP CONSTRAINT IF EXISTS user_recipe_interactions_recipe_id_fkey;

-- Index on recipe_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_uri_recipe_key ON user_recipe_interactions(recipe_key);

-- =============================================
-- cooking_sessions
-- =============================================
ALTER TABLE cooking_sessions
  ADD COLUMN IF NOT EXISTS recipe_key TEXT;

ALTER TABLE cooking_sessions
  DROP CONSTRAINT IF EXISTS cooking_sessions_recipe_id_fkey;

CREATE INDEX IF NOT EXISTS idx_cs_recipe_key ON cooking_sessions(recipe_key);

-- =============================================
-- step_validations
-- =============================================
ALTER TABLE step_validations
  DROP CONSTRAINT IF EXISTS step_validations_recipe_id_fkey;

-- =============================================
-- cooking_step_times
-- =============================================
ALTER TABLE cooking_step_times
  DROP CONSTRAINT IF EXISTS cooking_step_times_recipe_id_fkey;

-- =============================================
-- recipes table — support TEXT id inserts
-- =============================================
-- Add a recipe_key TEXT column as alternate lookup key for slug-hash IDs.
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS recipe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_recipe_key ON recipes(recipe_key)
  WHERE recipe_key IS NOT NULL;
