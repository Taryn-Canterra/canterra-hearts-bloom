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
      listing_analysis_runs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          model: string
          property_id: string
          raw_response: Json | null
          success: boolean
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model: string
          property_id: string
          raw_response?: Json | null
          success: boolean
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model?: string
          property_id?: string
          raw_response?: Json | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "listing_analysis_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          acres: number | null
          address: string | null
          ai_tags: string[]
          analysis_status: Database["public"]["Enums"]["analysis_status"]
          analyzed_at: string | null
          baths: number | null
          beds: number | null
          brokerage_name: string | null
          city: string | null
          county: string | null
          created_at: string
          days_on_market: number | null
          description: string | null
          equine_confidence: number | null
          equine_features: string[]
          equine_reasoning: string | null
          id: string
          is_equine: boolean | null
          latitude: number | null
          listing_agent_email: string | null
          listing_agent_name: string | null
          listing_agent_phone: string | null
          longitude: number | null
          mls_number: string | null
          paddocks: number | null
          photos: string[]
          price: number | null
          primary_photo: string | null
          property_type: string | null
          raw_payload: Json | null
          source: string
          sqft: number | null
          stalls: number | null
          state: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          acres?: number | null
          address?: string | null
          ai_tags?: string[]
          analysis_status?: Database["public"]["Enums"]["analysis_status"]
          analyzed_at?: string | null
          baths?: number | null
          beds?: number | null
          brokerage_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          days_on_market?: number | null
          description?: string | null
          equine_confidence?: number | null
          equine_features?: string[]
          equine_reasoning?: string | null
          id?: string
          is_equine?: boolean | null
          latitude?: number | null
          listing_agent_email?: string | null
          listing_agent_name?: string | null
          listing_agent_phone?: string | null
          longitude?: number | null
          mls_number?: string | null
          paddocks?: number | null
          photos?: string[]
          price?: number | null
          primary_photo?: string | null
          property_type?: string | null
          raw_payload?: Json | null
          source?: string
          sqft?: number | null
          stalls?: number | null
          state?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          acres?: number | null
          address?: string | null
          ai_tags?: string[]
          analysis_status?: Database["public"]["Enums"]["analysis_status"]
          analyzed_at?: string | null
          baths?: number | null
          beds?: number | null
          brokerage_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          days_on_market?: number | null
          description?: string | null
          equine_confidence?: number | null
          equine_features?: string[]
          equine_reasoning?: string | null
          id?: string
          is_equine?: boolean | null
          latitude?: number | null
          listing_agent_email?: string | null
          listing_agent_name?: string | null
          listing_agent_phone?: string | null
          longitude?: number | null
          mls_number?: string | null
          paddocks?: number | null
          photos?: string[]
          price?: number | null
          primary_photo?: string | null
          property_type?: string | null
          raw_payload?: Json | null
          source?: string
          sqft?: number | null
          stalls?: number | null
          state?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      property_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          property_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          property_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          property_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          criteria: Json
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          email?: string
          id?: string
          source?: string
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
      analysis_status: "pending" | "analyzing" | "analyzed" | "failed"
      listing_status: "active" | "pending" | "sold" | "withdrawn"
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
      analysis_status: ["pending", "analyzing", "analyzed", "failed"],
      listing_status: ["active", "pending", "sold", "withdrawn"],
    },
  },
} as const
