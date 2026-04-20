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
          topic_context: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          topic_context?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          topic_context?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_learning_plans_v2: {
        Row: {
          daily_tasks: Json | null
          generated_at: string | null
          id: string
          is_active: boolean | null
          learning_strategy: string | null
          mastery_goals: Json | null
          mini_tests: Json | null
          ort_score_projection: Json | null
          participant_id: string | null
          plan_data: Json
          predicted_timeline: Json | null
          schedule: Json | null
          target_topics: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          daily_tasks?: Json | null
          generated_at?: string | null
          id?: string
          is_active?: boolean | null
          learning_strategy?: string | null
          mastery_goals?: Json | null
          mini_tests?: Json | null
          ort_score_projection?: Json | null
          participant_id?: string | null
          plan_data: Json
          predicted_timeline?: Json | null
          schedule?: Json | null
          target_topics?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          daily_tasks?: Json | null
          generated_at?: string | null
          id?: string
          is_active?: boolean | null
          learning_strategy?: string | null
          mastery_goals?: Json | null
          mini_tests?: Json | null
          ort_score_projection?: Json | null
          participant_id?: string | null
          plan_data?: Json
          predicted_timeline?: Json | null
          schedule?: Json | null
          target_topics?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_mistake_explanations: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string
          id: string
          question_id: string
          user_answer: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation: string
          id?: string
          question_id: string
          user_answer: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string
          id?: string
          question_id?: string
          user_answer?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          error_patterns: Json | null
          generated_at: string | null
          id: string
          is_active: boolean | null
          long_term_plan: Json | null
          motivation_message: string | null
          predicted_mastery: Json | null
          recommended_lessons: Json | null
          recommended_mini_tests: Json | null
          recommended_topics: Json | null
          short_term_plan: Json | null
          study_strategy: string | null
          user_id: string
          weak_topics: Json | null
        }
        Insert: {
          error_patterns?: Json | null
          generated_at?: string | null
          id?: string
          is_active?: boolean | null
          long_term_plan?: Json | null
          motivation_message?: string | null
          predicted_mastery?: Json | null
          recommended_lessons?: Json | null
          recommended_mini_tests?: Json | null
          recommended_topics?: Json | null
          short_term_plan?: Json | null
          study_strategy?: string | null
          user_id: string
          weak_topics?: Json | null
        }
        Update: {
          error_patterns?: Json | null
          generated_at?: string | null
          id?: string
          is_active?: boolean | null
          long_term_plan?: Json | null
          motivation_message?: string | null
          predicted_mastery?: Json | null
          recommended_lessons?: Json | null
          recommended_mini_tests?: Json | null
          recommended_topics?: Json | null
          short_term_plan?: Json | null
          study_strategy?: string | null
          user_id?: string
          weak_topics?: Json | null
        }
        Relationships: []
      }
      ai_request_logs: {
        Row: {
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          response_time_ms: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          response_time_ms?: number | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          response_time_ms?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      beta_access: {
        Row: {
          granted_at: string
          granted_by: string
          id: string
          invite_code_id: string | null
          is_active: boolean
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string
          id?: string
          invite_code_id?: string | null
          is_active?: boolean
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          id?: string
          invite_code_id?: string | null
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beta_access_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_whitelist: {
        Row: {
          created_at: string | null
          email: string
          group_type: Database["public"]["Enums"]["experiment_group"]
          id: string
          invite_code: string
          is_active: boolean | null
          notes: string | null
          participant_id: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          group_type?: Database["public"]["Enums"]["experiment_group"]
          id?: string
          invite_code: string
          is_active?: boolean | null
          notes?: string | null
          participant_id?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          group_type?: Database["public"]["Enums"]["experiment_group"]
          id?: string
          invite_code?: string
          is_active?: boolean | null
          notes?: string | null
          participant_id?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          times_used: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          times_used?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          times_used?: number
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
      math_questions: {
        Row: {
          column_a: string
          column_b: string
          correct_answer: string
          correct_explanation: string | null
          explanation_a: string | null
          explanation_b: string | null
          explanation_c: string | null
          explanation_d: string | null
          id: number
          instruction: string | null
          option_c: string | null
          option_d: string | null
          question_number: number
          test_id: number
          topic: string
        }
        Insert: {
          column_a: string
          column_b: string
          correct_answer: string
          correct_explanation?: string | null
          explanation_a?: string | null
          explanation_b?: string | null
          explanation_c?: string | null
          explanation_d?: string | null
          id?: number
          instruction?: string | null
          option_c?: string | null
          option_d?: string | null
          question_number: number
          test_id: number
          topic: string
        }
        Update: {
          column_a?: string
          column_b?: string
          correct_answer?: string
          correct_explanation?: string | null
          explanation_a?: string | null
          explanation_b?: string | null
          explanation_c?: string | null
          explanation_d?: string | null
          id?: number
          instruction?: string | null
          option_c?: string | null
          option_d?: string | null
          question_number?: number
          test_id?: number
          topic?: string
        }
        Relationships: []
      }
      math_test_questions: {
        Row: {
          column_a: string | null
          column_b: string | null
          correct_answer: string
          correct_explanation: string | null
          explanation_a: string | null
          explanation_b: string | null
          explanation_c: string | null
          explanation_d: string | null
          explanation_e: string | null
          id: number
          instruction: string | null
          options: Json | null
          question_number: number
          question_type: string
          test_id: number
          topic: string | null
        }
        Insert: {
          column_a?: string | null
          column_b?: string | null
          correct_answer: string
          correct_explanation?: string | null
          explanation_a?: string | null
          explanation_b?: string | null
          explanation_c?: string | null
          explanation_d?: string | null
          explanation_e?: string | null
          id?: number
          instruction?: string | null
          options?: Json | null
          question_number: number
          question_type: string
          test_id: number
          topic?: string | null
        }
        Update: {
          column_a?: string | null
          column_b?: string | null
          correct_answer?: string
          correct_explanation?: string | null
          explanation_a?: string | null
          explanation_b?: string | null
          explanation_c?: string | null
          explanation_d?: string | null
          explanation_e?: string | null
          id?: number
          instruction?: string | null
          options?: Json | null
          question_number?: number
          question_type?: string
          test_id?: number
          topic?: string | null
        }
        Relationships: []
      }
      pq_explanation_staging: {
        Row: {
          correct_explanation: string | null
          explanation_a: string | null
          explanation_b: string | null
          explanation_c: string | null
          explanation_d: string | null
          id: string
        }
        Insert: {
          correct_explanation?: string | null
          explanation_a?: string | null
          explanation_b?: string | null
          explanation_c?: string | null
          explanation_d?: string | null
          id: string
        }
        Update: {
          correct_explanation?: string | null
          explanation_a?: string | null
          explanation_b?: string | null
          explanation_c?: string | null
          explanation_d?: string | null
          id?: string
        }
        Relationships: []
      }
      practice_questions: {
        Row: {
          correct_answer: string
          correct_explanation: string | null
          created_at: string
          explanation_a: string | null
          explanation_b: string | null
          explanation_c: string | null
          explanation_d: string | null
          explanation_e: string | null
          id: string
          quality_reason: string | null
          quality_status: string
          question_data: Json
          question_type: string
          source: string
          topic: string
          user_id: string
        }
        Insert: {
          correct_answer: string
          correct_explanation?: string | null
          created_at?: string
          explanation_a?: string | null
          explanation_b?: string | null
          explanation_c?: string | null
          explanation_d?: string | null
          explanation_e?: string | null
          id?: string
          quality_reason?: string | null
          quality_status?: string
          question_data?: Json
          question_type?: string
          source?: string
          topic: string
          user_id: string
        }
        Update: {
          correct_answer?: string
          correct_explanation?: string | null
          created_at?: string
          explanation_a?: string | null
          explanation_b?: string | null
          explanation_c?: string | null
          explanation_d?: string | null
          explanation_e?: string | null
          id?: string
          quality_reason?: string | null
          quality_status?: string
          question_data?: Json
          question_type?: string
          source?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_responses: {
        Row: {
          correct_answer: string
          created_at: string
          data_version: string
          difficulty: string | null
          id: string
          is_correct: boolean
          is_reliable: boolean
          participant_id: string | null
          question_data: Json | null
          question_id: string | null
          question_index: number
          session_id: string
          time_spent_seconds: number | null
          topic: string | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          data_version?: string
          difficulty?: string | null
          id?: string
          is_correct?: boolean
          is_reliable?: boolean
          participant_id?: string | null
          question_data?: Json | null
          question_id?: string | null
          question_index: number
          session_id: string
          time_spent_seconds?: number | null
          topic?: string | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          data_version?: string
          difficulty?: string | null
          id?: string
          is_correct?: boolean
          is_reliable?: boolean
          participant_id?: string | null
          question_data?: Json | null
          question_id?: string | null
          question_index?: number
          session_id?: string
          time_spent_seconds?: number | null
          topic?: string | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_clean_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_session_questions: {
        Row: {
          created_at: string
          id: string
          order_index: number
          question_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          question_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          question_id?: string
          session_id?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          created_at: string
          data_version: string
          ended_at: string | null
          group_type: string | null
          id: string
          is_reliable: boolean
          num_correct: number | null
          num_tasks: number | null
          participant_id: string | null
          practice_type: string | null
          started_at: string
          status: string
          total_time_seconds: number | null
          user_id: string
          weak_topics: Json | null
        }
        Insert: {
          created_at?: string
          data_version?: string
          ended_at?: string | null
          group_type?: string | null
          id?: string
          is_reliable?: boolean
          num_correct?: number | null
          num_tasks?: number | null
          participant_id?: string | null
          practice_type?: string | null
          started_at?: string
          status?: string
          total_time_seconds?: number | null
          user_id: string
          weak_topics?: Json | null
        }
        Update: {
          created_at?: string
          data_version?: string
          ended_at?: string | null
          group_type?: string | null
          id?: string
          is_reliable?: boolean
          num_correct?: number | null
          num_tasks?: number | null
          participant_id?: string | null
          practice_type?: string | null
          started_at?: string
          status?: string
          total_time_seconds?: number | null
          user_id?: string
          weak_topics?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          group_type: Database["public"]["Enums"]["experiment_group"] | null
          id: string
          language_preference: string | null
          last_activity_date: string | null
          leaderboard_visible: boolean | null
          level: number | null
          name: string | null
          participant_id: string | null
          points: number | null
          streak: number | null
          theme_preference: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          group_type?: Database["public"]["Enums"]["experiment_group"] | null
          id: string
          language_preference?: string | null
          last_activity_date?: string | null
          leaderboard_visible?: boolean | null
          level?: number | null
          name?: string | null
          participant_id?: string | null
          points?: number | null
          streak?: number | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          group_type?: Database["public"]["Enums"]["experiment_group"] | null
          id?: string
          language_preference?: string | null
          last_activity_date?: string | null
          leaderboard_visible?: boolean | null
          level?: number | null
          name?: string | null
          participant_id?: string | null
          points?: number | null
          streak?: number | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          correct_answer: string | null
          created_at: string
          data_version: string
          difficulty: string | null
          id: string
          is_correct: boolean
          is_reliable: boolean
          participant_id: string | null
          question_id: string
          test_attempt_id: string
          time_spent_seconds: number | null
          topic: string | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          data_version?: string
          difficulty?: string | null
          id?: string
          is_correct?: boolean
          is_reliable?: boolean
          participant_id?: string | null
          question_id: string
          test_attempt_id: string
          time_spent_seconds?: number | null
          topic?: string | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          data_version?: string
          difficulty?: string | null
          id?: string
          is_correct?: boolean
          is_reliable?: boolean
          participant_id?: string | null
          question_id?: string
          test_attempt_id?: string
          time_spent_seconds?: number | null
          topic?: string | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_test_attempt_id_fkey"
            columns: ["test_attempt_id"]
            isOneToOne: false
            referencedRelation: "research_clean_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_test_attempt_id_fkey"
            columns: ["test_attempt_id"]
            isOneToOne: false
            referencedRelation: "user_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      question_explanations: {
        Row: {
          correct_answer: string
          created_at: string
          explanation_text: string
          id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation_text: string
          id?: string
          question_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation_text?: string
          id?: string
          question_id?: string
          updated_at?: string
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_minutes: number
          window_start: string
        }
        Insert: {
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_minutes?: number
          window_start?: string
        }
        Update: {
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_minutes?: number
          window_start?: string
        }
        Relationships: []
      }
      spaced_repetition: {
        Row: {
          correct_streak: number
          created_at: string
          id: string
          next_review_date: string
          question_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_streak?: number
          created_at?: string
          id?: string
          next_review_date?: string
          question_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_streak?: number
          created_at?: string
          id?: string
          next_review_date?: string
          question_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_access: {
        Row: {
          created_at: string
          id: string
          is_allowed: boolean
          participant_id: string
          test_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          participant_id: string
          test_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          participant_id?: string
          test_id?: number
          updated_at?: string
        }
        Relationships: []
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
      user_activity: {
        Row: {
          created_at: string
          daily_goal: number
          last_active_date: string | null
          streak: number
          tasks_completed_today: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          last_active_date?: string | null
          streak?: number
          tasks_completed_today?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal?: number
          last_active_date?: string | null
          streak?: number
          tasks_completed_today?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          answered_at: string
          correct_option: number
          data_version: string
          id: string
          is_correct: boolean
          is_reliable: boolean
          question_id: string
          selected_option: number
          test_id: string
          test_name: string
          topic: string | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          correct_option: number
          data_version?: string
          id?: string
          is_correct?: boolean
          is_reliable?: boolean
          question_id: string
          selected_option: number
          test_id: string
          test_name: string
          topic?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string
          correct_option?: number
          data_version?: string
          id?: string
          is_correct?: boolean
          is_reliable?: boolean
          question_id?: string
          selected_option?: number
          test_id?: string
          test_name?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_diagnostic_profile: {
        Row: {
          accuracy_score: number | null
          attention_level: number | null
          auditory_preference: number | null
          completed_at: string | null
          confidence: number | null
          consistency: number | null
          created_at: string | null
          diagnostic_completed: boolean | null
          exam_date: string | null
          example_preference: number | null
          grade_level: string | null
          id: string
          impulsiveness: number | null
          learning_style: string | null
          logic_score: number | null
          math_level: number | null
          months_until_exam: number | null
          motivation_type: string | null
          patience: number | null
          prefers_examples: boolean | null
          prefers_quizzes: boolean | null
          prefers_short_lessons: boolean | null
          prefers_step_by_step: boolean | null
          problem_driven_preference: number | null
          problem_solving_score: number | null
          speed_score: number | null
          step_by_step_preference: number | null
          stress_resistance: number | null
          target_ort_score: number | null
          text_preference: number | null
          updated_at: string | null
          user_id: string
          visual_preference: number | null
        }
        Insert: {
          accuracy_score?: number | null
          attention_level?: number | null
          auditory_preference?: number | null
          completed_at?: string | null
          confidence?: number | null
          consistency?: number | null
          created_at?: string | null
          diagnostic_completed?: boolean | null
          exam_date?: string | null
          example_preference?: number | null
          grade_level?: string | null
          id?: string
          impulsiveness?: number | null
          learning_style?: string | null
          logic_score?: number | null
          math_level?: number | null
          months_until_exam?: number | null
          motivation_type?: string | null
          patience?: number | null
          prefers_examples?: boolean | null
          prefers_quizzes?: boolean | null
          prefers_short_lessons?: boolean | null
          prefers_step_by_step?: boolean | null
          problem_driven_preference?: number | null
          problem_solving_score?: number | null
          speed_score?: number | null
          step_by_step_preference?: number | null
          stress_resistance?: number | null
          target_ort_score?: number | null
          text_preference?: number | null
          updated_at?: string | null
          user_id: string
          visual_preference?: number | null
        }
        Update: {
          accuracy_score?: number | null
          attention_level?: number | null
          auditory_preference?: number | null
          completed_at?: string | null
          confidence?: number | null
          consistency?: number | null
          created_at?: string | null
          diagnostic_completed?: boolean | null
          exam_date?: string | null
          example_preference?: number | null
          grade_level?: string | null
          id?: string
          impulsiveness?: number | null
          learning_style?: string | null
          logic_score?: number | null
          math_level?: number | null
          months_until_exam?: number | null
          motivation_type?: string | null
          patience?: number | null
          prefers_examples?: boolean | null
          prefers_quizzes?: boolean | null
          prefers_short_lessons?: boolean | null
          prefers_step_by_step?: boolean | null
          problem_driven_preference?: number | null
          problem_solving_score?: number | null
          speed_score?: number | null
          step_by_step_preference?: number | null
          stress_resistance?: number | null
          target_ort_score?: number | null
          text_preference?: number | null
          updated_at?: string | null
          user_id?: string
          visual_preference?: number | null
        }
        Relationships: []
      }
      user_learning_state: {
        Row: {
          completed_lessons: Json
          completed_tests: number
          created_at: string
          current_plan: Json
          current_step: string
          current_topic: string | null
          daily_goal: number
          daily_progress: number
          errors_count: number
          last_activity_at: string | null
          last_activity_date: string | null
          next_action: string
          next_reason: string | null
          streak: number
          strong_topics: Json
          topic_stats: Json
          updated_at: string
          user_id: string
          watched_videos: Json
          weak_topics: Json
        }
        Insert: {
          completed_lessons?: Json
          completed_tests?: number
          created_at?: string
          current_plan?: Json
          current_step?: string
          current_topic?: string | null
          daily_goal?: number
          daily_progress?: number
          errors_count?: number
          last_activity_at?: string | null
          last_activity_date?: string | null
          next_action?: string
          next_reason?: string | null
          streak?: number
          strong_topics?: Json
          topic_stats?: Json
          updated_at?: string
          user_id: string
          watched_videos?: Json
          weak_topics?: Json
        }
        Update: {
          completed_lessons?: Json
          completed_tests?: number
          created_at?: string
          current_plan?: Json
          current_step?: string
          current_topic?: string | null
          daily_goal?: number
          daily_progress?: number
          errors_count?: number
          last_activity_at?: string | null
          last_activity_date?: string | null
          next_action?: string
          next_reason?: string | null
          streak?: number
          strong_topics?: Json
          topic_stats?: Json
          updated_at?: string
          user_id?: string
          watched_videos?: Json
          weak_topics?: Json
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
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          participant_id: string | null
          session_end: string | null
          session_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          participant_id?: string | null
          session_end?: string | null
          session_start?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          participant_id?: string | null
          session_end?: string | null
          session_start?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tests: {
        Row: {
          ai_analysis: Json | null
          answers: Json | null
          attempt_number: number | null
          completed_at: string | null
          created_at: string | null
          data_version: string
          group_type: string | null
          id: string
          is_reliable: boolean
          participant_id: string | null
          score: number | null
          started_at: string | null
          test_id: string
          test_type: string | null
          time_taken_seconds: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          data_version?: string
          group_type?: string | null
          id?: string
          is_reliable?: boolean
          participant_id?: string | null
          score?: number | null
          started_at?: string | null
          test_id: string
          test_type?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          data_version?: string
          group_type?: string | null
          id?: string
          is_reliable?: boolean
          participant_id?: string | null
          score?: number | null
          started_at?: string | null
          test_id?: string
          test_type?: string | null
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
      user_topic_stats: {
        Row: {
          accuracy: number
          correct_answers: number
          created_at: string
          id: string
          topic: string
          total_attempts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          correct_answers?: number
          created_at?: string
          id?: string
          topic: string
          total_attempts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          correct_answers?: number
          created_at?: string
          id?: string
          topic?: string
          total_attempts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_solutions: {
        Row: {
          created_at: string | null
          id: string
          question_number: number
          test_id: string
          youtube_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_number: number
          test_id: string
          youtube_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_number?: number
          test_id?: string
          youtube_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      research_clean_attempts: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          data_version: string | null
          difficulty: string | null
          id: string | null
          is_correct: boolean | null
          is_reliable: boolean | null
          participant_id: string | null
          question_id: string | null
          test_attempt_id: string | null
          time_spent_seconds: number | null
          topic: string | null
          user_answer: string | null
          user_id: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          data_version?: string | null
          difficulty?: string | null
          id?: string | null
          is_correct?: boolean | null
          is_reliable?: boolean | null
          participant_id?: string | null
          question_id?: string | null
          test_attempt_id?: string | null
          time_spent_seconds?: number | null
          topic?: string | null
          user_answer?: string | null
          user_id?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          data_version?: string | null
          difficulty?: string | null
          id?: string | null
          is_correct?: boolean | null
          is_reliable?: boolean | null
          participant_id?: string | null
          question_id?: string | null
          test_attempt_id?: string | null
          time_spent_seconds?: number | null
          topic?: string | null
          user_answer?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_test_attempt_id_fkey"
            columns: ["test_attempt_id"]
            isOneToOne: false
            referencedRelation: "research_clean_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_test_attempt_id_fkey"
            columns: ["test_attempt_id"]
            isOneToOne: false
            referencedRelation: "user_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      research_clean_practice: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          data_version: string | null
          difficulty: string | null
          id: string | null
          is_correct: boolean | null
          is_reliable: boolean | null
          participant_id: string | null
          question_data: Json | null
          question_index: number | null
          session_id: string | null
          time_spent_seconds: number | null
          topic: string | null
          user_answer: string | null
          user_id: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          data_version?: string | null
          difficulty?: string | null
          id?: string | null
          is_correct?: boolean | null
          is_reliable?: boolean | null
          participant_id?: string | null
          question_data?: Json | null
          question_index?: number | null
          session_id?: string | null
          time_spent_seconds?: number | null
          topic?: string | null
          user_answer?: string | null
          user_id?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          data_version?: string | null
          difficulty?: string | null
          id?: string | null
          is_correct?: boolean | null
          is_reliable?: boolean | null
          participant_id?: string | null
          question_data?: Json | null
          question_index?: number | null
          session_id?: string | null
          time_spent_seconds?: number | null
          topic?: string | null
          user_answer?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_clean_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      research_clean_sessions: {
        Row: {
          created_at: string | null
          data_version: string | null
          ended_at: string | null
          group_type: string | null
          id: string | null
          is_reliable: boolean | null
          num_correct: number | null
          num_tasks: number | null
          participant_id: string | null
          practice_type: string | null
          started_at: string | null
          total_time_seconds: number | null
          user_id: string | null
          weak_topics: Json | null
        }
        Insert: {
          created_at?: string | null
          data_version?: string | null
          ended_at?: string | null
          group_type?: string | null
          id?: string | null
          is_reliable?: boolean | null
          num_correct?: number | null
          num_tasks?: number | null
          participant_id?: string | null
          practice_type?: string | null
          started_at?: string | null
          total_time_seconds?: number | null
          user_id?: string | null
          weak_topics?: Json | null
        }
        Update: {
          created_at?: string | null
          data_version?: string | null
          ended_at?: string | null
          group_type?: string | null
          id?: string | null
          is_reliable?: boolean | null
          num_correct?: number | null
          num_tasks?: number | null
          participant_id?: string | null
          practice_type?: string | null
          started_at?: string | null
          total_time_seconds?: number | null
          user_id?: string | null
          weak_topics?: Json | null
        }
        Relationships: []
      }
      research_clean_tests: {
        Row: {
          ai_analysis: Json | null
          answers: Json | null
          attempt_number: number | null
          completed_at: string | null
          created_at: string | null
          data_version: string | null
          group_type: string | null
          id: string | null
          is_reliable: boolean | null
          participant_id: string | null
          score: number | null
          started_at: string | null
          test_id: string | null
          test_type: string | null
          time_taken_seconds: number | null
          total_questions: number | null
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          data_version?: string | null
          group_type?: string | null
          id?: string | null
          is_reliable?: boolean | null
          participant_id?: string | null
          score?: number | null
          started_at?: string | null
          test_id?: string | null
          test_type?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          data_version?: string | null
          group_type?: string | null
          id?: string | null
          is_reliable?: boolean | null
          participant_id?: string | null
          score?: number | null
          started_at?: string | null
          test_id?: string | null
          test_type?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id?: string | null
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
      research_topic_metrics: {
        Row: {
          accuracy_pct: number | null
          attempts: number | null
          correct: number | null
          group_type: string | null
          topic: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      research_user_metrics: {
        Row: {
          accuracy_pct: number | null
          ai_usage_count: number | null
          avg_time_per_question: number | null
          group_type: string | null
          improvement: number | null
          post_score_pct: number | null
          practice_attempts: number | null
          pre_score_pct: number | null
          total_questions_answered: number | null
          total_sessions: number | null
          total_tests: number | null
          total_time_seconds: number | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_pq_explanations: { Args: never; Returns: number }
      apply_practice_explanations: { Args: { _payload: Json }; Returns: number }
      check_rate_limit: {
        Args: {
          _endpoint: string
          _max_requests: number
          _user_id: string
          _window_minutes: number
        }
        Returns: Json
      }
      get_lesson_video_url: {
        Args: { expires_in?: number; video_path: string }
        Returns: string
      }
      get_practice_question_pool: {
        Args: {
          max_rows?: number
          recent_question_ids?: string[]
          requested_topic?: string
        }
        Returns: {
          correct_answer: string
          correct_explanation: string
          explanation_a: string
          explanation_b: string
          explanation_c: string
          explanation_d: string
          explanation_e: string
          id: string
          quality_status: string
          question_data: Json
          question_type: string
          topic: string
        }[]
      }
      has_beta_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_invite_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      validate_whitelist_login: {
        Args: { _email: string; _invite_code: string }
        Returns: Json
      }
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
      app_role: "admin" | "moderator" | "user"
      experiment_group: "ai" | "control" | "showcase"
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
      app_role: ["admin", "moderator", "user"],
      experiment_group: ["ai", "control", "showcase"],
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
