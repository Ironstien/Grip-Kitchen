export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_units: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          label: string;
          family: 'mass' | 'volume' | 'count';
          base_unit: string;
          to_base_multiplier: number;
          sort_order: number;
          is_system: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          label?: string;
          family: 'mass' | 'volume' | 'count';
          base_unit: string;
          to_base_multiplier: number;
          sort_order?: number;
          is_system?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          label?: string;
          family?: 'mass' | 'volume' | 'count';
          base_unit?: string;
          to_base_multiplier?: number;
          sort_order?: number;
          is_system?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'user_units_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sort_order: number;
          is_system: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sort_order?: number;
          is_system?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sort_order?: number;
          is_system?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'user_categories_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      storage_locations: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'storage_locations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          display_name: string;
          category: string;
          purchase_price: number;
          purchase_qty: number;
          purchase_unit: string;
          stock_unit: string;
          unit_of_measure: string;
          price_per_unit: number;
          price_unit_of_measure: string;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          display_name?: string;
          category?: string;
          purchase_price?: number;
          purchase_qty?: number;
          purchase_unit?: string;
          stock_unit?: string;
          unit_of_measure?: string;
          price_per_unit?: number;
          price_unit_of_measure?: string;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          display_name?: string;
          category?: string;
          purchase_price?: number;
          purchase_qty?: number;
          purchase_unit?: string;
          stock_unit?: string;
          unit_of_measure?: string;
          price_per_unit?: number;
          price_unit_of_measure?: string;
          image_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ingredients_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ingredient_conversions: {
        Row: {
          id: string;
          ingredient_id: string;
          from_unit: string;
          to_unit: string;
          factor: number;
        };
        Insert: {
          id?: string;
          ingredient_id: string;
          from_unit: string;
          to_unit: string;
          factor: number;
        };
        Update: {
          id?: string;
          ingredient_id?: string;
          from_unit?: string;
          to_unit?: string;
          factor?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'ingredient_conversions_ingredient_id_fkey';
            columns: ['ingredient_id'];
            isOneToOne: false;
            referencedRelation: 'ingredients';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory: {
        Row: {
          id: string;
          user_id: string;
          ingredient_id: string;
          quantity: number;
          expiration_date: string | null;
          location_id: string | null;
          min_threshold: number;
          shelf_sort_order: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          ingredient_id: string;
          quantity?: number;
          expiration_date?: string | null;
          location_id?: string | null;
          min_threshold?: number;
          shelf_sort_order?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          ingredient_id?: string;
          quantity?: number;
          expiration_date?: string | null;
          location_id?: string | null;
          min_threshold?: number;
          shelf_sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_ingredient_id_fkey';
            columns: ['ingredient_id'];
            isOneToOne: false;
            referencedRelation: 'ingredients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'storage_locations';
            referencedColumns: ['id'];
          },
        ];
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          instructions: string;
          base_serving_size: number;
          time_to_cook: number | null;
          dietary_tags: string[];
          hero_image_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          instructions?: string;
          base_serving_size?: number;
          time_to_cook?: number | null;
          dietary_tags?: string[];
          hero_image_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          instructions?: string;
          base_serving_size?: number;
          time_to_cook?: number | null;
          dietary_tags?: string[];
          hero_image_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string;
          required_quantity: number;
          required_unit: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_id: string;
          required_quantity: number;
          required_unit?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          ingredient_id?: string;
          required_quantity?: number;
          required_unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_ingredients_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_ingredients_ingredient_id_fkey';
            columns: ['ingredient_id'];
            isOneToOne: false;
            referencedRelation: 'ingredients';
            referencedColumns: ['id'];
          },
        ];
      };
      meal_plan: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          planned_date: string;
          meal_label: string;
          target_servings: number;
          is_cooked: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          planned_date: string;
          meal_label?: string;
          target_servings?: number;
          is_cooked?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string;
          planned_date?: string;
          meal_label?: string;
          target_servings?: number;
          is_cooked?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'meal_plan_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_plan_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      shopping_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: 'active' | 'archived';
          meal_plan_week_start: string | null;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          status?: 'active' | 'archived';
          meal_plan_week_start?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          status?: 'active' | 'archived';
          meal_plan_week_start?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_lists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      shopping_list: {
        Row: {
          id: string;
          user_id: string;
          shopping_list_id: string | null;
          inventory_item_id: string | null;
          target_quantity: number;
          is_purchased: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          shopping_list_id?: string | null;
          inventory_item_id?: string | null;
          target_quantity: number;
          is_purchased?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          shopping_list_id?: string | null;
          inventory_item_id?: string | null;
          target_quantity?: number;
          is_purchased?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_list_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shopping_list_shopping_list_id_fkey';
            columns: ['shopping_list_id'];
            isOneToOne: false;
            referencedRelation: 'shopping_lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shopping_list_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            isOneToOne: false;
            referencedRelation: 'inventory';
            referencedColumns: ['id'];
          },
        ];
      };
      waste_log: {
        Row: {
          id: string;
          user_id: string;
          inventory_item_id: string | null;
          quantity_wasted: number;
          cost_wasted: number;
          reason: string;
          logged_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          inventory_item_id?: string | null;
          quantity_wasted: number;
          cost_wasted?: number;
          reason?: string;
          logged_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          inventory_item_id?: string | null;
          quantity_wasted?: number;
          cost_wasted?: number;
          reason?: string;
          logged_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'waste_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'waste_log_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            isOneToOne: false;
            referencedRelation: 'inventory';
            referencedColumns: ['id'];
          },
        ];
      };
      barcode_cache: {
        Row: {
          id: string;
          user_id: string;
          barcode: string;
          inventory_item_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          barcode: string;
          inventory_item_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          barcode?: string;
          inventory_item_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'barcode_cache_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'barcode_cache_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            isOneToOne: false;
            referencedRelation: 'inventory';
            referencedColumns: ['id'];
          },
        ];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type UserProfile = Tables<'users'>;
export type UserUnit = Tables<'user_units'>;
export type UserCategory = Tables<'user_categories'>;
export type Ingredient = Tables<'ingredients'>;
export type IngredientConversion = Tables<'ingredient_conversions'>;

export type IngredientWithConversions = Ingredient & {
  ingredient_conversions: IngredientConversion[];
};
export type StorageLocation = Tables<'storage_locations'>;
export type InventoryItem = Tables<'inventory'>;
export type Recipe = Tables<'recipes'>;
export type RecipeIngredient = Tables<'recipe_ingredients'>;
export type MealPlanEntry = Tables<'meal_plan'>;
export type ShoppingListSession = Tables<'shopping_lists'>;
export type ShoppingListItem = Tables<'shopping_list'>;
export type WasteLogEntry = Tables<'waste_log'>;
export type BarcodeCacheEntry = Tables<'barcode_cache'>;
export type Note = Tables<'notes'>;
