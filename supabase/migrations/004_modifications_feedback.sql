-- ================================================
-- MIGRATION 004: MODIFICATIONS & FEEDBACK
-- Tracking recipe changes, substitutions, failures
-- ================================================

-- ================================================
-- RECIPE MODIFICATIONS TABLE
-- ================================================
CREATE TABLE recipe_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  cooking_session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  
  modification_type TEXT CHECK (modification_type IN (
    'servings_adjusted',
    'ingredient_substituted',
    'ingredient_removed',
    'ingredient_added',
    'step_modified',
    'step_skipped',
    'cooking_time_adjusted',
    'other'
  )),
  
  -- Modification details
  original_value JSONB,
  modified_value JSONB,
  reason TEXT,
  
  -- Was it successful?
  outcome TEXT CHECK (outcome IN ('success', 'failed', 'unknown')),
  user_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modifications_user ON recipe_modifications(user_id);
CREATE INDEX idx_modifications_recipe ON recipe_modifications(recipe_id);
CREATE INDEX idx_modifications_type ON recipe_modifications(modification_type);
CREATE INDEX idx_modifications_outcome ON recipe_modifications(outcome);

-- ================================================
-- INGREDIENT SUBSTITUTIONS TRACKER TABLE
-- ================================================
CREATE TABLE ingredient_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  cooking_session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  
  -- Substitution details
  original_ingredient TEXT NOT NULL,
  original_quantity DECIMAL(10, 2),
  original_unit TEXT,
  
  substitute_ingredient TEXT NOT NULL,
  substitute_quantity DECIMAL(10, 2),
  substitute_unit TEXT,
  
  -- Context
  reason TEXT CHECK (reason IN (
    'allergy',
    'dietary_preference',
    'not_available',
    'cost',
    'taste_preference',
    'health',
    'local_alternative',
    'other'
  )),
  user_notes TEXT,
  
  -- AI suggestion or user's own?
  suggested_by TEXT CHECK (suggested_by IN ('ai', 'user', 'community')),
  
  -- Outcome
  success_rating INTEGER CHECK (success_rating BETWEEN 1 AND 5),
  would_use_again BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_substitutions_user ON ingredient_substitutions(user_id);
CREATE INDEX idx_substitutions_recipe ON ingredient_substitutions(recipe_id);
CREATE INDEX idx_substitutions_original ON ingredient_substitutions(original_ingredient);
CREATE INDEX idx_substitutions_substitute ON ingredient_substitutions(substitute_ingredient);
CREATE INDEX idx_substitutions_reason ON ingredient_substitutions(reason);

-- ================================================
-- RECIPE SERVINGS ADJUSTMENTS LOG TABLE
-- ================================================
CREATE TABLE recipe_serving_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  cooking_session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  
  -- Adjustment details
  original_servings INTEGER NOT NULL,
  adjusted_servings INTEGER NOT NULL,
  scaling_factor DECIMAL(10, 4),
  
  -- Adjusted recipe data
  adjusted_ingredients JSONB NOT NULL,
  adjusted_nutrition JSONB,
  
  -- Notes about the adjustment
  user_notes TEXT,
  
  -- Was the scaled recipe successful?
  outcome TEXT CHECK (outcome IN ('success', 'partial', 'failed', 'not_rated')),
  outcome_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_serving_adjustments_user ON recipe_serving_adjustments(user_id);
CREATE INDEX idx_serving_adjustments_recipe ON recipe_serving_adjustments(recipe_id);

-- ================================================
-- RECIPE FAILURE FEEDBACK TABLE
-- ================================================
CREATE TABLE recipe_failure_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  cooking_session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  
  -- Failure details
  failure_stage TEXT CHECK (failure_stage IN (
    'preparation',
    'cooking',
    'assembly',
    'plating',
    'taste',
    'texture',
    'appearance',
    'overall'
  )),
  
  failure_type TEXT CHECK (failure_type IN (
    'instructions_unclear',
    'wrong_timing',
    'wrong_temperature',
    'missing_ingredient',
    'substitution_failed',
    'equipment_issue',
    'taste_bad',
    'burned',
    'undercooked',
    'wrong_consistency',
    'too_difficult',
    'too_time_consuming',
    'other'
  )),
  
  -- Detailed feedback
  description TEXT NOT NULL,
  what_went_wrong TEXT,
  what_was_expected TEXT,
  
  -- Evidence
  failure_image_urls TEXT[],
  
  -- Context
  followed_instructions_exactly BOOLEAN,
  made_substitutions BOOLEAN,
  adjusted_servings BOOLEAN,
  
  -- AI analysis
  ai_analysis TEXT,
  ai_suggestions TEXT,
  
  -- Resolution
  attempted_fix BOOLEAN DEFAULT FALSE,
  fix_successful BOOLEAN,
  fix_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_failure_feedback_user ON recipe_failure_feedback(user_id);
CREATE INDEX idx_failure_feedback_recipe ON recipe_failure_feedback(recipe_id);
CREATE INDEX idx_failure_feedback_type ON recipe_failure_feedback(failure_type);
CREATE INDEX idx_failure_feedback_stage ON recipe_failure_feedback(failure_stage);
