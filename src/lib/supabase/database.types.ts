// Generated from the live database schema. Do not edit by hand.
// Regenerate with the Supabase CLI after every migration:
//   npx supabase gen types typescript --project-id gezrztmxyxbtbbasvbix > src/lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      body_measurements: {
        Row: {
          above_knee_left_cm: number | null
          above_knee_right_cm: number | null
          chest_cm: number | null
          client_id: string
          created_at: string
          hips_cm: number | null
          id: string
          measured_on: string
          notes: string
          thigh_left_cm: number | null
          thigh_right_cm: number | null
          updated_at: string
          upper_arm_left_cm: number | null
          upper_arm_right_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          above_knee_left_cm?: number | null
          above_knee_right_cm?: number | null
          chest_cm?: number | null
          client_id: string
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_on: string
          notes?: string
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          updated_at?: string
          upper_arm_left_cm?: number | null
          upper_arm_right_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          above_knee_left_cm?: number | null
          above_knee_right_cm?: number | null
          chest_cm?: number | null
          client_id?: string
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_on?: string
          notes?: string
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          updated_at?: string
          upper_arm_left_cm?: number | null
          upper_arm_right_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'body_measurements_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['profile_id']
          },
        ]
      }
      clients: {
        Row: {
          age: number | null
          created_at: string
          gender: string | null
          goal: string
          goal_deadline: string | null
          height_cm: number | null
          initial_complaints: Json
          nutritionist_id: string | null
          onboarding_completed_at: string | null
          profile_id: string
          recommendations: string
          start_weight_kg: number | null
          updated_at: string
          water_target_ml: number
        }
        Insert: {
          age?: number | null
          created_at?: string
          gender?: string | null
          goal?: string
          goal_deadline?: string | null
          height_cm?: number | null
          initial_complaints?: Json
          nutritionist_id?: string | null
          onboarding_completed_at?: string | null
          profile_id: string
          recommendations?: string
          start_weight_kg?: number | null
          updated_at?: string
          water_target_ml?: number
        }
        Update: {
          age?: number | null
          created_at?: string
          gender?: string | null
          goal?: string
          goal_deadline?: string | null
          height_cm?: number | null
          initial_complaints?: Json
          nutritionist_id?: string | null
          onboarding_completed_at?: string | null
          profile_id?: string
          recommendations?: string
          start_weight_kg?: number | null
          updated_at?: string
          water_target_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: 'clients_nutritionist_id_fkey'
            columns: ['nutritionist_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'clients_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      daily_logs: {
        Row: {
          activity_minutes: number | null
          activity_type: string
          bed_time: string | null
          client_id: string
          complaint_digestion: string
          complaint_emotional: string
          complaint_other: string
          complaint_skin: string
          created_at: string
          energy_level: number | null
          evening_ritual: string
          extra_supplements: string
          first_warm_drink: string
          gadgets_off_at: string | null
          id: string
          log_date: string
          morning_activity: string
          outdoor_minutes: number | null
          posted_at: string | null
          stress_level: number | null
          stress_relief: string
          updated_at: string
          wake_time: string | null
          waking_mood: string
          water_total_ml: number
          weight_kg: number | null
        }
        Insert: {
          activity_minutes?: number | null
          activity_type?: string
          bed_time?: string | null
          client_id: string
          complaint_digestion?: string
          complaint_emotional?: string
          complaint_other?: string
          complaint_skin?: string
          created_at?: string
          energy_level?: number | null
          evening_ritual?: string
          extra_supplements?: string
          first_warm_drink?: string
          gadgets_off_at?: string | null
          id?: string
          log_date: string
          morning_activity?: string
          outdoor_minutes?: number | null
          posted_at?: string | null
          stress_level?: number | null
          stress_relief?: string
          updated_at?: string
          wake_time?: string | null
          waking_mood?: string
          water_total_ml?: number
          weight_kg?: number | null
        }
        Update: {
          activity_minutes?: number | null
          activity_type?: string
          bed_time?: string | null
          client_id?: string
          complaint_digestion?: string
          complaint_emotional?: string
          complaint_other?: string
          complaint_skin?: string
          created_at?: string
          energy_level?: number | null
          evening_ritual?: string
          extra_supplements?: string
          first_warm_drink?: string
          gadgets_off_at?: string | null
          id?: string
          log_date?: string
          morning_activity?: string
          outdoor_minutes?: number | null
          posted_at?: string | null
          stress_level?: number | null
          stress_relief?: string
          updated_at?: string
          wake_time?: string | null
          waking_mood?: string
          water_total_ml?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'daily_logs_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['profile_id']
          },
        ]
      }
      day_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          daily_log_id: string
          id: string
          read_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          daily_log_id: string
          id?: string
          read_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          daily_log_id?: string
          id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'day_comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'day_comments_daily_log_id_fkey'
            columns: ['daily_log_id']
            isOneToOne: false
            referencedRelation: 'daily_logs'
            referencedColumns: ['id']
          },
        ]
      }
      direct_messages: {
        Row: {
          author_id: string
          body: string
          client_id: string
          created_at: string
          id: string
          read_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          client_id: string
          created_at?: string
          id?: string
          read_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'direct_messages_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'direct_messages_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['profile_id']
          },
        ]
      }
      log_drinks: {
        Row: {
          created_at: string
          daily_log_id: string
          drank_at: string | null
          id: string
          kind: string
          volume_ml: number
        }
        Insert: {
          created_at?: string
          daily_log_id: string
          drank_at?: string | null
          id?: string
          kind?: string
          volume_ml: number
        }
        Update: {
          created_at?: string
          daily_log_id?: string
          drank_at?: string | null
          id?: string
          kind?: string
          volume_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: 'log_drinks_daily_log_id_fkey'
            columns: ['daily_log_id']
            isOneToOne: false
            referencedRelation: 'daily_logs'
            referencedColumns: ['id']
          },
        ]
      }
      log_meals: {
        Row: {
          amount: string
          created_at: string
          daily_log_id: string
          eaten: string
          eaten_at: string | null
          id: string
          method: string
          photo_paths: string[]
          slot: Database['public']['Enums']['meal_slot'] | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount?: string
          created_at?: string
          daily_log_id: string
          eaten?: string
          eaten_at?: string | null
          id?: string
          method?: string
          photo_paths?: string[]
          slot?: Database['public']['Enums']['meal_slot'] | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: string
          created_at?: string
          daily_log_id?: string
          eaten?: string
          eaten_at?: string | null
          id?: string
          method?: string
          photo_paths?: string[]
          slot?: Database['public']['Enums']['meal_slot'] | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'log_meals_daily_log_id_fkey'
            columns: ['daily_log_id']
            isOneToOne: false
            referencedRelation: 'daily_logs'
            referencedColumns: ['id']
          },
        ]
      }
      log_stools: {
        Row: {
          created_at: string
          daily_log_id: string
          id: string
          notes: string
          occurred_at: string | null
        }
        Insert: {
          created_at?: string
          daily_log_id: string
          id?: string
          notes?: string
          occurred_at?: string | null
        }
        Update: {
          created_at?: string
          daily_log_id?: string
          id?: string
          notes?: string
          occurred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'log_stools_daily_log_id_fkey'
            columns: ['daily_log_id']
            isOneToOne: false
            referencedRelation: 'daily_logs'
            referencedColumns: ['id']
          },
        ]
      }
      log_supplement_intakes: {
        Row: {
          created_at: string
          daily_log_id: string
          supplement_id: string
        }
        Insert: {
          created_at?: string
          daily_log_id: string
          supplement_id: string
        }
        Update: {
          created_at?: string
          daily_log_id?: string
          supplement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'log_supplement_intakes_daily_log_id_fkey'
            columns: ['daily_log_id']
            isOneToOne: false
            referencedRelation: 'daily_logs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'log_supplement_intakes_supplement_id_fkey'
            columns: ['supplement_id']
            isOneToOne: false
            referencedRelation: 'supplements'
            referencedColumns: ['id']
          },
        ]
      }
      nutritionists: {
        Row: {
          created_at: string
          headline: string
          invite_code: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          headline?: string
          invite_code?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          headline?: string
          invite_code?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nutritionists_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          language: string
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          language?: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          language?: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
      supplements: {
        Row: {
          client_id: string
          created_at: string
          dose: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          take_daytime: boolean
          take_evening: boolean
          take_morning: boolean
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          dose?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          take_daytime?: boolean
          take_evening?: boolean
          take_morning?: boolean
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          dose?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          take_daytime?: boolean
          take_evening?: boolean
          take_morning?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'supplements_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['profile_id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_account: { Args: never; Returns: undefined }
      link_nutritionist: {
        Args: { code: string }
        Returns: {
          full_name: string
          id: string
        }[]
      }
      preview_nutritionist: {
        Args: { code: string }
        Returns: {
          full_name: string
          id: string
        }[]
      }
    }
    Enums: {
      meal_slot:
        | 'first_warm_drink'
        | 'breakfast'
        | 'second_breakfast'
        | 'lunch'
        | 'snack'
        | 'dinner'
      user_role: 'client' | 'nutritionist' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      meal_slot: [
        'first_warm_drink',
        'breakfast',
        'second_breakfast',
        'lunch',
        'snack',
        'dinner',
      ],
      user_role: ['client', 'nutritionist', 'admin'],
    },
  },
} as const
