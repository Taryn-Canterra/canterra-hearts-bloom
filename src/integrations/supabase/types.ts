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
      deal_checklist_items: {
        Row: {
          client_visible: boolean
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deal_id: string
          description: string | null
          id: string
          label: string
          sort_order: number
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string
        }
        Insert: {
          client_visible?: boolean
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deal_id: string
          description?: string | null
          id?: string
          label: string
          sort_order?: number
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
        }
        Update: {
          client_visible?: boolean
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deal_id?: string
          description?: string | null
          id?: string
          label?: string
          sort_order?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_checklist_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deal_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deal_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          assigned_to: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission_pct: number | null
          created_at: string
          expected_close_date: string | null
          id: string
          notes: string | null
          price: number | null
          property_address: string | null
          property_id: string | null
          side: Database["public"]["Enums"]["deal_side"]
          source_lead_id: string | null
          source_lead_type: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          assigned_to: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission_pct?: number | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          property_address?: string | null
          property_id?: string | null
          side: Database["public"]["Enums"]["deal_side"]
          source_lead_id?: string | null
          source_lead_type?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          assigned_to?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission_pct?: number | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          property_address?: string | null
          property_id?: string | null
          side?: Database["public"]["Enums"]["deal_side"]
          source_lead_id?: string | null
          source_lead_type?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          assigned_to: string
          created_at: string
          id: string
          lead_id: string
          lead_type: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          id?: string
          lead_id: string
          lead_type: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          id?: string
          lead_id?: string
          lead_type?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      profiles: {
        Row: {
          avatar_url: string | null
          brokerage: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          brokerage?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          brokerage?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      analysis_status: "pending" | "analyzing" | "analyzed" | "failed"
      app_role: "admin" | "agent"
      deal_side: "buyer" | "seller"
      deal_stage:
        | "new_lead"
        | "qualified"
        | "property_tour_or_listing_prep"
        | "offer_drafted_or_listed"
        | "offer_accepted_under_contract"
        | "inspection_and_appraisal"
        | "financing_and_title"
        | "closing"
        | "closed_won"
        | "lost"
        | "withdrawn"
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
      app_role: ["admin", "agent"],
      deal_side: ["buyer", "seller"],
      deal_stage: [
        "new_lead",
        "qualified",
        "property_tour_or_listing_prep",
        "offer_drafted_or_listed",
        "offer_accepted_under_contract",
        "inspection_and_appraisal",
        "financing_and_title",
        "closing",
        "closed_won",
        "lost",
        "withdrawn",
      ],
      listing_status: ["active", "pending", "sold", "withdrawn"],
    },
  },
} as const
