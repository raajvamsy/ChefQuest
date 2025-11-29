-- ================================================
-- MIGRATION 008: ANALYTICS VIEWS
-- Materialized and regular views for analytics
-- ================================================

-- ================================================
-- VIEW: Popular Recipes
-- ================================================
CREATE MATERIALIZED VIEW popular_recipes AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.time_minutes,
  r.calories,
  r.diet_type,
  r.cuisine_type,
  r.difficulty,
  r.image_prompt,
  r.view_count,
  r.completion_count,
  r.avg_rating,
  -- Popularity score (weighted)
  (r.view_count * 0.3 + r.cook_start_count * 0.5 + r.completion_count * 1.0) as popularity_score
FROM recipes r
WHERE r.view_count > 5
ORDER BY popularity_score DESC, r.created_at DESC;

CREATE INDEX idx_popular_recipes_score ON popular_recipes(popularity_score DESC);
CREATE INDEX idx_popular_recipes_diet_type ON popular_recipes(diet_type);

-- ================================================
-- VIEW: User Engagement Metrics
-- ================================================
CREATE OR REPLACE VIEW user_engagement_metrics AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.total_searches,
  u.total_recipes_viewed,
  u.total_recipes_cooked,
  u.total_recipes_completed,
  CASE 
    WHEN u.total_recipes_cooked > 0 
    THEN (u.total_recipes_completed::REAL / u.total_recipes_cooked::REAL) * 100
    ELSE 0
  END as completion_rate,
  u.created_at,
  u.last_login_at,
  EXTRACT(DAY FROM NOW() - u.last_login_at) as days_since_last_login
FROM users u;

-- ================================================
-- VIEW: Recipe Performance Dashboard
-- ================================================
CREATE OR REPLACE VIEW recipe_performance_dashboard AS
SELECT 
  r.id,
  r.title,
  r.cuisine_type,
  r.difficulty,
  r.diet_type,
  r.view_count,
  r.cook_start_count,
  r.completion_count,
  r.avg_rating,
  CASE 
    WHEN r.cook_start_count > 0 
    THEN (r.completion_count::REAL / r.cook_start_count::REAL) * 100
    ELSE 0
  END as completion_rate,
  COUNT(DISTINCT cs.id) as total_cooking_sessions,
  AVG(cs.total_duration_minutes) as avg_cooking_duration
FROM recipes r
LEFT JOIN cooking_sessions cs ON r.id = cs.recipe_id
GROUP BY r.id;

-- ================================================
-- VIEW: Search Trends
-- ================================================
CREATE OR REPLACE VIEW search_trends AS
SELECT 
  query_text,
  diet_filter,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(recipes_count) as avg_recipes_returned,
  DATE_TRUNC('day', created_at) as search_date
FROM search_queries
GROUP BY query_text, diet_filter, DATE_TRUNC('day', created_at)
ORDER BY search_count DESC;

-- ================================================
-- VIEW: User Kitchen Inventory Summary
-- ================================================
CREATE OR REPLACE VIEW user_inventory_summary AS
SELECT 
  u.id as user_id,
  u.name,
  COUNT(CASE WHEN inventory_type = 'ingredient' THEN 1 END) as total_ingredients,
  COUNT(CASE WHEN inventory_type = 'tool' THEN 1 END) as total_tools,
  COUNT(CASE WHEN inventory_type = 'ingredient' AND expiry_date < CURRENT_DATE THEN 1 END) as expired_ingredients,
  COUNT(CASE WHEN inventory_type = 'ingredient' AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as expiring_soon
FROM users u
LEFT JOIN user_kitchen_inventory uki ON u.id = uki.user_id
GROUP BY u.id, u.name;

-- ================================================
-- VIEW: Popular Substitutions
-- ================================================
CREATE OR REPLACE VIEW popular_substitutions AS
SELECT 
  original_ingredient,
  substitute_ingredient,
  reason,
  COUNT(*) as times_used,
  AVG(success_rating) as avg_rating,
  COUNT(CASE WHEN would_use_again = true THEN 1 END)::REAL / NULLIF(COUNT(*), 0) * 100 as recommendation_rate
FROM ingredient_substitutions
WHERE success_rating IS NOT NULL
GROUP BY original_ingredient, substitute_ingredient, reason
HAVING COUNT(*) >= 3
ORDER BY times_used DESC, avg_rating DESC;

-- ================================================
-- VIEW: Recipe Difficulty Accuracy
-- ================================================
CREATE OR REPLACE VIEW recipe_difficulty_accuracy AS
SELECT 
  r.id,
  r.title,
  r.difficulty as ai_difficulty,
  AVG(cs.difficulty_rating) as avg_user_difficulty,
  COUNT(cs.id) as sample_size,
  CASE 
    WHEN r.difficulty = 'easy' AND AVG(cs.difficulty_rating) <= 2 THEN 'accurate'
    WHEN r.difficulty = 'medium' AND AVG(cs.difficulty_rating) BETWEEN 2 AND 4 THEN 'accurate'
    WHEN r.difficulty = 'hard' AND AVG(cs.difficulty_rating) >= 4 THEN 'accurate'
    ELSE 'inaccurate'
  END as accuracy
FROM recipes r
JOIN cooking_sessions cs ON r.id = cs.recipe_id
WHERE cs.difficulty_rating IS NOT NULL
GROUP BY r.id, r.title, r.difficulty
HAVING COUNT(cs.id) >= 5;

-- ================================================
-- VIEW: Cooking Step Time Insights
-- ================================================
CREATE OR REPLACE VIEW step_time_insights AS
SELECT 
  r.id as recipe_id,
  r.title,
  cst.step_number,
  cst.step_instruction,
  COUNT(cst.id) as times_completed,
  AVG(cst.duration_seconds) as avg_actual_seconds,
  AVG(cst.estimated_duration_seconds) as avg_estimated_seconds,
  AVG(cst.time_variance_seconds) as avg_variance_seconds,
  STDDEV(cst.duration_seconds) as time_variance_stddev,
  COUNT(CASE WHEN cst.needed_retry = true THEN 1 END)::REAL / NULLIF(COUNT(*), 0) * 100 as retry_rate,
  AVG(cst.difficulty_rating) as avg_difficulty
FROM recipes r
JOIN cooking_step_times cst ON r.id = cst.recipe_id
WHERE cst.completed_at IS NOT NULL
GROUP BY r.id, r.title, cst.step_number, cst.step_instruction
ORDER BY retry_rate DESC, avg_difficulty DESC;

-- ================================================
-- VIEW: ML Training Dataset
-- ================================================
CREATE OR REPLACE VIEW ml_training_dataset AS
SELECT 
  r.id as recipe_id,
  r.title,
  r.ingredients,
  r.steps,
  r.cuisine_type,
  r.difficulty,
  r.diet_type,
  r.time_minutes,
  r.calories,
  
  -- User interaction features
  r.view_count,
  r.cook_start_count,
  r.completion_count,
  r.avg_rating,
  
  -- Cooking session features
  AVG(cs.total_duration_minutes) as avg_actual_cooking_time,
  AVG(cs.ai_validations_passed::REAL / NULLIF(cs.ai_validations_count, 0)) as avg_validation_pass_rate,
  
  -- Step validation features
  COUNT(sv.id) as total_validations,
  SUM(CASE WHEN sv.validation_status = 'fail' THEN 1 ELSE 0 END) as failed_validations,
  
  -- Search context
  ARRAY_AGG(DISTINCT sq.query_text) FILTER (WHERE sq.query_text IS NOT NULL) as associated_search_queries
  
FROM recipes r
LEFT JOIN cooking_sessions cs ON r.id = cs.recipe_id
LEFT JOIN step_validations sv ON r.id = sv.recipe_id
LEFT JOIN user_recipe_interactions uri ON r.id = uri.recipe_id
LEFT JOIN search_queries sq ON uri.search_query_id = sq.id
GROUP BY r.id;
