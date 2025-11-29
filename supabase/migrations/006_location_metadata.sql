-- ================================================
-- MIGRATION 006: LOCATION & METADATA
-- Local ingredients catalog and session metadata
-- ================================================

-- ================================================
-- LOCAL INGREDIENTS CATALOG TABLE
-- ================================================
CREATE TABLE local_ingredients_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ingredient details
  ingredient_name TEXT NOT NULL,
  ingredient_category TEXT,
  
  -- Location
  country TEXT NOT NULL,
  region TEXT,
  
  -- Seasonality
  seasonal_availability TEXT[],
  year_round BOOLEAN DEFAULT FALSE,
  
  -- Alternatives
  common_substitutes TEXT[],
  international_equivalent TEXT,
  
  -- Metadata
  typical_unit TEXT,
  average_price_local_currency DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_local_ingredients_country ON local_ingredients_catalog(country);
CREATE INDEX idx_local_ingredients_name ON local_ingredients_catalog(ingredient_name);
CREATE INDEX idx_local_ingredients_seasonal ON local_ingredients_catalog USING gin(seasonal_availability);

-- ================================================
-- USER SESSION METADATA TABLE
-- ================================================
CREATE TABLE user_session_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  
  -- Device info
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser TEXT,
  os TEXT,
  screen_size TEXT,
  
  -- Location
  location_country TEXT,
  location_region TEXT,
  location_city TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  timezone TEXT,
  
  -- Context
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  day_of_week TEXT,
  is_weekend BOOLEAN,
  
  -- Session metrics
  session_started_at TIMESTAMPTZ DEFAULT NOW(),
  session_ended_at TIMESTAMPTZ,
  total_actions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_metadata_user ON user_session_metadata(user_id);
CREATE INDEX idx_session_metadata_session ON user_session_metadata(session_id);
CREATE INDEX idx_session_metadata_location ON user_session_metadata(location_country, location_city);
