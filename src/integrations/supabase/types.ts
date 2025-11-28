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
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_learning_plans: {
        Row: {
          generated_at: string | null
          id: string
          is_active: boolean | null
          plan_data: Json
          user_id: string
        }
        Insert: {
          generated_at?: string | null
          id?: string
          is_active?: boolean | null
          plan_data: Json
          user_id: string
        }
        Update: {
          generated_at?: string | null
          id?: string
          is_active?: boolean | null
          plan_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: Json | null
          created_at: string | null
          difficulty_level: number | null
          duration_minutes: number | null
          id: string
          is_ai_generated: boolean | null
          title: string
          title_kg: string | null
          title_ru: string | null
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          difficulty_level?: number | null
          duration_minutes?: number | null
          id?: string
          is_ai_generated?: boolean | null
          title: string
          title_kg?: string | null
          title_ru?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          difficulty_level?: number | null
          duration_minutes?: number | null
          id?: string
          is_ai_generated?: boolean | null
          title?: string
          title_kg?: string | null
          title_ru?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          language_preference: string | null
          last_activity_date: string | null
          level: number | null
          name: string | null
          points: number | null
          streak: number | null
          theme_preference: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          language_preference?: string | null
          last_activity_date?: string | null
          level?: number | null
          name?: string | null
          points?: number | null
          streak?: number | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          language_preference?: string | null
          last_activity_date?: string | null
          level?: number | null
          name?: string | null
          points?: number | null
          streak?: number | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_option: number
          created_at: string | null
          explanation: string | null
          explanation_kg: string | null
          explanation_ru: string | null
          id: string
          lesson_id: string | null
          options: Json
          order_index: number | null
          question_text: string
          question_text_kg: string | null
          question_text_ru: string | null
          test_id: string | null
          topic_id: string | null
        }
        Insert: {
          correct_option: number
          created_at?: string | null
          explanation?: string | null
          explanation_kg?: string | null
          explanation_ru?: string | null
          id?: string
          lesson_id?: string | null
          options: Json
          order_index?: number | null
          question_text: string
          question_text_kg?: string | null
          question_text_ru?: string | null
          test_id?: string | null
          topic_id?: string | null
        }
        Update: {
          correct_option?: number
          created_at?: string | null
          explanation?: string | null
          explanation_kg?: string | null
          explanation_ru?: string | null
          id?: string
          lesson_id?: string | null
          options?: Json
          order_index?: number | null
          question_text?: string
          question_text_kg?: string | null
          question_text_ru?: string | null
          test_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_terms: {
        Row: {
          created_at: string | null
          definition: string | null
          id: string
          term: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          definition?: string | null
          id?: string
          term: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          definition?: string | null
          id?: string
          term?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_terms_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          is_ai_generated: boolean | null
          subject: Database["public"]["Enums"]["subject_type"]
          title: string
          title_kg: string | null
          title_ru: string | null
          type: Database["public"]["Enums"]["test_type"]
        }
        Insert: {
          created_at?: string | null
          duration_minutes: number
          id?: string
          is_ai_generated?: boolean | null
          subject: Database["public"]["Enums"]["subject_type"]
          title: string
          title_kg?: string | null
          title_ru?: string | null
          type: Database["public"]["Enums"]["test_type"]
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          is_ai_generated?: boolean | null
          subject?: Database["public"]["Enums"]["subject_type"]
          title?: string
          title_kg?: string | null
          title_ru?: string | null
          type?: Database["public"]["Enums"]["test_type"]
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          level: number | null
          order_index: number | null
          parent_topic_id: string | null
          subject: Database["public"]["Enums"]["subject_type"]
          title: string
          title_kg: string | null
          title_ru: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          order_index?: number | null
          parent_topic_id?: string | null
          subject: Database["public"]["Enums"]["subject_type"]
          title: string
          title_kg?: string | null
          title_ru?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          order_index?: number | null
          parent_topic_id?: string | null
          subject?: Database["public"]["Enums"]["subject_type"]
          title?: string
          title_kg?: string | null
          title_ru?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement: Database["public"]["Enums"]["achievement_type"]
          id: string
          points_awarded: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement: Database["public"]["Enums"]["achievement_type"]
          id?: string
          points_awarded?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement?: Database["public"]["Enums"]["achievement_type"]
          id?: string
          points_awarded?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          progress_percentage: number | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          progress_percentage?: number | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          progress_percentage?: number | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tests: {
        Row: {
          ai_analysis: Json | null
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          score: number | null
          started_at: string | null
          test_id: string
          time_taken_seconds: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          test_id: string
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          test_id?: string
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_progress: {
        Row: {
          created_at: string | null
          id: string
          last_practiced: string | null
          mastery: Database["public"]["Enums"]["mastery_level"] | null
          progress_percentage: number | null
          topic_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          mastery?: Database["public"]["Enums"]["mastery_level"] | null
          progress_percentage?: number | null
          topic_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          mastery?: Database["public"]["Enums"]["mastery_level"] | null
          progress_percentage?: number | null
          topic_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
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
      achievement_type:
        | "first_lesson"
        | "first_test"
        | "streak_3"
        | "streak_7"
        | "streak_30"
        | "mastery_5"
        | "mastery_10"
        | "perfect_score"
        | "early_bird"
        | "night_owl"
      mastery_level: "not_attempted" | "weak" | "in_progress" | "mastered"
      subject_type:
        | "mathematics"
        | "russian"
        | "kyrgyz"
        | "chemistry"
        | "biology"
        | "physics"
        | "english"
      test_type: "ort" | "practice"
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
      achievement_type: [
        "first_lesson",
        "first_test",
        "streak_3",
        "streak_7",
        "streak_30",
        "mastery_5",
        "mastery_10",
        "perfect_score",
        "early_bird",
        "night_owl",
      ],
      mastery_level: ["not_attempted", "weak", "in_progress", "mastered"],
      subject_type: [
        "mathematics",
        "russian",
        "kyrgyz",
        "chemistry",
        "biology",
        "physics",
        "english",
      ],
      test_type: ["ort", "practice"],
    },
  },
} as const
