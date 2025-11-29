export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cooking_sessions: {
        Row: {
          adjusted_servings: number | null
          ai_validations_count: number | null
          ai_validations_failed: number | null
          ai_validations_passed: number | null
          completed_at: string | null
          cooking_alone: boolean | null
          corrective_steps_added: number | null
          current_step: number | null
          current_steps: Json
          difficulty_rating: number | null
          final_dish_image_url: string | null
          id: string
          ingredients_modified: boolean | null
          interruptions_count: number | null
          original_steps_count: number
          paused_duration_minutes: number | null
          recipe_id: string | null
          servings_adjusted: boolean | null
          session_status: string | null
          started_at: string | null
          steps_added: number | null
          steps_modified: number | null
          steps_skipped: number | null
          total_duration_minutes: number | null
          total_steps: number | null
          updated_at: string | null
          user_feedback: string | null
          user_id: string | null
          user_rating: number | null
          would_cook_again: boolean | null
        }
        Insert: {
          adjusted_servings?: number | null
          ai_validations_count?: number | null
          ai_validations_failed?: number | null
          ai_validations_passed?: number | null
          completed_at?: string | null
          cooking_alone?: boolean | null
          corrective_steps_added?: number | null
          current_step?: number | null
          current_steps: Json
          difficulty_rating?: number | null
          final_dish_image_url?: string | null
          id?: string
          ingredients_modified?: boolean | null
          interruptions_count?: number | null
          original_steps_count: number
          paused_duration_minutes?: number | null
          recipe_id?: string | null
          servings_adjusted?: boolean | null
          session_status?: string | null
          started_at?: string | null
          steps_added?: number | null
          steps_modified?: number | null
          steps_skipped?: number | null
          total_duration_minutes?: number | null
          total_steps?: number | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
          would_cook_again?: boolean | null
        }
        Update: {
          adjusted_servings?: number | null
          ai_validations_count?: number | null
          ai_validations_failed?: number | null
          ai_validations_passed?: number | null
          completed_at?: string | null
          cooking_alone?: boolean | null
          corrective_steps_added?: number | null
          current_step?: number | null
          current_steps?: Json
          difficulty_rating?: number | null
          final_dish_image_url?: string | null
          id?: string
          ingredients_modified?: boolean | null
          interruptions_count?: number | null
          original_steps_count?: number
          paused_duration_minutes?: number | null
          recipe_id?: string | null
          servings_adjusted?: boolean | null
          session_status?: string | null
          started_at?: string | null
          steps_added?: number | null
          steps_modified?: number | null
          steps_skipped?: number | null
          total_duration_minutes?: number | null
          total_steps?: number | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
          would_cook_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cooking_sessions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_sessions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_sessions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cooking_step_times: {
        Row: {
          completed_at: string | null
          completed_successfully: boolean | null
          cooking_session_id: string | null
          created_at: string | null
          difficulty_rating: number | null
          duration_seconds: number | null
          estimated_duration_seconds: number | null
          id: string
          needed_retry: boolean | null
          recipe_id: string | null
          retry_count: number | null
          started_at: string
          step_instruction: string
          step_number: number
          time_variance_seconds: number | null
          user_id: string | null
          user_notes: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_successfully?: boolean | null
          cooking_session_id?: string | null
          created_at?: string | null
          difficulty_rating?: number | null
          duration_seconds?: number | null
          estimated_duration_seconds?: number | null
          id?: string
          needed_retry?: boolean | null
          recipe_id?: string | null
          retry_count?: number | null
          started_at: string
          step_instruction: string
          step_number: number
          time_variance_seconds?: number | null
          user_id?: string | null
          user_notes?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_successfully?: boolean | null
          cooking_session_id?: string | null
          created_at?: string | null
          difficulty_rating?: number | null
          duration_seconds?: number | null
          estimated_duration_seconds?: number | null
          id?: string
          needed_retry?: boolean | null
          recipe_id?: string | null
          retry_count?: number | null
          started_at?: string
          step_instruction?: string
          step_number?: number
          time_variance_seconds?: number | null
          user_id?: string | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cooking_step_times_cooking_session_id_fkey"
            columns: ["cooking_session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_step_times_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_step_times_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_step_times_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_step_times_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_step_times_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_nutrition_log: {
        Row: {
          calorie_goal: number | null
          created_at: string | null
          date: string
          id: string
          protein_goal_g: number | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          total_sugar_g: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calorie_goal?: number | null
          created_at?: string | null
          date: string
          id?: string
          protein_goal_g?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          total_sugar_g?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calorie_goal?: number | null
          created_at?: string | null
          date?: string
          id?: string
          protein_goal_g?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          total_sugar_g?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_nutrition_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_nutrition_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_substitutions: {
        Row: {
          cooking_session_id: string | null
          created_at: string | null
          id: string
          original_ingredient: string
          original_quantity: number | null
          original_unit: string | null
          reason: string | null
          recipe_id: string | null
          substitute_ingredient: string
          substitute_quantity: number | null
          substitute_unit: string | null
          success_rating: number | null
          suggested_by: string | null
          user_id: string | null
          user_notes: string | null
          would_use_again: boolean | null
        }
        Insert: {
          cooking_session_id?: string | null
          created_at?: string | null
          id?: string
          original_ingredient: string
          original_quantity?: number | null
          original_unit?: string | null
          reason?: string | null
          recipe_id?: string | null
          substitute_ingredient: string
          substitute_quantity?: number | null
          substitute_unit?: string | null
          success_rating?: number | null
          suggested_by?: string | null
          user_id?: string | null
          user_notes?: string | null
          would_use_again?: boolean | null
        }
        Update: {
          cooking_session_id?: string | null
          created_at?: string | null
          id?: string
          original_ingredient?: string
          original_quantity?: number | null
          original_unit?: string | null
          reason?: string | null
          recipe_id?: string | null
          substitute_ingredient?: string
          substitute_quantity?: number | null
          substitute_unit?: string | null
          success_rating?: number | null
          suggested_by?: string | null
          user_id?: string | null
          user_notes?: string | null
          would_use_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_substitutions_cooking_session_id_fkey"
            columns: ["cooking_session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_tools_identified: {
        Row: {
          confidence_scores: Json | null
          cooking_session_id: string | null
          created_at: string | null
          id: string
          image_url: string | null
          tools: Json
          user_id: string | null
        }
        Insert: {
          confidence_scores?: Json | null
          cooking_session_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          tools: Json
          user_id?: string | null
        }
        Update: {
          confidence_scores?: Json | null
          cooking_session_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          tools?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_tools_identified_cooking_session_id_fkey"
            columns: ["cooking_session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_tools_identified_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_tools_identified_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      local_ingredients_catalog: {
        Row: {
          average_price_local_currency: number | null
          common_substitutes: string[] | null
          country: string
          created_at: string | null
          id: string
          ingredient_category: string | null
          ingredient_name: string
          international_equivalent: string | null
          region: string | null
          seasonal_availability: string[] | null
          typical_unit: string | null
          updated_at: string | null
          year_round: boolean | null
        }
        Insert: {
          average_price_local_currency?: number | null
          common_substitutes?: string[] | null
          country: string
          created_at?: string | null
          id?: string
          ingredient_category?: string | null
          ingredient_name: string
          international_equivalent?: string | null
          region?: string | null
          seasonal_availability?: string[] | null
          typical_unit?: string | null
          updated_at?: string | null
          year_round?: boolean | null
        }
        Update: {
          average_price_local_currency?: number | null
          common_substitutes?: string[] | null
          country?: string
          created_at?: string | null
          id?: string
          ingredient_category?: string | null
          ingredient_name?: string
          international_equivalent?: string | null
          region?: string | null
          seasonal_availability?: string[] | null
          typical_unit?: string | null
          updated_at?: string | null
          year_round?: boolean | null
        }
        Relationships: []
      }
      nutrition_log_entries: {
        Row: {
          calories: number | null
          carbs_g: number | null
          cooking_session_id: string | null
          created_at: string | null
          daily_log_id: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          meal_time: string
          meal_type: string | null
          protein_g: number | null
          recipe_id: string | null
          servings_consumed: number | null
          sugar_g: number | null
          user_id: string | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          cooking_session_id?: string | null
          created_at?: string | null
          daily_log_id?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_time: string
          meal_type?: string | null
          protein_g?: number | null
          recipe_id?: string | null
          servings_consumed?: number | null
          sugar_g?: number | null
          user_id?: string | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          cooking_session_id?: string | null
          created_at?: string | null
          daily_log_id?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_time?: string
          meal_type?: string | null
          protein_g?: number | null
          recipe_id?: string | null
          servings_consumed?: number | null
          sugar_g?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_log_entries_cooking_session_id_fkey"
            columns: ["cooking_session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_log_entries_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_nutrition_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_log_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_log_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_log_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_log_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_log_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_collection_items: {
        Row: {
          added_at: string | null
          collection_id: string | null
          id: string
          position: number | null
          recipe_id: string | null
          user_notes: string | null
        }
        Insert: {
          added_at?: string | null
          collection_id?: string | null
          id?: string
          position?: number | null
          recipe_id?: string | null
          user_notes?: string | null
        }
        Update: {
          added_at?: string | null
          collection_id?: string | null
          id?: string
          position?: number | null
          recipe_id?: string | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "recipe_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_collection_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_collection_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_collection_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_collections: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_default: boolean | null
          is_public: boolean | null
          name: string
          recipe_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name: string
          recipe_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name?: string
          recipe_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_failure_feedback: {
        Row: {
          adjusted_servings: boolean | null
          ai_analysis: string | null
          ai_suggestions: string | null
          attempted_fix: boolean | null
          cooking_session_id: string | null
          created_at: string | null
          description: string
          failure_image_urls: string[] | null
          failure_stage: string | null
          failure_type: string | null
          fix_description: string | null
          fix_successful: boolean | null
          followed_instructions_exactly: boolean | null
          id: string
          made_substitutions: boolean | null
          recipe_id: string | null
          user_id: string | null
          what_was_expected: string | null
          what_went_wrong: string | null
        }
        Insert: {
          adjusted_servings?: boolean | null
          ai_analysis?: string | null
          ai_suggestions?: string | null
          attempted_fix?: boolean | null
          cooking_session_id?: string | null
          created_at?: string | null
          description: string
          failure_image_urls?: string[] | null
          failure_stage?: string | null
          failure_type?: string | null
          fix_description?: string | null
          fix_successful?: boolean | null
          followed_instructions_exactly?: boolean | null
          id?: string
          made_substitutions?: boolean | null
          recipe_id?: string | null
          user_id?: string | null
          what_was_expected?: string | null
          what_went_wrong?: string | null
        }
        Update: {
          adjusted_servings?: boolean | null
          ai_analysis?: string | null
          ai_suggestions?: string | null
          attempted_fix?: boolean | null
          cooking_session_id?: string | null
          created_at?: string | null
          description?: string
          failure_image_urls?: string[] | null
          failure_stage?: string | null
          failure_type?: string | null
          fix_description?: string | null
          fix_successful?: boolean | null
          followed_instructions_exactly?: boolean | null
          id?: string
          made_substitutions?: boolean | null
          recipe_id?: string | null
          user_id?: string | null
          what_was_expected?: string | null
          what_went_wrong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_failure_feedback_cooking_session_id_fkey"
            columns: ["cooking_session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_failure_feedback_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_failure_feedback_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_failure_feedback_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_failure_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_failure_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_modifications: {
        Row: {
          cooking_session_id: string | null
          created_at: string | null
          id: string
          modification_type: string | null
          modified_value: Json | null
          original_value: Json | null
          outcome: string | null
          reason: string | null
          recipe_id: string | null
          user_feedback: string | null
          user_id: string | null
        }
        Insert: {
          cooking_session_id?: string | null
          created_at?: string | null
          id?: string
          modification_type?: string | null
          modified_value?: Json | null
          original_value?: Json | null
          outcome?: string | null
          reason?: string | null
          recipe_id?: string | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Update: {
          cooking_session_id?: string | null
          created_at?: string | null
          id?: string
          modification_type?: string | null
          modified_value?: Json | null
          original_value?: Json | null
          outcome?: string | null
          reason?: string | null
          recipe_id?: string | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_modifications_cooking_session_id_fkey"
            columns: ["cooking_session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_modifications_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_modifications_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_modifications_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_modifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_modifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_serving_adjustments: {
        Row: {
          adjusted_ingredients: Json
          adjusted_nutrition: Json | null
          adjusted_servings: number
          cooking_session_id: string | null
          created_at: string | null
          id: string
          original_servings: number
          outcome: string | null
          outcome_notes: string | null
          recipe_id: string | null
          scaling_factor: number | null
          user_id: string | null
          user_notes: string | null
        }
        Insert: {
          adjusted_ingredients: Json
          adjusted_nutrition?: Json | null
          adjusted_servings: number
          cooking_session_id?: string | null
          created_at?: string | null
          id?: string
          original_servings: number
          outcome?: string | null
          outcome_notes?: string | null
          recipe_id?: string | null
          scaling_factor?: number | null
          user_id?: string | null
          user_notes?: string | null
        }
        Update: {
          adjusted_ingredients?: Json
          adjusted_nutrition?: Json | null
          adjusted_servings?: number
          cooking_session_id?: string | null
          created_at?: string | null
          id?: string
          original_servings?: number
          outcome?: string | null
          outcome_notes?: string | null
          recipe_id?: string | null
          scaling_factor?: number | null
          user_id?: string | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_serving_adjustments_cooking_session_id_fkey"
            columns: ["cooking_session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_serving_adjustments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_serving_adjustments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_serving_adjustments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_serving_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_serving_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          avg_rating: number | null
          calories: number | null
          completion_count: number | null
          cook_start_count: number | null
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          diet_type: string | null
          difficulty: string | null
          gemini_model: string | null
          gemini_temperature: number | null
          id: string
          image_prompt: string | null
          ingredients: Json | null
          is_user_rated: boolean | null
          servings: number | null
          steps: Json | null
          time_minutes: number | null
          title: string
          title_vector: unknown
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          avg_rating?: number | null
          calories?: number | null
          completion_count?: number | null
          cook_start_count?: number | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          diet_type?: string | null
          difficulty?: string | null
          gemini_model?: string | null
          gemini_temperature?: number | null
          id?: string
          image_prompt?: string | null
          ingredients?: Json | null
          is_user_rated?: boolean | null
          servings?: number | null
          steps?: Json | null
          time_minutes?: number | null
          title: string
          title_vector?: unknown
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          avg_rating?: number | null
          calories?: number | null
          completion_count?: number | null
          cook_start_count?: number | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          diet_type?: string | null
          difficulty?: string | null
          gemini_model?: string | null
          gemini_temperature?: number | null
          id?: string
          image_prompt?: string | null
          ingredients?: Json | null
          is_user_rated?: boolean | null
          servings?: number | null
          steps?: Json | null
          time_minutes?: number | null
          title?: string
          title_vector?: unknown
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          created_at: string | null
          device_info: Json | null
          diet_filter: string | null
          gemini_model_used: string | null
          gemini_tokens_used: number | null
          id: string
          query_text: string
          recipes_count: number | null
          recipes_generated: Json | null
          response_time_ms: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          diet_filter?: string | null
          gemini_model_used?: string | null
          gemini_tokens_used?: number | null
          id?: string
          query_text: string
          recipes_count?: number | null
          recipes_generated?: Json | null
          response_time_ms?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          diet_filter?: string | null
          gemini_model_used?: string | null
          gemini_tokens_used?: number | null
          id?: string
          query_text?: string
          recipes_count?: number | null
          recipes_generated?: Json | null
          response_time_ms?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_queries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          category: string | null
          created_at: string | null
          estimated_price: number | null
          id: string
          ingredient_name: string
          is_checked: boolean | null
          notes: string | null
          quantity: number | null
          recipe_id: string | null
          shopping_list_id: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          ingredient_name: string
          is_checked?: boolean | null
          notes?: string | null
          quantity?: number | null
          recipe_id?: string | null
          shopping_list_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          ingredient_name?: string
          is_checked?: boolean | null
          notes?: string | null
          quantity?: number | null
          recipe_id?: string | null
          shopping_list_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          completed_items: number | null
          created_at: string | null
          estimated_cost: number | null
          id: string
          name: string
          status: string | null
          total_items: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_items?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          name: string
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_items?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          name?: string
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      step_validations: {
        Row: {
          confidence_level: string | null
          cooking_session_id: string | null
          corrective_action_needed: boolean | null
          corrective_steps_added: Json | null
          created_at: string | null
          gemini_model: string | null
          id: string
          image_data_size_kb: number | null
          image_url: string | null
          recipe_id: string | null
          step_instruction: string
          step_number: number
          validation_result: string
          validation_status: string | null
          validation_time_ms: number | null
        }
        Insert: {
          confidence_level?: string | null
          cooking_session_id?: string | null
          corrective_action_needed?: boolean | null
          corrective_steps_added?: Json | null
          created_at?: string | null
          gemini_model?: string | null
          id?: string
          image_data_size_kb?: number | null
          image_url?: string | null
          recipe_id?: string | null
          step_instruction: string
          step_number: number
          validation_result: string
          validation_status?: string | null
          validation_time_ms?: number | null
        }
        Update: {
          confidence_level?: string | null
          cooking_session_id?: string | null
          corrective_action_needed?: boolean | null
          corrective_steps_added?: Json | null
          created_at?: string | null
          gemini_model?: string | null
          id?: string
          image_data_size_kb?: number | null
          image_url?: string | null
          recipe_id?: string | null
          step_instruction?: string
          step_number?: number
          validation_result?: string
          validation_status?: string | null
          validation_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "step_validations_cooking_session_id_fkey"
            columns: ["cooking_session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_validations_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_validations_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_validations_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_kitchen_inventory: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          inventory_type: string
          is_available: boolean | null
          item_category: string | null
          item_name: string
          last_used_at: string | null
          notes: string | null
          purchase_date: string | null
          quantity: number | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          inventory_type: string
          is_available?: boolean | null
          item_category?: string | null
          item_name: string
          last_used_at?: string | null
          notes?: string | null
          purchase_date?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          inventory_type?: string
          is_available?: boolean | null
          item_category?: string | null
          item_name?: string
          last_used_at?: string | null
          notes?: string | null
          purchase_date?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_kitchen_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_kitchen_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          allergens: string[] | null
          created_at: string | null
          default_diet: string | null
          enable_notifications: boolean | null
          id: string
          max_cooking_time_minutes: number | null
          preferred_cuisines: string[] | null
          preferred_difficulty: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allergens?: string[] | null
          created_at?: string | null
          default_diet?: string | null
          enable_notifications?: boolean | null
          id?: string
          max_cooking_time_minutes?: number | null
          preferred_cuisines?: string[] | null
          preferred_difficulty?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allergens?: string[] | null
          created_at?: string | null
          default_diet?: string | null
          enable_notifications?: boolean | null
          id?: string
          max_cooking_time_minutes?: number | null
          preferred_cuisines?: string[] | null
          preferred_difficulty?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recipe_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          position_in_results: number | null
          recipe_id: string | null
          search_query_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          position_in_results?: number | null
          recipe_id?: string | null
          search_query_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          position_in_results?: number | null
          recipe_id?: string | null
          search_query_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_recipe_interactions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "popular_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recipe_interactions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_performance_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recipe_interactions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recipe_interactions_search_query_id_fkey"
            columns: ["search_query_id"]
            isOneToOne: false
            referencedRelation: "search_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recipe_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recipe_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_session_metadata: {
        Row: {
          browser: string | null
          created_at: string | null
          day_of_week: string | null
          device_type: string | null
          id: string
          is_weekend: boolean | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lng: number | null
          location_region: string | null
          os: string | null
          screen_size: string | null
          session_ended_at: string | null
          session_id: string
          session_started_at: string | null
          time_of_day: string | null
          timezone: string | null
          total_actions: number | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          day_of_week?: string | null
          device_type?: string | null
          id?: string
          is_weekend?: boolean | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_region?: string | null
          os?: string | null
          screen_size?: string | null
          session_ended_at?: string | null
          session_id: string
          session_started_at?: string | null
          time_of_day?: string | null
          timezone?: string | null
          total_actions?: number | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          day_of_week?: string | null
          device_type?: string | null
          id?: string
          is_weekend?: boolean | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_region?: string | null
          os?: string | null
          screen_size?: string | null
          session_ended_at?: string | null
          session_id?: string
          session_started_at?: string | null
          time_of_day?: string | null
          timezone?: string | null
          total_actions?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_session_metadata_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_session_metadata_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          diet_preference: string | null
          email: string
          google_id: string | null
          id: string
          last_login_at: string | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lng: number | null
          name: string
          picture_url: string | null
          timezone: string | null
          total_recipes_completed: number | null
          total_recipes_cooked: number | null
          total_recipes_viewed: number | null
          total_searches: number | null
          updated_at: string | null
          use_local_ingredients: boolean | null
          use_metric_units: boolean | null
        }
        Insert: {
          created_at?: string | null
          diet_preference?: string | null
          email: string
          google_id?: string | null
          id?: string
          last_login_at?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          picture_url?: string | null
          timezone?: string | null
          total_recipes_completed?: number | null
          total_recipes_cooked?: number | null
          total_recipes_viewed?: number | null
          total_searches?: number | null
          updated_at?: string | null
          use_local_ingredients?: boolean | null
          use_metric_units?: boolean | null
        }
        Update: {
          created_at?: string | null
          diet_preference?: string | null
          email?: string
          google_id?: string | null
          id?: string
          last_login_at?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          picture_url?: string | null
          timezone?: string | null
          total_recipes_completed?: number | null
          total_recipes_cooked?: number | null
          total_recipes_viewed?: number | null
          total_searches?: number | null
          updated_at?: string | null
          use_local_ingredients?: boolean | null
          use_metric_units?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      popular_recipes: {
        Row: {
          avg_rating: number | null
          calories: number | null
          completion_count: number | null
          cuisine_type: string | null
          description: string | null
          diet_type: string | null
          difficulty: string | null
          id: string | null
          image_prompt: string | null
          popularity_score: number | null
          time_minutes: number | null
          title: string | null
          view_count: number | null
        }
        Relationships: []
      }
      recipe_performance_dashboard: {
        Row: {
          avg_cooking_duration: number | null
          avg_rating: number | null
          completion_count: number | null
          completion_rate: number | null
          cook_start_count: number | null
          cuisine_type: string | null
          diet_type: string | null
          difficulty: string | null
          id: string | null
          title: string | null
          total_cooking_sessions: number | null
          view_count: number | null
        }
        Relationships: []
      }
      user_engagement_metrics: {
        Row: {
          completion_rate: number | null
          created_at: string | null
          days_since_last_login: number | null
          email: string | null
          id: string | null
          last_login_at: string | null
          name: string | null
          total_recipes_completed: number | null
          total_recipes_cooked: number | null
          total_recipes_viewed: number | null
          total_searches: number | null
        }
        Insert: {
          completion_rate?: never
          created_at?: string | null
          days_since_last_login?: never
          email?: string | null
          id?: string | null
          last_login_at?: string | null
          name?: string | null
          total_recipes_completed?: number | null
          total_recipes_cooked?: number | null
          total_recipes_viewed?: number | null
          total_searches?: number | null
        }
        Update: {
          completion_rate?: never
          created_at?: string | null
          days_since_last_login?: never
          email?: string | null
          id?: string | null
          last_login_at?: string | null
          name?: string | null
          total_recipes_completed?: number | null
          total_recipes_cooked?: number | null
          total_recipes_viewed?: number | null
          total_searches?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_similar_recipe: {
        Args: { p_similarity_threshold?: number; p_title: string }
        Returns: {
          recipe_id: string
          similarity_score: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      suggest_local_substitute: {
        Args: {
          p_country: string
          p_current_month: number
          p_ingredient: string
        }
        Returns: {
          availability_score: number
          is_seasonal: boolean
          substitute_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
