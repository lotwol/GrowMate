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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      crop_placements: {
        Row: {
          cell_col: number | null
          cell_row: number | null
          created_at: string
          crop_id: string
          id: string
          layout_id: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          cell_col?: number | null
          cell_row?: number | null
          created_at?: string
          crop_id: string
          id?: string
          layout_id: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          cell_col?: number | null
          cell_row?: number | null
          created_at?: string
          crop_id?: string
          id?: string
          layout_id?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_placements_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_placements_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "garden_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          category: Database["public"]["Enums"]["crop_category"]
          cost: number | null
          created_at: string
          emoji: string | null
          garden_id: string | null
          harvest_date: string | null
          id: string
          name: string
          notes: string | null
          season_year: number | null
          sow_date: string | null
          status: Database["public"]["Enums"]["crop_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["crop_category"]
          cost?: number | null
          created_at?: string
          emoji?: string | null
          garden_id?: string | null
          harvest_date?: string | null
          id?: string
          name: string
          notes?: string | null
          season_year?: number | null
          sow_date?: string | null
          status?: Database["public"]["Enums"]["crop_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["crop_category"]
          cost?: number | null
          created_at?: string
          emoji?: string | null
          garden_id?: string | null
          harvest_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          season_year?: number | null
          sow_date?: string | null
          status?: Database["public"]["Enums"]["crop_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crops_garden_id_fkey"
            columns: ["garden_id"]
            isOneToOne: false
            referencedRelation: "gardens"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          activities: string[] | null
          content: string | null
          created_at: string
          entry_date: string
          id: string
          mood_garden: number | null
          season_year: number | null
          title: string | null
          updated_at: string
          user_id: string
          wellbeing_mental: number | null
          wellbeing_physical: number | null
          wellbeing_social: number | null
        }
        Insert: {
          activities?: string[] | null
          content?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          mood_garden?: number | null
          season_year?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          wellbeing_mental?: number | null
          wellbeing_physical?: number | null
          wellbeing_social?: number | null
        }
        Update: {
          activities?: string[] | null
          content?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          mood_garden?: number | null
          season_year?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          wellbeing_mental?: number | null
          wellbeing_physical?: number | null
          wellbeing_social?: number | null
        }
        Relationships: []
      }
      garden_layouts: {
        Row: {
          cols: number | null
          created_at: string
          garden_id: string
          id: string
          layout_type: string
          photo_url: string | null
          rows: number | null
          season_year: number
          updated_at: string
          user_id: string
          zones: Json | null
        }
        Insert: {
          cols?: number | null
          created_at?: string
          garden_id: string
          id?: string
          layout_type?: string
          photo_url?: string | null
          rows?: number | null
          season_year?: number
          updated_at?: string
          user_id: string
          zones?: Json | null
        }
        Update: {
          cols?: number | null
          created_at?: string
          garden_id?: string
          id?: string
          layout_type?: string
          photo_url?: string | null
          rows?: number | null
          season_year?: number
          updated_at?: string
          user_id?: string
          zones?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "garden_layouts_garden_id_fkey"
            columns: ["garden_id"]
            isOneToOne: false
            referencedRelation: "gardens"
            referencedColumns: ["id"]
          },
        ]
      }
      gardens: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          size_sqm: number | null
          type: Database["public"]["Enums"]["garden_type"][]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          size_sqm?: number | null
          type?: Database["public"]["Enums"]["garden_type"][]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          size_sqm?: number | null
          type?: Database["public"]["Enums"]["garden_type"][]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          custom_reason: string | null
          display_name: string | null
          id: string
          location: string | null
          onboarding_completed: boolean | null
          planner_score: number | null
          profiles: string[] | null
          result_vs_joy_score: number | null
          time_score: number | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          custom_reason?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          planner_score?: number | null
          profiles?: string[] | null
          result_vs_joy_score?: number | null
          time_score?: number | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          custom_reason?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          planner_score?: number | null
          profiles?: string[] | null
          result_vs_joy_score?: number | null
          time_score?: number | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      seed_inventory: {
        Row: {
          best_before: string | null
          category: Database["public"]["Enums"]["crop_category"]
          cost: number | null
          created_at: string
          id: string
          name: string
          notes: string | null
          purchased_from: string | null
          quantity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_before?: string | null
          category?: Database["public"]["Enums"]["crop_category"]
          cost?: number | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          purchased_from?: string | null
          quantity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_before?: string | null
          category?: Database["public"]["Enums"]["crop_category"]
          cost?: number | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          purchased_from?: string | null
          quantity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      crop_category: "grönsak" | "ört" | "frukt" | "bär" | "blomma"
      crop_status:
        | "planerad"
        | "sådd"
        | "grodd"
        | "utplanterad"
        | "skördad"
        | "misslyckad"
      garden_type: "friland" | "balkong" | "växthus" | "pallkrage" | "kruka"
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
    Enums: {
      crop_category: ["grönsak", "ört", "frukt", "bär", "blomma"],
      crop_status: [
        "planerad",
        "sådd",
        "grodd",
        "utplanterad",
        "skördad",
        "misslyckad",
      ],
      garden_type: ["friland", "balkong", "växthus", "pallkrage", "kruka"],
    },
  },
} as const
