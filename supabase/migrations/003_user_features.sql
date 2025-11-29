-- ================================================
-- MIGRATION 003: USER FEATURES
-- Inventory, Collections, Shopping Lists
-- ================================================

-- ================================================
-- USER KITCHEN INVENTORY TABLE
-- ================================================
CREATE TABLE user_kitchen_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  inventory_type TEXT NOT NULL CHECK (inventory_type IN ('ingredient', 'tool', 'appliance')),
  
  -- Item details
  item_name TEXT NOT NULL,
  item_category TEXT,
  quantity DECIMAL(10, 2),
  unit TEXT,
  
  -- Ingredient-specific
  expiry_date DATE,
  purchase_date DATE,
  
  -- Status
  is_available BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  
  -- User notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_user_id ON user_kitchen_inventory(user_id);
CREATE INDEX idx_inventory_type ON user_kitchen_inventory(inventory_type);
CREATE INDEX idx_inventory_available ON user_kitchen_inventory(is_available);
CREATE INDEX idx_inventory_expiry ON user_kitchen_inventory(expiry_date) WHERE inventory_type = 'ingredient';

-- ================================================
-- RECIPE COLLECTIONS TABLE
-- ================================================
CREATE TABLE recipe_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📖',
  
  -- Privacy
  is_public BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Stats
  recipe_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_user_id ON recipe_collections(user_id);
CREATE INDEX idx_collections_public ON recipe_collections(is_public) WHERE is_public = true;

-- ================================================
-- RECIPE COLLECTION ITEMS TABLE
-- ================================================
CREATE TABLE recipe_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES recipe_collections(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW(),
  position INTEGER,
  user_notes TEXT,
  
  UNIQUE(collection_id, recipe_id)
);

CREATE INDEX idx_collection_items_collection ON recipe_collection_items(collection_id);
CREATE INDEX idx_collection_items_recipe ON recipe_collection_items(recipe_id);

-- ================================================
-- SHOPPING LISTS TABLE
-- ================================================
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
  
  -- Stats
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_status ON shopping_lists(status);

-- ================================================
-- SHOPPING LIST ITEMS TABLE
-- ================================================
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  
  -- Item details
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit TEXT,
  category TEXT,
  
  -- Status
  is_checked BOOLEAN DEFAULT FALSE,
  
  -- Optional
  estimated_price DECIMAL(10, 2),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_items_list ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_items_recipe ON shopping_list_items(recipe_id);
CREATE INDEX idx_shopping_items_checked ON shopping_list_items(is_checked);
