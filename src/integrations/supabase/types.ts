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
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      dm_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      institution_applications: {
        Row: {
          contact_email: string
          created_at: string
          description: string
          id: string
          institution_name: string
          reviewed_at: string | null
          status: string
          user_id: string
          website: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          description?: string
          id?: string
          institution_name: string
          reviewed_at?: string | null
          status?: string
          user_id: string
          website?: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          description?: string
          id?: string
          institution_name?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
          website?: string
        }
        Relationships: []
      }
      institution_positions: {
        Row: {
          apply_url: string
          comment_count: number
          cover_url: string
          created_at: string
          deadline: string | null
          description: string
          field: string
          id: string
          institution_id: string
          like_count: number
          location_label: string
          position_type: string
          remote: boolean
          save_count: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          apply_url?: string
          comment_count?: number
          cover_url?: string
          created_at?: string
          deadline?: string | null
          description?: string
          field?: string
          id?: string
          institution_id: string
          like_count?: number
          location_label?: string
          position_type?: string
          remote?: boolean
          save_count?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          apply_url?: string
          comment_count?: number
          cover_url?: string
          created_at?: string
          deadline?: string | null
          description?: string
          field?: string
          id?: string
          institution_id?: string
          like_count?: number
          location_label?: string
          position_type?: string
          remote?: boolean
          save_count?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_positions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          contact_email: string
          cover_url: string
          created_at: string
          description: string
          id: string
          latitude: number | null
          location_label: string
          logo_url: string
          longitude: number | null
          name: string
          owner_id: string
          slug: string | null
          updated_at: string
          verified: boolean
          website: string
        }
        Insert: {
          contact_email?: string
          cover_url?: string
          created_at?: string
          description?: string
          id?: string
          latitude?: number | null
          location_label?: string
          logo_url?: string
          longitude?: number | null
          name: string
          owner_id: string
          slug?: string | null
          updated_at?: string
          verified?: boolean
          website?: string
        }
        Update: {
          contact_email?: string
          cover_url?: string
          created_at?: string
          description?: string
          id?: string
          latitude?: number | null
          location_label?: string
          logo_url?: string
          longitude?: number | null
          name?: string
          owner_id?: string
          slug?: string | null
          updated_at?: string
          verified?: boolean
          website?: string
        }
        Relationships: []
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
      position_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          position_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          position_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          position_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_comments_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "institution_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      position_reactions: {
        Row: {
          created_at: string
          id: string
          kind: string
          position_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          position_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          position_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_reactions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "institution_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      position_saves: {
        Row: {
          created_at: string
          id: string
          position_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_saves_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "institution_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments_social: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_social_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments_social"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_social_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          kind: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          hashtags: string[]
          id: string
          media_paths: string[]
          mentions: string[]
          project_id: string | null
          repost_of: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          media_paths?: string[]
          mentions?: string[]
          project_id?: string | null
          repost_of?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          media_paths?: string[]
          mentions?: string[]
          project_id?: string | null
          repost_of?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_repost_of_fkey"
            columns: ["repost_of"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
          latitude: number | null
          learning_style: string
          location: string
          location_label: string
          longitude: number | null
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
          latitude?: number | null
          learning_style?: string
          location?: string
          location_label?: string
          longitude?: number | null
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
          latitude?: number | null
          learning_style?: string
          location?: string
          location_label?: string
          longitude?: number | null
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
      project_tasks: {
        Row: {
          created_at: string
          created_by: string
          done: boolean
          due_at: string | null
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          done?: boolean
          due_at?: string | null
          id?: string
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          done?: boolean
          due_at?: string | null
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          cover_image_url: string
          created_at: string
          demo_url: string
          description: string
          funding_goal: number
          funding_raised: number
          github_url: string
          id: string
          latitude: number | null
          location_label: string
          longitude: number | null
          milestones: Json
          owner_id: string
          pitch: string
          skills_needed: string[]
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          completion_percentage?: number
          cover_image_url?: string
          created_at?: string
          demo_url?: string
          description?: string
          funding_goal?: number
          funding_raised?: number
          github_url?: string
          id?: string
          latitude?: number | null
          location_label?: string
          longitude?: number | null
          milestones?: Json
          owner_id: string
          pitch?: string
          skills_needed?: string[]
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          completion_percentage?: number
          cover_image_url?: string
          created_at?: string
          demo_url?: string
          description?: string
          funding_goal?: number
          funding_raised?: number
          github_url?: string
          id?: string
          latitude?: number | null
          location_label?: string
          longitude?: number | null
          milestones?: Json
          owner_id?: string
          pitch?: string
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_institution_application: {
        Args: { _app_id: string }
        Returns: string
      }
      get_or_create_conversation: { Args: { _other: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      reject_institution_application: {
        Args: { _app_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "mentor" | "mentee" | "institution" | "admin"
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
      app_role: ["mentor", "mentee", "institution", "admin"],
      request_status: ["pending", "accepted", "declined"],
    },
  },
} as const
