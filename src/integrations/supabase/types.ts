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
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          link: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          link?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          link?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string
          allow_messages_from: string
          availability_schedule: Json
          avatar_url: string
          bio: string
          certifications: Json
          communication_style: string
          contact_pref: string
          cover_url: string
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
          languages: string[]
          learning_style: string
          location: string
          looking_for_partners: boolean
          meeting_frequency: string
          mentorship_topics: string[]
          onboarded: boolean
          open_to_collab: boolean
          personality: string[]
          profile_visibility: string
          project_preferences: string[]
          response_time: string
          role: Database["public"]["Enums"]["app_role"] | null
          show_email: boolean
          skills: string[]
          social_facebook: string
          social_instagram: string
          social_linkedin: string
          social_x: string
          timezone: string
          updated_at: string
          website: string
        }
        Insert: {
          age_range?: string
          allow_messages_from?: string
          availability_schedule?: Json
          avatar_url?: string
          bio?: string
          certifications?: Json
          communication_style?: string
          contact_pref?: string
          cover_url?: string
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
          languages?: string[]
          learning_style?: string
          location?: string
          looking_for_partners?: boolean
          meeting_frequency?: string
          mentorship_topics?: string[]
          onboarded?: boolean
          open_to_collab?: boolean
          personality?: string[]
          profile_visibility?: string
          project_preferences?: string[]
          response_time?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          show_email?: boolean
          skills?: string[]
          social_facebook?: string
          social_instagram?: string
          social_linkedin?: string
          social_x?: string
          timezone?: string
          updated_at?: string
          website?: string
        }
        Update: {
          age_range?: string
          allow_messages_from?: string
          availability_schedule?: Json
          avatar_url?: string
          bio?: string
          certifications?: Json
          communication_style?: string
          contact_pref?: string
          cover_url?: string
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
          languages?: string[]
          learning_style?: string
          location?: string
          looking_for_partners?: boolean
          meeting_frequency?: string
          mentorship_topics?: string[]
          onboarded?: boolean
          open_to_collab?: boolean
          personality?: string[]
          profile_visibility?: string
          project_preferences?: string[]
          response_time?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          show_email?: boolean
          skills?: string[]
          social_facebook?: string
          social_instagram?: string
          social_linkedin?: string
          social_x?: string
          timezone?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      project_invites: {
        Row: {
          created_at: string
          from_user: string
          id: string
          message: string
          project_id: string
          status: string
          to_user: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          message?: string
          project_id: string
          status?: string
          to_user: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          message?: string
          project_id?: string
          status?: string
          to_user?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          joined_at: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      project_updates: {
        Row: {
          body: string
          created_at: string
          id: string
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          user_id?: string
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
      rate_limits: {
        Row: {
          action: string
          count: number
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
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
