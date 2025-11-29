-- ================================================
-- MIGRATION 002: COOKING SESSIONS & TRACKING
-- Creates tables for tracking active cooking sessions
-- ================================================

-- ================================================
-- COOKING SESSIONS TABLE
-- ================================================
CREATE TABLE cooking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Session details
  session_status TEXT CHECK (session_status IN ('in_progress', 'completed', 'abandoned')),
  current_step INTEGER,
  total_steps INTEGER,
  
  -- Adaptive task tracking
  original_steps_count INTEGER NOT NULL,
  current_steps JSONB NOT NULL,
  steps_added INTEGER DEFAULT 0,
  steps_modified INTEGER DEFAULT 0,
  steps_skipped INTEGER DEFAULT 0,
  
  -- Recipe modifications
  servings_adjusted BOOLEAN DEFAULT FALSE,
  adjusted_servings INTEGER,
  ingredients_modified BOOLEAN DEFAULT FALSE,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_duration_minutes INTEGER,
  paused_duration_minutes INTEGER DEFAULT 0,
  
  -- Quality metrics
  ai_validations_count INTEGER DEFAULT 0,
  ai_validations_passed INTEGER DEFAULT 0,
  ai_validations_failed INTEGER DEFAULT 0,
  corrective_steps_added INTEGER DEFAULT 0,
  
  -- Context
  cooking_alone BOOLEAN,
  interruptions_count INTEGER DEFAULT 0,
  
  -- User feedback
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  would_cook_again BOOLEAN,
  
  -- Photos
  final_dish_image_url TEXT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cooking_sessions_user_id ON cooking_sessions(user_id);
CREATE INDEX idx_cooking_sessions_recipe_id ON cooking_sessions(recipe_id);
CREATE INDEX idx_cooking_sessions_status ON cooking_sessions(session_status);
CREATE INDEX idx_cooking_sessions_started_at ON cooking_sessions(started_at DESC);

-- ================================================
-- STEP VALIDATIONS TABLE
-- ================================================
CREATE TABLE step_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooking_session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Step info
  step_number INTEGER NOT NULL,
  step_instruction TEXT NOT NULL,
  
  -- Validation details
  image_url TEXT,
  image_data_size_kb INTEGER,
  
  -- AI analysis
  gemini_model TEXT,
  validation_result TEXT NOT NULL,
  validation_status TEXT CHECK (validation_status IN ('pass', 'fail', 'uncertain')),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  
  -- Outcome
  corrective_action_needed BOOLEAN DEFAULT FALSE,
  corrective_steps_added JSONB,
  
  -- Timing
  validation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_step_validations_cooking_session ON step_validations(cooking_session_id);
CREATE INDEX idx_step_validations_recipe ON step_validations(recipe_id);
CREATE INDEX idx_step_validations_status ON step_validations(validation_status);

-- ================================================
-- COOKING STEP TIMES TABLE
-- ================================================
CREATE TABLE cooking_step_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooking_session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Step details
  step_number INTEGER NOT NULL,
  step_instruction TEXT NOT NULL,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Comparison to estimate
  estimated_duration_seconds INTEGER,
  time_variance_seconds INTEGER,
  
  -- Step outcome
  completed_successfully BOOLEAN,
  needed_retry BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  
  -- Notes
  user_notes TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_step_times_session ON cooking_step_times(cooking_session_id);
CREATE INDEX idx_step_times_recipe ON cooking_step_times(recipe_id);
CREATE INDEX idx_step_times_user ON cooking_step_times(user_id);

-- ================================================
-- KITCHEN TOOLS IDENTIFIED TABLE
-- ================================================
CREATE TABLE kitchen_tools_identified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cooking_session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  
  -- Identified tools
  tools JSONB NOT NULL,
  
  -- Image details
  image_url TEXT,
  confidence_scores JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kitchen_tools_user_id ON kitchen_tools_identified(user_id);
CREATE INDEX idx_kitchen_tools_session_id ON kitchen_tools_identified(cooking_session_id);
