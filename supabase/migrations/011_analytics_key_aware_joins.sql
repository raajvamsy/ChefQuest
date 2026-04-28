-- ================================================
-- MIGRATION 011: KEY-AWARE ANALYTICS JOINS
-- Keep analytics accurate when recipe_id is null
-- and recipe_key is present in interaction/session logs.
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
  END AS completion_rate,
  COUNT(DISTINCT cs.id) AS total_cooking_sessions,
  AVG(cs.total_duration_minutes) AS avg_cooking_duration
FROM recipes r
LEFT JOIN cooking_sessions cs
  ON (
    cs.recipe_id = r.id
    OR (cs.recipe_id IS NULL AND cs.recipe_key = r.id)
  )
GROUP BY r.id;

CREATE OR REPLACE VIEW ml_training_dataset AS
SELECT
  r.id AS recipe_id,
  r.title,
  r.ingredients,
  r.steps,
  r.cuisine_type,
  r.difficulty,
  r.diet_type,
  r.time_minutes,
  r.calories,
  r.view_count,
  r.cook_start_count,
  r.completion_count,
  r.avg_rating,
  AVG(cs.total_duration_minutes) AS avg_actual_cooking_time,
  AVG(cs.ai_validations_passed::REAL / NULLIF(cs.ai_validations_count, 0)) AS avg_validation_pass_rate,
  COUNT(sv.id) AS total_validations,
  SUM(CASE WHEN sv.validation_status = 'fail' THEN 1 ELSE 0 END) AS failed_validations,
  ARRAY_AGG(DISTINCT sq.query_text) FILTER (WHERE sq.query_text IS NOT NULL) AS associated_search_queries
FROM recipes r
LEFT JOIN cooking_sessions cs
  ON (
    cs.recipe_id = r.id
    OR (cs.recipe_id IS NULL AND cs.recipe_key = r.id)
  )
LEFT JOIN step_validations sv
  ON sv.recipe_id = r.id
LEFT JOIN user_recipe_interactions uri
  ON (
    uri.recipe_id = r.id
    OR (uri.recipe_id IS NULL AND uri.recipe_key = r.id)
  )
LEFT JOIN search_queries sq
  ON uri.search_query_id = sq.id
GROUP BY r.id;
