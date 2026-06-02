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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      connection_requests: {
        Row: {
          created_at: string
          from_user: string
          id: string
          message: string
          status: Database["public"]["Enums"]["request_status"]
          to_user: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["request_status"]
          to_user: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["request_status"]
          to_user?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          bio: string
          created_at: string
          education: Json
          experience: Json
          experience_level: string
          full_name: string
          goals: string[]
          headline: string
          hours_per_week: number
          id: string
          industries: string[]
          interests: string[]
          location: string
          looking_for_partners: boolean
          onboarded: boolean
          open_to_collab: boolean
          project_preferences: string[]
          role: Database["public"]["Enums"]["app_role"] | null
          skills: string[]
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          bio?: string
          created_at?: string
          education?: Json
          experience?: Json
          experience_level?: string
          full_name?: string
          goals?: string[]
          headline?: string
          hours_per_week?: number
          id: string
          industries?: string[]
          interests?: string[]
          location?: string
          looking_for_partners?: boolean
          onboarded?: boolean
          open_to_collab?: boolean
          project_preferences?: string[]
          role?: Database["public"]["Enums"]["app_role"] | null
          skills?: string[]
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          bio?: string
          created_at?: string
          education?: Json
          experience?: Json
          experience_level?: string
          full_name?: string
          goals?: string[]
          headline?: string
          hours_per_week?: number
          id?: string
          industries?: string[]
          interests?: string[]
          location?: string
          looking_for_partners?: boolean
          onboarded?: boolean
          open_to_collab?: boolean
          project_preferences?: string[]
          role?: Database["public"]["Enums"]["app_role"] | null
          skills?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          completion_percentage: number
          created_at: string
          demo_url: string
          description: string
          funding_goal: number
          funding_raised: number
          github_url: string
          id: string
          milestones: Json
          owner_id: string
          skills_needed: string[]
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          completion_percentage?: number
          created_at?: string
          demo_url?: string
          description?: string
          funding_goal?: number
          funding_raised?: number
          github_url?: string
          id?: string
          milestones?: Json
          owner_id: string
          skills_needed?: string[]
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          demo_url?: string
          description?: string
          funding_goal?: number
          funding_raised?: number
          github_url?: string
          id?: string
          milestones?: Json
          owner_id?: string
          skills_needed?: string[]
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "mentor" | "mentee"
      request_status: "pending" | "accepted" | "declined"
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
      app_role: ["mentor", "mentee"],
      request_status: ["pending", "accepted", "declined"],
    },
  },
} as const
