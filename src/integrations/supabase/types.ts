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
      admin_topics: {
        Row: {
          ai_categories: string[] | null
          ai_labels: string[] | null
          ai_metadata: Json | null
          content_blocks: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_kg: string | null
          description_ru: string | null
          id: string
          is_published: boolean | null
          learning_styles: Json | null
          level_grade: number | null
          order_index: number | null
          parent_topic_id: string | null
          subject: string
          title: string
          title_kg: string | null
          title_ru: string | null
          updated_at: string | null
        }
        Insert: {
          ai_categories?: string[] | null
          ai_labels?: string[] | null
          ai_metadata?: Json | null
          content_blocks?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_kg?: string | null
          description_ru?: string | null
          id?: string
          is_published?: boolean | null
          learning_styles?: Json | null
          level_grade?: number | null
          order_index?: number | null
          parent_topic_id?: string | null
          subject: string
          title: string
          title_kg?: string | null
          title_ru?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_categories?: string[] | null
          ai_labels?: string[] | null
          ai_metadata?: Json | null
          content_blocks?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_kg?: string | null
          description_ru?: string | null
          id?: string
          is_published?: boolean | null
          learning_styles?: Json | null
          level_grade?: number | null
          order_index?: number | null
          parent_topic_id?: string | null
          subject?: string
          title?: string
          title_kg?: string | null
          title_ru?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "admin_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_training_datasets: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json | null
          dataset_type: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          dataset_type: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          dataset_type?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      ai_homework_feedback: {
        Row: {
          additional_exercises: Json | null
          corrections: string | null
          created_at: string
          feedback: string
          id: string
          score: number | null
          strengths: Json | null
          submission_id: string
          suggestions: string | null
          user_id: string
          weaknesses: Json | null
        }
        Insert: {
          additional_exercises?: Json | null
          corrections?: string | null
          created_at?: string
          feedback: string
          id?: string
          score?: number | null
          strengths?: Json | null
          submission_id: string
          suggestions?: string | null
          user_id: string
          weaknesses?: Json | null
        }
        Update: {
          additional_exercises?: Json | null
          corrections?: string | null
          created_at?: string
          feedback?: string
          id?: string
          score?: number | null
          strengths?: Json | null
          submission_id?: string
          suggestions?: string | null
          user_id?: string
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_homework_feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "homework_submissions"
            referencedColumns: ["id"]
          },
        ]
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
          plan_data?: Json
          predicted_timeline?: Json | null
          schedule?: Json | null
          target_topics?: Json | null
          updated_at?: string | null
          user_id?: string
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
      homework_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          submission_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          submission_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          submission_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_notifications_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "homework_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          notes: string | null
          points_awarded: number | null
          status: string
          subject: string
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          notes?: string | null
          points_awarded?: number | null
          status?: string
          subject: string
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          points_awarded?: number | null
          status?: string
          subject?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
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
      mini_test_results: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          mini_test_id: string
          score: number | null
          time_taken_seconds: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          mini_test_id: string
          score?: number | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          mini_test_id?: string
          score?: number | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_test_results_mini_test_id_fkey"
            columns: ["mini_test_id"]
            isOneToOne: false
            referencedRelation: "mini_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_tests: {
        Row: {
          created_at: string | null
          difficulty_level: number | null
          estimated_mastery_impact: number | null
          id: string
          questions: Json
          topic_id: string | null
          topic_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: number | null
          estimated_mastery_impact?: number | null
          id?: string
          questions: Json
          topic_id?: string | null
          topic_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          difficulty_level?: number | null
          estimated_mastery_impact?: number | null
          id?: string
          questions?: Json
          topic_id?: string | null
          topic_name?: string | null
          user_id?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
