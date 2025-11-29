-- ================================================
-- MIGRATION 007: FUNCTIONS & TRIGGERS
-- Auto-update counters and calculated fields
-- ================================================

-- ================================================
-- FUNCTION: Update User Stats
-- ================================================
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'search_queries' THEN
      UPDATE users SET total_searches = total_searches + 1 WHERE id = NEW.user_id;
    ELSIF TG_TABLE_NAME = 'user_recipe_interactions' AND NEW.interaction_type = 'viewed' THEN
      UPDATE users SET total_recipes_viewed = total_recipes_viewed + 1 WHERE id = NEW.user_id;
    ELSIF TG_TABLE_NAME = 'cooking_sessions' THEN
      IF NEW.session_status = 'in_progress' THEN
        UPDATE users SET total_recipes_cooked = total_recipes_cooked + 1 WHERE id = NEW.user_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'cooking_sessions' AND OLD.session_status != 'completed' AND NEW.session_status = 'completed' THEN
      UPDATE users SET total_recipes_completed = total_recipes_completed + 1 WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_search
  AFTER INSERT ON search_queries
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_stats_interactions
  AFTER INSERT ON user_recipe_interactions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_stats_sessions
  AFTER INSERT OR UPDATE ON cooking_sessions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- ================================================
-- FUNCTION: Update Recipe Popularity
-- ================================================
CREATE OR REPLACE FUNCTION update_recipe_popularity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'user_recipe_interactions' THEN
      IF NEW.interaction_type = 'viewed' THEN
        UPDATE recipes SET view_count = view_count + 1 WHERE id = NEW.recipe_id;
      ELSIF NEW.interaction_type = 'cook_started' THEN
        UPDATE recipes SET cook_start_count = cook_start_count + 1 WHERE id = NEW.recipe_id;
      ELSIF NEW.interaction_type = 'completed' THEN
        UPDATE recipes SET completion_count = completion_count + 1 WHERE id = NEW.recipe_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_popularity
  AFTER INSERT ON user_recipe_interactions
  FOR EACH ROW EXECUTE FUNCTION update_recipe_popularity();

-- ================================================
-- FUNCTION: Update Collection Recipe Count
-- ================================================
CREATE OR REPLACE FUNCTION update_collection_recipe_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipe_collections 
    SET recipe_count = recipe_count + 1 
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipe_collections 
    SET recipe_count = recipe_count - 1 
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_count
  AFTER INSERT OR DELETE ON recipe_collection_items
  FOR EACH ROW EXECUTE FUNCTION update_collection_recipe_count();

-- ================================================
-- FUNCTION: Update Shopping List Progress
-- ================================================
CREATE OR REPLACE FUNCTION update_shopping_list_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE shopping_lists
    SET 
      total_items = (SELECT COUNT(*) FROM shopping_list_items WHERE shopping_list_id = OLD.shopping_list_id),
      completed_items = (SELECT COUNT(*) FROM shopping_list_items WHERE shopping_list_id = OLD.shopping_list_id AND is_checked = true)
    WHERE id = OLD.shopping_list_id;
    RETURN OLD;
  ELSE
    UPDATE shopping_lists
    SET 
      total_items = (SELECT COUNT(*) FROM shopping_list_items WHERE shopping_list_id = NEW.shopping_list_id),
      completed_items = (SELECT COUNT(*) FROM shopping_list_items WHERE shopping_list_id = NEW.shopping_list_id AND is_checked = true)
    WHERE id = NEW.shopping_list_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shopping_progress
  AFTER INSERT OR UPDATE OR DELETE ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION update_shopping_list_progress();

-- ================================================
-- FUNCTION: Calculate Step Duration
-- ================================================
CREATE OR REPLACE FUNCTION calculate_step_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    
    IF NEW.estimated_duration_seconds IS NOT NULL THEN
      NEW.time_variance_seconds := NEW.duration_seconds - NEW.estimated_duration_seconds;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_step_duration
  BEFORE UPDATE ON cooking_step_times
  FOR EACH ROW EXECUTE FUNCTION calculate_step_duration();

-- ================================================
-- FUNCTION: Update Timestamps
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_recipes
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_cooking_sessions
  BEFORE UPDATE ON cooking_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_preferences
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_collections
  BEFORE UPDATE ON recipe_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FUNCTION: Find Similar Recipe (Deduplication)
-- ================================================
CREATE OR REPLACE FUNCTION find_similar_recipe(
  p_title TEXT,
  p_similarity_threshold REAL DEFAULT 0.85
)
RETURNS TABLE (
  recipe_id UUID,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    similarity(title, p_title) as score
  FROM recipes
  WHERE similarity(title, p_title) > p_similarity_threshold
  ORDER BY score DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCTION: Suggest Local Substitute
-- ================================================
CREATE OR REPLACE FUNCTION suggest_local_substitute(
  p_ingredient TEXT,
  p_country TEXT,
  p_current_month INTEGER
)
RETURNS TABLE (
  substitute_name TEXT,
  is_seasonal BOOLEAN,
  availability_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lic.ingredient_name,
    (ARRAY[TO_CHAR(TO_DATE(p_current_month::TEXT, 'MM'), 'mon')] <@ lic.seasonal_availability) as is_seasonal,
    CASE 
      WHEN lic.year_round THEN 100
      WHEN ARRAY[TO_CHAR(TO_DATE(p_current_month::TEXT, 'MM'), 'mon')] <@ lic.seasonal_availability THEN 80
      ELSE 40
    END as availability_score
  FROM local_ingredients_catalog lic
  WHERE 
    lic.country = p_country
    AND p_ingredient = ANY(lic.common_substitutes)
  ORDER BY availability_score DESC, lic.ingredient_name
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
