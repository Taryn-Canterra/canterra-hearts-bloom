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
      collection_items: {
        Row: {
          added_at: string
          agent_notes: string | null
          buyer_notes: string | null
          collection_id: string
          id: string
          match_against_search: string | null
          match_generated_at: string | null
          match_reasoning: string | null
          match_score: number | null
          property_id: string
          reaction:
            | Database["public"]["Enums"]["collection_item_reaction"]
            | null
          status: Database["public"]["Enums"]["collection_item_status"]
        }
        Insert: {
          added_at?: string
          agent_notes?: string | null
          buyer_notes?: string | null
          collection_id: string
          id?: string
          match_against_search?: string | null
          match_generated_at?: string | null
          match_reasoning?: string | null
          match_score?: number | null
          property_id: string
          reaction?:
            | Database["public"]["Enums"]["collection_item_reaction"]
            | null
          status?: Database["public"]["Enums"]["collection_item_status"]
        }
        Update: {
          added_at?: string
          agent_notes?: string | null
          buyer_notes?: string | null
          collection_id?: string
          id?: string
          match_against_search?: string | null
          match_generated_at?: string | null
          match_reasoning?: string | null
          match_score?: number | null
          property_id?: string
          reaction?:
            | Database["public"]["Enums"]["collection_item_reaction"]
            | null
          status?: Database["public"]["Enums"]["collection_item_status"]
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          agent_user_id: string | null
          created_at: string
          description: string | null
          id: string
          is_shared: boolean
          name: string
          share_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_user_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_shared?: boolean
          name: string
          share_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_user_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_shared?: boolean
          name?: string
          share_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      deal_clients: {
        Row: {
          accepted_at: string | null
          client_email: string
          client_user_id: string | null
          created_at: string
          deal_id: string
          id: string
          invited_at: string
          invited_by: string
        }
        Insert: {
          accepted_at?: string | null
          client_email: string
          client_user_id?: string | null
          created_at?: string
          deal_id: string
          id?: string
          invited_at?: string
          invited_by: string
        }
        Update: {
          accepted_at?: string | null
          client_email?: string
          client_user_id?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_clients_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_deadline_reminders_sent: {
        Row: {
          deadline_field: string
          deadline_value: string
          deal_id: string
          id: string
          reminder_window: string
          sent_at: string
        }
        Insert: {
          deadline_field: string
          deadline_value: string
          deal_id: string
          id?: string
          reminder_window: string
          sent_at?: string
        }
        Update: {
          deadline_field?: string
          deadline_value?: string
          deal_id?: string
          id?: string
          reminder_window?: string
          sent_at?: string
        }
        Relationships: []
      }
      deal_documents: {
        Row: {
          category: string | null
          created_at: string
          deal_id: string
          filename: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string
          visible_to_client: boolean
        }
        Insert: {
          category?: string | null
          created_at?: string
          deal_id: string
          filename: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by: string
          visible_to_client?: boolean
        }
        Update: {
          category?: string | null
          created_at?: string
          deal_id?: string
          filename?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_esign_requests: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string
          document_name: string
          external_envelope_id: string | null
          external_provider: string | null
          id: string
          sent_at: string
          sent_to_email: string
          signed_at: string | null
          signing_url: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id: string
          document_name: string
          external_envelope_id?: string | null
          external_provider?: string | null
          id?: string
          sent_at?: string
          sent_to_email: string
          signed_at?: string | null
          signing_url?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string
          document_name?: string
          external_envelope_id?: string | null
          external_provider?: string | null
          id?: string
          sent_at?: string
          sent_to_email?: string
          signed_at?: string | null
          signing_url?: string | null
          status?: string
        }
        Relationships: []
      }
      deal_lender_milestones: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          milestone: string
          notes: string | null
          reached_at: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          milestone: string
          notes?: string | null
          reached_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          milestone?: string
          notes?: string | null
          reached_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      deal_listing_metrics: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          inquiries: number
          recorded_on: string
          saves: number
          showing_requests: number
          views: number
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          inquiries?: number
          recorded_on?: string
          saves?: number
          showing_requests?: number
          views?: number
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          inquiries?: number
          recorded_on?: string
          saves?: number
          showing_requests?: number
          views?: number
        }
        Relationships: []
      }
      deal_maintenance_reminders: {
        Row: {
          category: string | null
          completed: boolean
          created_at: string
          deal_id: string
          description: string | null
          due_on: string | null
          id: string
          recurrence: string | null
          title: string
        }
        Insert: {
          category?: string | null
          completed?: boolean
          created_at?: string
          deal_id: string
          description?: string | null
          due_on?: string | null
          id?: string
          recurrence?: string | null
          title: string
        }
        Update: {
          category?: string | null
          completed?: boolean
          created_at?: string
          deal_id?: string
          description?: string | null
          due_on?: string | null
          id?: string
          recurrence?: string | null
          title?: string
        }
        Relationships: []
      }
      deal_messages: {
        Row: {
          body: string
          created_at: string
          deal_id: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deal_id: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deal_id?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_messages_deal_id_fkey"
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
      deal_offers: {
        Row: {
          agent_recommendation: string | null
          buyer_or_offering_party: string | null
          contingencies: string | null
          created_at: string
          created_by: string
          deal_id: string
          direction: string
          earnest_money: number | null
          financing_type: string | null
          id: string
          offer_price: number
          proposed_close_date: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          agent_recommendation?: string | null
          buyer_or_offering_party?: string | null
          contingencies?: string | null
          created_at?: string
          created_by: string
          deal_id: string
          direction: string
          earnest_money?: number | null
          financing_type?: string | null
          id?: string
          offer_price: number
          proposed_close_date?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          agent_recommendation?: string | null
          buyer_or_offering_party?: string | null
          contingencies?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string
          direction?: string
          earnest_money?: number | null
          financing_type?: string | null
          id?: string
          offer_price?: number
          proposed_close_date?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: []
      }
      deal_price_reductions: {
        Row: {
          applied_at: string | null
          created_at: string
          deal_id: string
          id: string
          prior_price: number
          proposed_by: string
          proposed_price: number
          reasoning: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          deal_id: string
          id?: string
          prior_price: number
          proposed_by: string
          proposed_price: number
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          prior_price?: number
          proposed_by?: string
          proposed_price?: number
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      deal_showings: {
        Row: {
          buyer_agent_brokerage: string | null
          buyer_agent_name: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string
          deal_id: string
          feedback: string | null
          id: string
          notes: string | null
          requested_by_role: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          buyer_agent_brokerage?: string | null
          buyer_agent_name?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by: string
          deal_id: string
          feedback?: string | null
          id?: string
          notes?: string | null
          requested_by_role?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          buyer_agent_brokerage?: string | null
          buyer_agent_name?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string
          feedback?: string | null
          id?: string
          notes?: string | null
          requested_by_role?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: []
      }
      deal_vendors: {
        Row: {
          added_by: string
          category: string
          created_at: string
          deal_id: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          vendor_id: string | null
        }
        Insert: {
          added_by: string
          category: string
          created_at?: string
          deal_id: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          vendor_id?: string | null
        }
        Update: {
          added_by?: string
          category?: string
          created_at?: string
          deal_id?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          actual_close_date: string | null
          appraisal_deadline: string | null
          assigned_to: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission_pct: number | null
          contract_date: string | null
          created_at: string
          earnest_money_amount: number | null
          earnest_money_due: string | null
          expected_close_date: string | null
          final_walkthrough_date: string | null
          financing_contingency_deadline: string | null
          id: string
          inspection_deadline: string | null
          inspection_objection_deadline: string | null
          lender_contact_email: string | null
          lender_contact_name: string | null
          lender_contact_phone: string | null
          lender_name: string | null
          list_price: number | null
          listed_at: string | null
          net_proceeds_estimate: number | null
          notes: string | null
          possession_date: string | null
          price: number | null
          price_history: Json
          property_address: string | null
          property_id: string | null
          side: Database["public"]["Enums"]["deal_side"]
          source_lead_id: string | null
          source_lead_type: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title_company_name: string | null
          title_contact_email: string | null
          title_contact_name: string | null
          title_objection_deadline: string | null
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          appraisal_deadline?: string | null
          assigned_to: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission_pct?: number | null
          contract_date?: string | null
          created_at?: string
          earnest_money_amount?: number | null
          earnest_money_due?: string | null
          expected_close_date?: string | null
          final_walkthrough_date?: string | null
          financing_contingency_deadline?: string | null
          id?: string
          inspection_deadline?: string | null
          inspection_objection_deadline?: string | null
          lender_contact_email?: string | null
          lender_contact_name?: string | null
          lender_contact_phone?: string | null
          lender_name?: string | null
          list_price?: number | null
          listed_at?: string | null
          net_proceeds_estimate?: number | null
          notes?: string | null
          possession_date?: string | null
          price?: number | null
          price_history?: Json
          property_address?: string | null
          property_id?: string | null
          side: Database["public"]["Enums"]["deal_side"]
          source_lead_id?: string | null
          source_lead_type?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title_company_name?: string | null
          title_contact_email?: string | null
          title_contact_name?: string | null
          title_objection_deadline?: string | null
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          appraisal_deadline?: string | null
          assigned_to?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission_pct?: number | null
          contract_date?: string | null
          created_at?: string
          earnest_money_amount?: number | null
          earnest_money_due?: string | null
          expected_close_date?: string | null
          final_walkthrough_date?: string | null
          financing_contingency_deadline?: string | null
          id?: string
          inspection_deadline?: string | null
          inspection_objection_deadline?: string | null
          lender_contact_email?: string | null
          lender_contact_name?: string | null
          lender_contact_phone?: string | null
          lender_name?: string | null
          list_price?: number | null
          listed_at?: string | null
          net_proceeds_estimate?: number | null
          notes?: string | null
          possession_date?: string | null
          price?: number | null
          price_history?: Json
          property_address?: string | null
          property_id?: string | null
          side?: Database["public"]["Enums"]["deal_side"]
          source_lead_id?: string | null
          source_lead_type?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title_company_name?: string | null
          title_contact_email?: string | null
          title_contact_name?: string | null
          title_objection_deadline?: string | null
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
      lead_routing_rules: {
        Row: {
          active: boolean
          assign_to: string
          created_at: string
          created_by: string
          id: string
          match_county: string | null
          match_lead_type: string | null
          match_max_price: number | null
          match_min_price: number | null
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          assign_to: string
          created_at?: string
          created_by: string
          id?: string
          match_county?: string | null
          match_lead_type?: string | null
          match_max_price?: number | null
          match_min_price?: number | null
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          assign_to?: string
          created_at?: string
          created_by?: string
          id?: string
          match_county?: string | null
          match_lead_type?: string | null
          match_max_price?: number | null
          match_min_price?: number | null
          name?: string
          priority?: number
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
      listing_claims: {
        Row: {
          approved_user_id: string | null
          brokerage: string | null
          claimant_email: string
          claimant_name: string
          claimant_phone: string | null
          created_at: string
          id: string
          license_number: string | null
          message: string | null
          property_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          approved_user_id?: string | null
          brokerage?: string | null
          claimant_email: string
          claimant_name: string
          claimant_phone?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          message?: string | null
          property_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          approved_user_id?: string | null
          brokerage?: string | null
          claimant_email?: string
          claimant_name?: string
          claimant_phone?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          message?: string | null
          property_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          deal_id: string | null
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
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
      property_intelligence_reports: {
        Row: {
          created_at: string
          generated_by: string | null
          highlights: Json
          id: string
          model: string | null
          property_id: string
          questions_to_ask: Json
          summary: string
          watchouts: Json
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          highlights?: Json
          id?: string
          model?: string | null
          property_id: string
          questions_to_ask?: Json
          summary: string
          watchouts?: Json
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          highlights?: Json
          id?: string
          model?: string | null
          property_id?: string
          questions_to_ask?: Json
          summary?: string
          watchouts?: Json
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      user_saved_searches: {
        Row: {
          alert_enabled: boolean
          created_at: string
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_enabled?: boolean
          created_at?: string
          filters?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_enabled?: boolean
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          used_during_canterra_tx: boolean
          vendor_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          used_during_canterra_tx?: boolean
          vendor_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          used_during_canterra_tx?: boolean
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string
          city: string | null
          claimed_by: string | null
          county: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_published: boolean
          is_verified: boolean
          name: string
          phone: string | null
          photo_url: string | null
          rating: number | null
          review_count: number
          service_counties: string[]
          service_states: string[]
          state: string
          tier: Database["public"]["Enums"]["vendor_tier"]
          updated_at: string
          website: string | null
        }
        Insert: {
          category: string
          city?: string | null
          claimed_by?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_published?: boolean
          is_verified?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          review_count?: number
          service_counties?: string[]
          service_states?: string[]
          state?: string
          tier?: Database["public"]["Enums"]["vendor_tier"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string
          city?: string | null
          claimed_by?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_published?: boolean
          is_verified?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          review_count?: number
          service_counties?: string[]
          service_states?: string[]
          state?: string
          tier?: Database["public"]["Enums"]["vendor_tier"]
          updated_at?: string
          website?: string | null
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
      is_client_on_deal: {
        Args: { _deal_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      analysis_status: "pending" | "analyzing" | "analyzed" | "failed"
      app_role: "admin" | "agent" | "client"
      collection_item_reaction: "love" | "like" | "maybe" | "no"
      collection_item_status: "saved" | "toured" | "offer_made" | "eliminated"
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
      vendor_tier: "free" | "basic" | "featured"
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
      app_role: ["admin", "agent", "client"],
      collection_item_reaction: ["love", "like", "maybe", "no"],
      collection_item_status: ["saved", "toured", "offer_made", "eliminated"],
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
      vendor_tier: ["free", "basic", "featured"],
    },
  },
} as const
