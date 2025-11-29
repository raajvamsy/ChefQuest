-- ================================================
-- MIGRATION 001: CORE TABLES
-- Creates fundamental tables for users, recipes, searches
-- ================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For similarity searches

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  picture_url TEXT,
  diet_preference TEXT CHECK (diet_preference IN ('veg', 'non-veg', 'vegan', 'any')),
  
  -- Location data
  location_country TEXT,
  location_city TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  timezone TEXT,
  
  -- Preferences
  use_local_ingredients BOOLEAN DEFAULT FALSE,
  use_metric_units BOOLEAN DEFAULT TRUE,
  
  -- Analytics fields
  total_searches INTEGER DEFAULT 0,
  total_recipes_viewed INTEGER DEFAULT 0,
  total_recipes_cooked INTEGER DEFAULT 0,
  total_recipes_completed INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_location ON users(location_country, location_city);

-- ================================================
-- SEARCH QUERIES TABLE
-- ================================================
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Search details
  query_text TEXT NOT NULL,
  diet_filter TEXT,
  
  -- Gemini API details
  gemini_model_used TEXT,
  gemini_tokens_used INTEGER,
  response_time_ms INTEGER,
  
  -- Results
  recipes_count INTEGER DEFAULT 0,
  recipes_generated JSONB,
  
  -- Session tracking
  session_id TEXT,
  device_info JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX idx_search_queries_query_text ON search_queries USING gin(to_tsvector('english', query_text));

-- ================================================
-- RECIPES TABLE
-- ================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  title TEXT NOT NULL,
  title_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title)) STORED,
  description TEXT,
  
  -- Recipe metadata
  time_minutes INTEGER,
  calories INTEGER,
  servings INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cuisine_type TEXT,
  diet_type TEXT,
  
  -- Full recipe data
  ingredients JSONB,
  steps JSONB,
  image_prompt TEXT,
  
  -- Gemini generation info
  gemini_model TEXT,
  gemini_temperature REAL,
  
  -- Popularity metrics
  view_count INTEGER DEFAULT 0,
  cook_start_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  avg_rating REAL,
  
  -- For ML training
  is_user_rated BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_title_vector ON recipes USING gin(title_vector);
CREATE INDEX idx_recipes_view_count ON recipes(view_count DESC);
CREATE INDEX idx_recipes_completion_count ON recipes(completion_count DESC);
CREATE INDEX idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX idx_recipes_diet_type ON recipes(diet_type);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);

-- ================================================
-- USER RECIPE INTERACTIONS TABLE
-- ================================================
CREATE TABLE user_recipe_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  search_query_id UUID REFERENCES search_queries(id) ON DELETE SET NULL,
  
  -- Interaction type
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'viewed', 'saved', 'prepare_started', 'cook_started', 'completed', 'abandoned'
  )),
  
  -- Context
  source TEXT,
  position_in_results INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uri_user_id ON user_recipe_interactions(user_id);
CREATE INDEX idx_uri_recipe_id ON user_recipe_interactions(recipe_id);
CREATE INDEX idx_uri_interaction_type ON user_recipe_interactions(interaction_type);
CREATE INDEX idx_uri_created_at ON user_recipe_interactions(created_at DESC);
CREATE UNIQUE INDEX idx_uri_user_recipe_saved ON user_recipe_interactions(user_id, recipe_id, interaction_type) 
  WHERE interaction_type = 'saved';

-- ================================================
-- USER PREFERENCES TABLE
-- ================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Dietary preferences
  default_diet TEXT CHECK (default_diet IN ('veg', 'non-veg', 'vegan', 'any')),
  allergens TEXT[],
  
  -- Cooking preferences
  preferred_cuisines TEXT[],
  preferred_difficulty TEXT[],
  max_cooking_time_minutes INTEGER,
  
  -- Notification preferences
  enable_notifications BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
