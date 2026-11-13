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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      feedback: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          message: string
          page: string | null
          user_id: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          message: string
          page?: string | null
          user_id?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          message?: string
          page?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      posting_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          position: number
          posting_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          position: number
          posting_id: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          posting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posting_steps_posting_fkey"
            columns: ["posting_id", "user_id"]
            isOneToOne: false
            referencedRelation: "postings"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      postings: {
        Row: {
          ai_raw: Json | null
          company: string
          company_size: string | null
          confirmed: Json | null
          created_at: string
          deadline_at: string | null
          deadline_kind: string
          deadline_time_known: boolean
          employment_type: string | null
          id: string
          is_sample: boolean
          memo: string | null
          period: string | null
          job_title: string
          location: string | null
          priority: string
          required_docs: string[]
          source_kind: string
          source_text: string | null
          source_url: string | null
          source_url_normalized: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_raw?: Json | null
          company: string
          company_size?: string | null
          confirmed?: Json | null
          created_at?: string
          deadline_at?: string | null
          deadline_kind: string
          deadline_time_known?: boolean
          employment_type?: string | null
          id?: string
          is_sample?: boolean
          memo?: string | null
          period?: string | null
          job_title: string
          location?: string | null
          priority?: string
          required_docs?: string[]
          source_kind: string
          source_text?: string | null
          source_url?: string | null
          source_url_normalized?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_raw?: Json | null
          company?: string
          company_size?: string | null
          confirmed?: Json | null
          created_at?: string
          deadline_at?: string | null
          deadline_kind?: string
          deadline_time_known?: boolean
          employment_type?: string | null
          id?: string
          is_sample?: boolean
          memo?: string | null
          period?: string | null
          job_title?: string
          location?: string | null
          priority?: string
          required_docs?: string[]
          source_kind?: string
          source_text?: string | null
          source_url?: string | null
          source_url_normalized?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prep_items: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          label: string
          position: number
          posting_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          label: string
          position: number
          posting_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          label?: string
          position?: number
          posting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prep_items_posting_fkey"
            columns: ["posting_id", "user_id"]
            isOneToOne: false
            referencedRelation: "postings"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      prep_subtasks: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          label: string
          position: number
          prep_item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          label: string
          position: number
          prep_item_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          label?: string
          position?: number
          prep_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prep_subtasks_prep_item_fkey"
            columns: ["prep_item_id", "user_id"]
            isOneToOne: false
            referencedRelation: "prep_items"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_sample_postings: { Args: never; Returns: number }
      delete_my_account: { Args: never; Returns: undefined }
      use_ai_quota: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
