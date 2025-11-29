-- ================================================
-- MIGRATION 005: NUTRITION TRACKING
-- Daily nutrition logs and meal tracking
-- ================================================

-- ================================================
-- DAILY NUTRITION LOG TABLE
-- ================================================
CREATE TABLE daily_nutrition_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Aggregate nutrition
  total_calories INTEGER DEFAULT 0,
  total_protein_g DECIMAL(10, 2) DEFAULT 0,
  total_carbs_g DECIMAL(10, 2) DEFAULT 0,
  total_fat_g DECIMAL(10, 2) DEFAULT 0,
  total_fiber_g DECIMAL(10, 2) DEFAULT 0,
  total_sugar_g DECIMAL(10, 2) DEFAULT 0,
  
  -- User goals
  calorie_goal INTEGER,
  protein_goal_g DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_nutrition_log_user_date ON daily_nutrition_log(user_id, date DESC);

-- ================================================
-- NUTRITION LOG ENTRIES TABLE
-- ================================================
CREATE TABLE nutrition_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID REFERENCES daily_nutrition_log(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  cooking_session_id UUID REFERENCES cooking_sessions(id) ON DELETE SET NULL,
  
  -- Meal details
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_time TIMESTAMPTZ NOT NULL,
  
  -- Servings consumed
  servings_consumed DECIMAL(10, 2) DEFAULT 1.0,
  
  -- Nutrition breakdown
  calories INTEGER,
  protein_g DECIMAL(10, 2),
  carbs_g DECIMAL(10, 2),
  fat_g DECIMAL(10, 2),
  fiber_g DECIMAL(10, 2),
  sugar_g DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_entries_daily_log ON nutrition_log_entries(daily_log_id);
CREATE INDEX idx_nutrition_entries_user ON nutrition_log_entries(user_id);
CREATE INDEX idx_nutrition_entries_recipe ON nutrition_log_entries(recipe_id);
