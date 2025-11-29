-- ================================================
-- MIGRATION 009: ROW LEVEL SECURITY POLICIES
-- Security policies for all tables
-- ================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipe_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_step_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_tools_identified ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kitchen_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_serving_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_failure_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_ingredients_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ================================================
-- USERS TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================
-- SEARCH QUERIES POLICIES
-- ================================================
CREATE POLICY "Users can insert own searches" ON search_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own searches" ON search_queries
  FOR SELECT USING (auth.uid() = user_id);

-- ================================================
-- RECIPES POLICIES
-- ================================================
CREATE POLICY "Anyone authenticated can view recipes" ON recipes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert recipes" ON recipes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update recipes" ON recipes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ================================================
-- USER RECIPE INTERACTIONS POLICIES
-- ================================================
CREATE POLICY "Users can manage own interactions" ON user_recipe_interactions
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- COOKING SESSIONS POLICIES
-- ================================================
CREATE POLICY "Users can manage own sessions" ON cooking_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- STEP VALIDATIONS POLICIES
-- ================================================
CREATE POLICY "Users can view own validations" ON step_validations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cooking_sessions 
      WHERE cooking_sessions.id = step_validations.cooking_session_id 
      AND cooking_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own validations" ON step_validations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cooking_sessions 
      WHERE cooking_sessions.id = cooking_session_id 
      AND cooking_sessions.user_id = auth.uid()
    )
  );

-- ================================================
-- COOKING STEP TIMES POLICIES
-- ================================================
CREATE POLICY "Users can manage own step times" ON cooking_step_times
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- KITCHEN TOOLS IDENTIFIED POLICIES
-- ================================================
CREATE POLICY "Users can manage own kitchen tools" ON kitchen_tools_identified
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- USER KITCHEN INVENTORY POLICIES
-- ================================================
CREATE POLICY "Users can manage own inventory" ON user_kitchen_inventory
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- RECIPE COLLECTIONS POLICIES
-- ================================================
CREATE POLICY "Users can manage own collections" ON recipe_collections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON recipe_collections
  FOR SELECT USING (is_public = true);

-- ================================================
-- RECIPE COLLECTION ITEMS POLICIES
-- ================================================
CREATE POLICY "Users can manage own collection items" ON recipe_collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipe_collections 
      WHERE recipe_collections.id = recipe_collection_items.collection_id 
      AND recipe_collections.user_id = auth.uid()
    )
  );

-- ================================================
-- SHOPPING LISTS POLICIES
-- ================================================
CREATE POLICY "Users can manage own shopping lists" ON shopping_lists
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- SHOPPING LIST ITEMS POLICIES
-- ================================================
CREATE POLICY "Users can manage own shopping list items" ON shopping_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_lists 
      WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
      AND shopping_lists.user_id = auth.uid()
    )
  );

-- ================================================
-- RECIPE MODIFICATIONS POLICIES
-- ================================================
CREATE POLICY "Users can manage own modifications" ON recipe_modifications
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- INGREDIENT SUBSTITUTIONS POLICIES
-- ================================================
CREATE POLICY "Users can manage own substitutions" ON ingredient_substitutions
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- RECIPE SERVING ADJUSTMENTS POLICIES
-- ================================================
CREATE POLICY "Users can manage own serving adjustments" ON recipe_serving_adjustments
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- RECIPE FAILURE FEEDBACK POLICIES
-- ================================================
CREATE POLICY "Users can manage own failure feedback" ON recipe_failure_feedback
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- DAILY NUTRITION LOG POLICIES
-- ================================================
CREATE POLICY "Users can manage own nutrition log" ON daily_nutrition_log
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- NUTRITION LOG ENTRIES POLICIES
-- ================================================
CREATE POLICY "Users can manage own nutrition entries" ON nutrition_log_entries
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- LOCAL INGREDIENTS CATALOG POLICIES
-- ================================================
CREATE POLICY "Anyone authenticated can view local ingredients" ON local_ingredients_catalog
  FOR SELECT USING (auth.role() = 'authenticated');

-- ================================================
-- USER SESSION METADATA POLICIES
-- ================================================
CREATE POLICY "Users can manage own session metadata" ON user_session_metadata
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- USER PREFERENCES POLICIES
-- ================================================
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
