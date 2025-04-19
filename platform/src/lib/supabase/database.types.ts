export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      event_details: {
        Row: {
          contact_email: string | null
          end_date: string | null
          event_name: string
          id: number
          location: string | null
          registration_deadline: string | null
          start_date: string | null
          submission_deadline: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          end_date?: string | null
          event_name?: string
          id?: number
          location?: string | null
          registration_deadline?: string | null
          start_date?: string | null
          submission_deadline?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          end_date?: string | null
          event_name?: string
          id?: number
          location?: string | null
          registration_deadline?: string | null
          start_date?: string | null
          submission_deadline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          question: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          question: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          accessibility_needs: string | null
          additional_notes: string | null
          areas_of_interest: string | null
          can_attend_may_3_4: Database["public"]["Enums"]["attendance_option"]
          complementary_perspectives: string | null
          created_at: string
          dietary_restrictions: string | null
          discussion_confidence: number
          email: string | null
          familiarity_analytic: number
          familiarity_continental: number
          familiarity_other: number
          familiarity_tech_concepts: number
          full_name: string
          how_heard: Database["public"]["Enums"]["referral_source"]
          how_heard_other: string | null
          id: string
          may_3_4_comment: string | null
          mentorship_areas: string | null
          mentorship_preference:
            | Database["public"]["Enums"]["mentorship_role"]
            | null
          philosophical_interests: string[]
          philosophical_traditions: string[]
          preferred_teammates: string | null
          preferred_working_style: Database["public"]["Enums"]["working_style"]
          prior_courses: string[] | null
          prior_hackathon_details: string | null
          prior_hackathon_experience: boolean
          program: string
          skill_critique: number
          skill_research: number
          skill_speaking: number
          skill_synthesis: number
          skill_writing: number
          teammate_similarity: number
          theme_rankings: Json
          theme_suggestion: string | null
          university: string
          updated_at: string
          user_id: string | null
          workshop_rankings: Json
          writing_confidence: number
          year_of_study: number
        }
        Insert: {
          accessibility_needs?: string | null
          additional_notes?: string | null
          areas_of_interest?: string | null
          can_attend_may_3_4: Database["public"]["Enums"]["attendance_option"]
          complementary_perspectives?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          discussion_confidence: number
          email?: string | null
          familiarity_analytic: number
          familiarity_continental: number
          familiarity_other: number
          familiarity_tech_concepts: number
          full_name: string
          how_heard: Database["public"]["Enums"]["referral_source"]
          how_heard_other?: string | null
          id?: string
          may_3_4_comment?: string | null
          mentorship_areas?: string | null
          mentorship_preference?:
            | Database["public"]["Enums"]["mentorship_role"]
            | null
          philosophical_interests: string[]
          philosophical_traditions: string[]
          preferred_teammates?: string | null
          preferred_working_style: Database["public"]["Enums"]["working_style"]
          prior_courses?: string[] | null
          prior_hackathon_details?: string | null
          prior_hackathon_experience: boolean
          program: string
          skill_critique: number
          skill_research: number
          skill_speaking: number
          skill_synthesis: number
          skill_writing: number
          teammate_similarity: number
          theme_rankings: Json
          theme_suggestion?: string | null
          university: string
          updated_at?: string
          user_id?: string | null
          workshop_rankings: Json
          writing_confidence: number
          year_of_study: number
        }
        Update: {
          accessibility_needs?: string | null
          additional_notes?: string | null
          areas_of_interest?: string | null
          can_attend_may_3_4?: Database["public"]["Enums"]["attendance_option"]
          complementary_perspectives?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          discussion_confidence?: number
          email?: string | null
          familiarity_analytic?: number
          familiarity_continental?: number
          familiarity_other?: number
          familiarity_tech_concepts?: number
          full_name?: string
          how_heard?: Database["public"]["Enums"]["referral_source"]
          how_heard_other?: string | null
          id?: string
          may_3_4_comment?: string | null
          mentorship_areas?: string | null
          mentorship_preference?:
            | Database["public"]["Enums"]["mentorship_role"]
            | null
          philosophical_interests?: string[]
          philosophical_traditions?: string[]
          preferred_teammates?: string | null
          preferred_working_style?: Database["public"]["Enums"]["working_style"]
          prior_courses?: string[] | null
          prior_hackathon_details?: string | null
          prior_hackathon_experience?: boolean
          program?: string
          skill_critique?: number
          skill_research?: number
          skill_speaking?: number
          skill_synthesis?: number
          skill_writing?: number
          teammate_similarity?: number
          theme_rankings?: Json
          theme_suggestion?: string | null
          university?: string
          updated_at?: string
          user_id?: string | null
          workshop_rankings?: Json
          writing_confidence?: number
          year_of_study?: number
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          item_date: string
          location: string | null
          speaker: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          item_date: string
          location?: string | null
          speaker?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          item_date?: string
          location?: string | null
          speaker?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          analytic_traditions: Json | null
          continental_traditions: Json | null
          created_at: string | null
          description: string
          id: string
          is_selected: boolean | null
          suggested_readings: Json | null
          title: string
        }
        Insert: {
          analytic_traditions?: Json | null
          continental_traditions?: Json | null
          created_at?: string | null
          description: string
          id?: string
          is_selected?: boolean | null
          suggested_readings?: Json | null
          title: string
        }
        Update: {
          analytic_traditions?: Json | null
          continental_traditions?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          is_selected?: boolean | null
          suggested_readings?: Json | null
          title?: string
        }
        Relationships: []
      }
      workshops: {
        Row: {
          created_at: string | null
          description: string
          id: string
          relevant_themes: Json
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          relevant_themes: Json
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          relevant_themes?: Json
          title?: string
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
      attendance_option: "yes" | "no" | "maybe"
      mentorship_role: "mentor" | "mentee" | "no_preference"
      referral_source:
        | "email"
        | "professor"
        | "friend"
        | "department"
        | "social_media"
        | "other"
      user_role: "admin" | "participant" | "judge" | "team_member"
      working_style: "structured" | "exploratory" | "balanced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_option: ["yes", "no", "maybe"],
      mentorship_role: ["mentor", "mentee", "no_preference"],
      referral_source: [
        "email",
        "professor",
        "friend",
        "department",
        "social_media",
        "other",
      ],
      user_role: ["admin", "participant", "judge", "team_member"],
      working_style: ["structured", "exploratory", "balanced"],
    },
  },
} as const
