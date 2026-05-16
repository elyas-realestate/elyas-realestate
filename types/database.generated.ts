export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      ai_config: {
        Row: {
          anthropic_key_set: boolean | null;
          created_at: string | null;
          default_model: string | null;
          default_provider: string | null;
          google_key_set: boolean | null;
          id: string;
          manus_key_set: boolean | null;
          max_tokens: number | null;
          openai_key_set: boolean | null;
          personality: string | null;
          response_language: string | null;
          system_prompt: string | null;
          temperature: number | null;
          tenant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          anthropic_key_set?: boolean | null;
          created_at?: string | null;
          default_model?: string | null;
          default_provider?: string | null;
          google_key_set?: boolean | null;
          id?: string;
          manus_key_set?: boolean | null;
          max_tokens?: number | null;
          openai_key_set?: boolean | null;
          personality?: string | null;
          response_language?: string | null;
          system_prompt?: string | null;
          temperature?: number | null;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          anthropic_key_set?: boolean | null;
          created_at?: string | null;
          default_model?: string | null;
          default_provider?: string | null;
          google_key_set?: boolean | null;
          id?: string;
          manus_key_set?: boolean | null;
          max_tokens?: number | null;
          openai_key_set?: boolean | null;
          personality?: string | null;
          response_language?: string | null;
          system_prompt?: string | null;
          temperature?: number | null;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          channel: string;
          client_id: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          direction: string;
          id: string;
          intent: string | null;
          matched_property_ids: string[] | null;
          message_body: string;
          tenant_id: string;
        };
        Insert: {
          channel?: string;
          client_id?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          direction: string;
          id?: string;
          intent?: string | null;
          matched_property_ids?: string[] | null;
          message_body: string;
          tenant_id: string;
        };
        Update: {
          channel?: string;
          client_id?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          direction?: string;
          id?: string;
          intent?: string | null;
          matched_property_ids?: string[] | null;
          message_body?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_conversations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_conversations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_employee_settings: {
        Row: {
          ai_model: string | null;
          ai_provider: string | null;
          analyst_enabled: boolean;
          analyst_report_email: string | null;
          created_at: string;
          followup_cold_days: number | null;
          followup_enabled: boolean;
          language: string | null;
          marketer_enabled: boolean;
          receiver_enabled: boolean;
          tenant_id: string;
          updated_at: string;
          voice_style: string | null;
        };
        Insert: {
          ai_model?: string | null;
          ai_provider?: string | null;
          analyst_enabled?: boolean;
          analyst_report_email?: string | null;
          created_at?: string;
          followup_cold_days?: number | null;
          followup_enabled?: boolean;
          language?: string | null;
          marketer_enabled?: boolean;
          receiver_enabled?: boolean;
          tenant_id: string;
          updated_at?: string;
          voice_style?: string | null;
        };
        Update: {
          ai_model?: string | null;
          ai_provider?: string | null;
          analyst_enabled?: boolean;
          analyst_report_email?: string | null;
          created_at?: string;
          followup_cold_days?: number | null;
          followup_enabled?: boolean;
          language?: string | null;
          marketer_enabled?: boolean;
          receiver_enabled?: boolean;
          tenant_id?: string;
          updated_at?: string;
          voice_style?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_employee_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_employees: {
        Row: {
          approval_rules: Json | null;
          code: string;
          created_at: string;
          default_ai_model: string;
          default_ai_provider: string;
          department: string;
          description: string;
          display_order: number;
          id: string;
          is_active: boolean;
          manager_id: string;
          name: string;
          trigger_config: Json | null;
          trigger_type: string | null;
        };
        Insert: {
          approval_rules?: Json | null;
          code: string;
          created_at?: string;
          default_ai_model?: string;
          default_ai_provider?: string;
          department: string;
          description: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          manager_id: string;
          name: string;
          trigger_config?: Json | null;
          trigger_type?: string | null;
        };
        Update: {
          approval_rules?: Json | null;
          code?: string;
          created_at?: string;
          default_ai_model?: string;
          default_ai_provider?: string;
          department?: string;
          description?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          manager_id?: string;
          name?: string;
          trigger_config?: Json | null;
          trigger_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_employees_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "ai_managers";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_knowledge: {
        Row: {
          category: string | null;
          content: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          tenant_id: string | null;
          title: string;
        };
        Insert: {
          category?: string | null;
          content: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          tenant_id?: string | null;
          title: string;
        };
        Update: {
          category?: string | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          tenant_id?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      ai_managers: {
        Row: {
          code: string;
          created_at: string;
          default_ai_model: string;
          default_ai_provider: string;
          department: string;
          description: string;
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          default_ai_model?: string;
          default_ai_provider?: string;
          department: string;
          description: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          default_ai_model?: string;
          default_ai_provider?: string;
          department?: string;
          description?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          brand: string | null;
          category: string | null;
          created_at: string | null;
          id: string;
          install_date: string | null;
          location: string | null;
          model: string | null;
          name: string;
          notes: string | null;
          property_id: string | null;
          serial_no: string | null;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
          warranty_end: string | null;
        };
        Insert: {
          brand?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          install_date?: string | null;
          location?: string | null;
          model?: string | null;
          name: string;
          notes?: string | null;
          property_id?: string | null;
          serial_no?: string | null;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          warranty_end?: string | null;
        };
        Update: {
          brand?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          install_date?: string | null;
          location?: string | null;
          model?: string | null;
          name?: string;
          notes?: string | null;
          property_id?: string | null;
          serial_no?: string | null;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          warranty_end?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assets_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assets_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "assets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          entity_id: string | null;
          entity_name: string | null;
          entity_type: string | null;
          id: string;
          ip_address: string | null;
          tenant_id: string | null;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          entity_id?: string | null;
          entity_name?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          tenant_id?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          entity_id?: string | null;
          entity_name?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          tenant_id?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      beta_feedback: {
        Row: {
          admin_notes: string | null;
          category: string;
          created_at: string | null;
          id: string;
          message: string;
          page_url: string | null;
          resolved_at: string | null;
          screenshot_url: string | null;
          severity: string | null;
          status: string;
          tenant_id: string | null;
          user_agent: string | null;
          user_email: string | null;
          user_name: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          category: string;
          created_at?: string | null;
          id?: string;
          message: string;
          page_url?: string | null;
          resolved_at?: string | null;
          screenshot_url?: string | null;
          severity?: string | null;
          status?: string;
          tenant_id?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_name?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          category?: string;
          created_at?: string | null;
          id?: string;
          message?: string;
          page_url?: string | null;
          resolved_at?: string | null;
          screenshot_url?: string | null;
          severity?: string | null;
          status?: string;
          tenant_id?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "beta_feedback_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      beta_waitlist: {
        Row: {
          city: string | null;
          created_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          invite_code_id: string | null;
          invited_at: string | null;
          notes: string | null;
          phone: string | null;
          source: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          city?: string | null;
          created_at?: string | null;
          email: string;
          full_name?: string | null;
          id?: string;
          invite_code_id?: string | null;
          invited_at?: string | null;
          notes?: string | null;
          phone?: string | null;
          source?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          city?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          invite_code_id?: string | null;
          invited_at?: string | null;
          notes?: string | null;
          phone?: string | null;
          source?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "beta_waitlist_invite_code_id_fkey";
            columns: ["invite_code_id"];
            isOneToOne: false;
            referencedRelation: "invite_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      broker_identity: {
        Row: {
          avoid_phrases: string[] | null;
          bio_long: string | null;
          bio_short: string | null;
          brand_keywords: string[] | null;
          broker_name: string | null;
          commercial_building: string | null;
          commercial_city: string | null;
          commercial_district: string | null;
          commercial_postal: string | null;
          commercial_register: string | null;
          commercial_street: string | null;
          content_language: string | null;
          coverage_areas: string[] | null;
          created_at: string | null;
          deals_closed_count: number | null;
          fal_license: string | null;
          freelance_doc: string | null;
          id: string;
          maroof_id: string | null;
          muthawiq_id: string | null;
          photo_url: string | null;
          realestate_authority_id: string | null;
          service_areas: string[] | null;
          social_handles: Json | null;
          specialization: string | null;
          specializations: string[] | null;
          target_audiences: string[] | null;
          tenant_id: string | null;
          testimonials_count: number | null;
          updated_at: string | null;
          vat_number: string | null;
          vcard_address: string | null;
          vcard_org: string | null;
          vcard_title: string | null;
          vcard_website: string | null;
          writing_tone: string | null;
          years_experience: number | null;
          zatca_enabled: boolean | null;
        };
        Insert: {
          avoid_phrases?: string[] | null;
          bio_long?: string | null;
          bio_short?: string | null;
          brand_keywords?: string[] | null;
          broker_name?: string | null;
          commercial_building?: string | null;
          commercial_city?: string | null;
          commercial_district?: string | null;
          commercial_postal?: string | null;
          commercial_register?: string | null;
          commercial_street?: string | null;
          content_language?: string | null;
          coverage_areas?: string[] | null;
          created_at?: string | null;
          deals_closed_count?: number | null;
          fal_license?: string | null;
          freelance_doc?: string | null;
          id?: string;
          maroof_id?: string | null;
          muthawiq_id?: string | null;
          photo_url?: string | null;
          realestate_authority_id?: string | null;
          service_areas?: string[] | null;
          social_handles?: Json | null;
          specialization?: string | null;
          specializations?: string[] | null;
          target_audiences?: string[] | null;
          tenant_id?: string | null;
          testimonials_count?: number | null;
          updated_at?: string | null;
          vat_number?: string | null;
          vcard_address?: string | null;
          vcard_org?: string | null;
          vcard_title?: string | null;
          vcard_website?: string | null;
          writing_tone?: string | null;
          years_experience?: number | null;
          zatca_enabled?: boolean | null;
        };
        Update: {
          avoid_phrases?: string[] | null;
          bio_long?: string | null;
          bio_short?: string | null;
          brand_keywords?: string[] | null;
          broker_name?: string | null;
          commercial_building?: string | null;
          commercial_city?: string | null;
          commercial_district?: string | null;
          commercial_postal?: string | null;
          commercial_register?: string | null;
          commercial_street?: string | null;
          content_language?: string | null;
          coverage_areas?: string[] | null;
          created_at?: string | null;
          deals_closed_count?: number | null;
          fal_license?: string | null;
          freelance_doc?: string | null;
          id?: string;
          maroof_id?: string | null;
          muthawiq_id?: string | null;
          photo_url?: string | null;
          realestate_authority_id?: string | null;
          service_areas?: string[] | null;
          social_handles?: Json | null;
          specialization?: string | null;
          specializations?: string[] | null;
          target_audiences?: string[] | null;
          tenant_id?: string | null;
          testimonials_count?: number | null;
          updated_at?: string | null;
          vat_number?: string | null;
          vcard_address?: string | null;
          vcard_org?: string | null;
          vcard_title?: string | null;
          vcard_website?: string | null;
          writing_tone?: string | null;
          years_experience?: number | null;
          zatca_enabled?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "broker_identity_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          budget: number | null;
          created_at: string;
          end_date: string | null;
          id: string;
          leads_count: number;
          notes: string | null;
          platforms: string[];
          property_id: string | null;
          start_date: string | null;
          status: string;
          tenant_id: string | null;
          title: string;
        };
        Insert: {
          budget?: number | null;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          leads_count?: number;
          notes?: string | null;
          platforms?: string[];
          property_id?: string | null;
          start_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          title: string;
        };
        Update: {
          budget?: number | null;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          leads_count?: number;
          notes?: string | null;
          platforms?: string[];
          property_id?: string | null;
          start_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaigns_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ceo_identity: {
        Row: {
          assistant_employee_code: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string;
          id: string;
          notes: string | null;
          phones: Json | null;
          photo_url: string | null;
          preferred_address: string | null;
          tenant_id: string;
          title: string | null;
          tone_preference: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          assistant_employee_code?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          notes?: string | null;
          phones?: Json | null;
          photo_url?: string | null;
          preferred_address?: string | null;
          tenant_id: string;
          title?: string | null;
          tone_preference?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          assistant_employee_code?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          notes?: string | null;
          phones?: Json | null;
          photo_url?: string | null;
          preferred_address?: string | null;
          tenant_id?: string;
          title?: string | null;
          tone_preference?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ceo_identity_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      client_activities: {
        Row: {
          client_id: string;
          created_at: string;
          id: string;
          note: string;
          tenant_id: string | null;
          type: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          id?: string;
          note: string;
          tenant_id?: string | null;
          type?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          id?: string;
          note?: string;
          tenant_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_activities_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_activities_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      client_files: {
        Row: {
          area_max: number | null;
          area_min: number | null;
          budget_max: number | null;
          budget_min: number | null;
          client_category: string | null;
          client_id: string | null;
          code: string | null;
          created_at: string | null;
          id: string;
          needs_financing: boolean | null;
          preferences: string | null;
          preferred_city: string | null;
          preferred_district: string | null;
          purpose: string | null;
          rooms_required: number | null;
          status: string | null;
          urgency_level: string | null;
        };
        Insert: {
          area_max?: number | null;
          area_min?: number | null;
          budget_max?: number | null;
          budget_min?: number | null;
          client_category?: string | null;
          client_id?: string | null;
          code?: string | null;
          created_at?: string | null;
          id?: string;
          needs_financing?: boolean | null;
          preferences?: string | null;
          preferred_city?: string | null;
          preferred_district?: string | null;
          purpose?: string | null;
          rooms_required?: number | null;
          status?: string | null;
          urgency_level?: string | null;
        };
        Update: {
          area_max?: number | null;
          area_min?: number | null;
          budget_max?: number | null;
          budget_min?: number | null;
          client_category?: string | null;
          client_id?: string | null;
          code?: string | null;
          created_at?: string | null;
          id?: string;
          needs_financing?: boolean | null;
          preferences?: string | null;
          preferred_city?: string | null;
          preferred_district?: string | null;
          purpose?: string | null;
          rooms_required?: number | null;
          status?: string | null;
          urgency_level?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_files_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      client_property_alerts: {
        Row: {
          city: string | null;
          client_id: string | null;
          created_at: string | null;
          district: string | null;
          id: string;
          is_active: boolean | null;
          last_matched_at: string | null;
          main_category: string | null;
          matches_sent_count: number | null;
          max_price: number | null;
          min_area: number | null;
          min_price: number | null;
          min_rooms: number | null;
          notify_via: string[] | null;
          offer_type: string | null;
          sub_category: string | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          city?: string | null;
          client_id?: string | null;
          created_at?: string | null;
          district?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_matched_at?: string | null;
          main_category?: string | null;
          matches_sent_count?: number | null;
          max_price?: number | null;
          min_area?: number | null;
          min_price?: number | null;
          min_rooms?: number | null;
          notify_via?: string[] | null;
          offer_type?: string | null;
          sub_category?: string | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          city?: string | null;
          client_id?: string | null;
          created_at?: string | null;
          district?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_matched_at?: string | null;
          main_category?: string | null;
          matches_sent_count?: number | null;
          max_price?: number | null;
          min_area?: number | null;
          min_price?: number | null;
          min_rooms?: number | null;
          notify_via?: string[] | null;
          offer_type?: string | null;
          sub_category?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_property_alerts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_property_alerts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          category: string | null;
          city: string | null;
          code: string | null;
          company: string | null;
          created_at: string | null;
          created_by: string | null;
          district: string | null;
          email: string | null;
          full_name: string;
          id: string;
          license: string | null;
          notes: string | null;
          phone: string | null;
          preferred_channel: string | null;
          region: string | null;
          relationship_status: string | null;
          sentiment: string | null;
          tenant_id: string | null;
        };
        Insert: {
          category?: string | null;
          city?: string | null;
          code?: string | null;
          company?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          district?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          license?: string | null;
          notes?: string | null;
          phone?: string | null;
          preferred_channel?: string | null;
          region?: string | null;
          relationship_status?: string | null;
          sentiment?: string | null;
          tenant_id?: string | null;
        };
        Update: {
          category?: string | null;
          city?: string | null;
          code?: string | null;
          company?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          district?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          license?: string | null;
          notes?: string | null;
          phone?: string | null;
          preferred_channel?: string | null;
          region?: string | null;
          relationship_status?: string | null;
          sentiment?: string | null;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      content: {
        Row: {
          audience: string | null;
          campaign_id: string | null;
          code: string | null;
          content_format: string | null;
          content_goal: string | null;
          content_pillar: string | null;
          created_at: string | null;
          id: string;
          main_channel: string | null;
          main_text: string | null;
          notes: string | null;
          platform_color: string | null;
          scheduled_date: string | null;
          scheduled_time: string | null;
          status: string | null;
          target_publish_date: string | null;
          tenant_id: string | null;
          title: string | null;
          topic: string | null;
        };
        Insert: {
          audience?: string | null;
          campaign_id?: string | null;
          code?: string | null;
          content_format?: string | null;
          content_goal?: string | null;
          content_pillar?: string | null;
          created_at?: string | null;
          id?: string;
          main_channel?: string | null;
          main_text?: string | null;
          notes?: string | null;
          platform_color?: string | null;
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          status?: string | null;
          target_publish_date?: string | null;
          tenant_id?: string | null;
          title?: string | null;
          topic?: string | null;
        };
        Update: {
          audience?: string | null;
          campaign_id?: string | null;
          code?: string | null;
          content_format?: string | null;
          content_goal?: string | null;
          content_pillar?: string | null;
          created_at?: string | null;
          id?: string;
          main_channel?: string | null;
          main_text?: string | null;
          notes?: string | null;
          platform_color?: string | null;
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          status?: string | null;
          target_publish_date?: string | null;
          tenant_id?: string | null;
          title?: string | null;
          topic?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      content_platforms: {
        Row: {
          code: string | null;
          content_id: string | null;
          final_text: string | null;
          id: string;
          is_published: boolean | null;
          is_ready: boolean | null;
          is_scheduled: boolean | null;
          manual_publish: boolean | null;
          media_file: string | null;
          needs_media: boolean | null;
          notes: string | null;
          platform: string | null;
          post_format: string | null;
          publish_date: string | null;
          scheduled_date: string | null;
        };
        Insert: {
          code?: string | null;
          content_id?: string | null;
          final_text?: string | null;
          id?: string;
          is_published?: boolean | null;
          is_ready?: boolean | null;
          is_scheduled?: boolean | null;
          manual_publish?: boolean | null;
          media_file?: string | null;
          needs_media?: boolean | null;
          notes?: string | null;
          platform?: string | null;
          post_format?: string | null;
          publish_date?: string | null;
          scheduled_date?: string | null;
        };
        Update: {
          code?: string | null;
          content_id?: string | null;
          final_text?: string | null;
          id?: string;
          is_published?: boolean | null;
          is_ready?: boolean | null;
          is_scheduled?: boolean | null;
          manual_publish?: boolean | null;
          media_file?: string | null;
          needs_media?: boolean | null;
          notes?: string | null;
          platform?: string | null;
          post_format?: string | null;
          publish_date?: string | null;
          scheduled_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_platforms_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
        ];
      };
      contracts: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          end_date: string | null;
          file_url: string | null;
          id: string;
          monthly_rent: number | null;
          notes: string | null;
          property_id: string | null;
          start_date: string | null;
          status: string;
          tenant_id: string | null;
          title: string;
          total_value: number | null;
          type: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          file_url?: string | null;
          id?: string;
          monthly_rent?: number | null;
          notes?: string | null;
          property_id?: string | null;
          start_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          title: string;
          total_value?: number | null;
          type?: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          file_url?: string | null;
          id?: string;
          monthly_rent?: number | null;
          notes?: string | null;
          property_id?: string | null;
          start_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          total_value?: number | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_followups: {
        Row: {
          action_date: string | null;
          action_type: string | null;
          code: string | null;
          created_at: string | null;
          deal_id: string | null;
          direction: string | null;
          has_attachment: boolean | null;
          id: string;
          message_summary: string | null;
          next_followup_date: string | null;
          notes: string | null;
          party_code: string | null;
          result: string | null;
          status: string | null;
          subject: string | null;
        };
        Insert: {
          action_date?: string | null;
          action_type?: string | null;
          code?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          direction?: string | null;
          has_attachment?: boolean | null;
          id?: string;
          message_summary?: string | null;
          next_followup_date?: string | null;
          notes?: string | null;
          party_code?: string | null;
          result?: string | null;
          status?: string | null;
          subject?: string | null;
        };
        Update: {
          action_date?: string | null;
          action_type?: string | null;
          code?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          direction?: string | null;
          has_attachment?: boolean | null;
          id?: string;
          message_summary?: string | null;
          next_followup_date?: string | null;
          notes?: string | null;
          party_code?: string | null;
          result?: string | null;
          status?: string | null;
          subject?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deal_followups_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          buyer_id: string | null;
          code: string | null;
          commission_paid: number | null;
          commission_status: string | null;
          created_at: string | null;
          created_by: string | null;
          current_stage: string | null;
          deal_type: string | null;
          expected_close_date: string | null;
          expected_commission: number | null;
          id: string;
          next_action: string | null;
          priority: string | null;
          property_id: string | null;
          risk_level: string | null;
          seller_id: string | null;
          source: string | null;
          summary: string | null;
          target_value: number | null;
          tenant_id: string | null;
          title: string | null;
        };
        Insert: {
          buyer_id?: string | null;
          code?: string | null;
          commission_paid?: number | null;
          commission_status?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          current_stage?: string | null;
          deal_type?: string | null;
          expected_close_date?: string | null;
          expected_commission?: number | null;
          id?: string;
          next_action?: string | null;
          priority?: string | null;
          property_id?: string | null;
          risk_level?: string | null;
          seller_id?: string | null;
          source?: string | null;
          summary?: string | null;
          target_value?: number | null;
          tenant_id?: string | null;
          title?: string | null;
        };
        Update: {
          buyer_id?: string | null;
          code?: string | null;
          commission_paid?: number | null;
          commission_status?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          current_stage?: string | null;
          deal_type?: string | null;
          expected_close_date?: string | null;
          expected_commission?: number | null;
          id?: string;
          next_action?: string | null;
          priority?: string | null;
          property_id?: string | null;
          risk_level?: string | null;
          seller_id?: string | null;
          source?: string | null;
          summary?: string | null;
          target_value?: number | null;
          tenant_id?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deals_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "deals_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      directives: {
        Row: {
          content: string;
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          parent_directive_id: string | null;
          source: string;
          status: string;
          structured_rules: Json | null;
          target_id: string;
          target_kind: string;
          tenant_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          parent_directive_id?: string | null;
          source?: string;
          status?: string;
          structured_rules?: Json | null;
          target_id: string;
          target_kind: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          parent_directive_id?: string | null;
          source?: string;
          status?: string;
          structured_rules?: Json | null;
          target_id?: string;
          target_kind?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "directives_parent_directive_id_fkey";
            columns: ["parent_directive_id"];
            isOneToOne: false;
            referencedRelation: "directives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "directives_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          code: string | null;
          created_at: string | null;
          doc_type: string | null;
          expiry_date: string | null;
          file_url: string | null;
          id: string;
          is_confidential: boolean | null;
          issue_date: string | null;
          notes: string | null;
          related_code: string | null;
          related_entity: string | null;
          status: string | null;
          title: string | null;
          version: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string | null;
          doc_type?: string | null;
          expiry_date?: string | null;
          file_url?: string | null;
          id?: string;
          is_confidential?: boolean | null;
          issue_date?: string | null;
          notes?: string | null;
          related_code?: string | null;
          related_entity?: string | null;
          status?: string | null;
          title?: string | null;
          version?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string | null;
          doc_type?: string | null;
          expiry_date?: string | null;
          file_url?: string | null;
          id?: string;
          is_confidential?: boolean | null;
          issue_date?: string | null;
          notes?: string | null;
          related_code?: string | null;
          related_entity?: string | null;
          status?: string | null;
          title?: string | null;
          version?: string | null;
        };
        Relationships: [];
      };
      e_contract_audit: {
        Row: {
          action: string;
          actor_label: string | null;
          actor_user_id: string | null;
          contract_id: string;
          created_at: string;
          details: Json | null;
          id: string;
          ip_address: string | null;
        };
        Insert: {
          action: string;
          actor_label?: string | null;
          actor_user_id?: string | null;
          contract_id: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
        };
        Update: {
          action?: string;
          actor_label?: string | null;
          actor_user_id?: string | null;
          contract_id?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "e_contract_audit_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "e_contracts";
            referencedColumns: ["id"];
          },
        ];
      };
      e_contract_signatures: {
        Row: {
          contract_id: string;
          id: string;
          ip_address: string | null;
          party: string;
          signature_data: string;
          signed_at: string;
          signer_id_number: string | null;
          signer_name: string;
          signer_phone: string | null;
          user_agent: string | null;
        };
        Insert: {
          contract_id: string;
          id?: string;
          ip_address?: string | null;
          party: string;
          signature_data: string;
          signed_at?: string;
          signer_id_number?: string | null;
          signer_name: string;
          signer_phone?: string | null;
          user_agent?: string | null;
        };
        Update: {
          contract_id?: string;
          id?: string;
          ip_address?: string | null;
          party?: string;
          signature_data?: string;
          signed_at?: string;
          signer_id_number?: string | null;
          signer_name?: string;
          signer_phone?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "e_contract_signatures_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "e_contracts";
            referencedColumns: ["id"];
          },
        ];
      };
      e_contract_templates: {
        Row: {
          body_html: string;
          category: string;
          code: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          is_system: boolean;
          tenant_id: string | null;
          title: string;
          updated_at: string;
          variables: Json;
        };
        Insert: {
          body_html: string;
          category: string;
          code?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          variables?: Json;
        };
        Update: {
          body_html?: string;
          category?: string;
          code?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          variables?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "e_contract_templates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      e_contracts: {
        Row: {
          amount: number | null;
          body_html: string;
          category: string;
          client_id: string | null;
          contract_number: string | null;
          created_at: string;
          created_by: string | null;
          currency: string | null;
          deal_id: string | null;
          end_date: string | null;
          final_hash: string | null;
          finalized_at: string | null;
          id: string;
          party_first: Json;
          party_second: Json;
          party_witness: Json | null;
          property_id: string | null;
          signing_expires_at: string | null;
          signing_token: string | null;
          start_date: string | null;
          status: string;
          template_id: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          variables_used: Json | null;
        };
        Insert: {
          amount?: number | null;
          body_html: string;
          category: string;
          client_id?: string | null;
          contract_number?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string | null;
          deal_id?: string | null;
          end_date?: string | null;
          final_hash?: string | null;
          finalized_at?: string | null;
          id?: string;
          party_first?: Json;
          party_second?: Json;
          party_witness?: Json | null;
          property_id?: string | null;
          signing_expires_at?: string | null;
          signing_token?: string | null;
          start_date?: string | null;
          status?: string;
          template_id?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          variables_used?: Json | null;
        };
        Update: {
          amount?: number | null;
          body_html?: string;
          category?: string;
          client_id?: string | null;
          contract_number?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string | null;
          deal_id?: string | null;
          end_date?: string | null;
          final_hash?: string | null;
          finalized_at?: string | null;
          id?: string;
          party_first?: Json;
          party_second?: Json;
          party_witness?: Json | null;
          property_id?: string | null;
          signing_expires_at?: string | null;
          signing_token?: string | null;
          start_date?: string | null;
          status?: string;
          template_id?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          variables_used?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "e_contracts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "e_contracts_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "e_contracts_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "e_contracts_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "e_contracts_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "e_contract_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "e_contracts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      event_clients: {
        Row: {
          assigned_to: string | null;
          client_category: string | null;
          client_id: string | null;
          code: string | null;
          created_at: string | null;
          event_id: string | null;
          followup_status: string | null;
          id: string;
          interest_level: string | null;
          notes: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          client_category?: string | null;
          client_id?: string | null;
          code?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          followup_status?: string | null;
          id?: string;
          interest_level?: string | null;
          notes?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          client_category?: string | null;
          client_id?: string | null;
          code?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          followup_status?: string | null;
          id?: string;
          interest_level?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_clients_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_clients_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_clients_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          code: string | null;
          created_at: string | null;
          end_date: string | null;
          event_type: string | null;
          goal: string | null;
          id: string;
          location: string | null;
          name: string | null;
          notes: string | null;
          participation_type: string | null;
          start_date: string | null;
          status: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          event_type?: string | null;
          goal?: string | null;
          id?: string;
          location?: string | null;
          name?: string | null;
          notes?: string | null;
          participation_type?: string | null;
          start_date?: string | null;
          status?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          event_type?: string | null;
          goal?: string | null;
          id?: string;
          location?: string | null;
          name?: string | null;
          notes?: string | null;
          participation_type?: string | null;
          start_date?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          expense_date: string;
          id: string;
          note: string | null;
          tenant_id: string | null;
        };
        Insert: {
          amount: number;
          category?: string;
          created_at?: string;
          expense_date?: string;
          id?: string;
          note?: string | null;
          tenant_id?: string | null;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          expense_date?: string;
          id?: string;
          note?: string | null;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      external_subscriptions: {
        Row: {
          app_name: string;
          billing_cycle: string | null;
          cost: number | null;
          created_at: string | null;
          end_date: string | null;
          id: string;
          plan_name: string | null;
          remind_before_days: number | null;
          start_date: string | null;
          status: string | null;
          tenant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          app_name: string;
          billing_cycle?: string | null;
          cost?: number | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          plan_name?: string | null;
          remind_before_days?: number | null;
          start_date?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          app_name?: string;
          billing_cycle?: string | null;
          cost?: number | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          plan_name?: string | null;
          remind_before_days?: number | null;
          start_date?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      followup_queue: {
        Row: {
          channel: string;
          client_id: string | null;
          created_at: string;
          generated_at: string;
          generated_by_model: string | null;
          id: string;
          message: string;
          reason: string | null;
          sent_at: string | null;
          sent_by: string | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          channel?: string;
          client_id?: string | null;
          created_at?: string;
          generated_at?: string;
          generated_by_model?: string | null;
          id?: string;
          message: string;
          reason?: string | null;
          sent_at?: string | null;
          sent_by?: string | null;
          status?: string;
          tenant_id: string;
        };
        Update: {
          channel?: string;
          client_id?: string | null;
          created_at?: string;
          generated_at?: string;
          generated_by_model?: string | null;
          id?: string;
          message?: string;
          reason?: string | null;
          sent_at?: string | null;
          sent_by?: string | null;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "followup_queue_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followup_queue_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      invite_codes: {
        Row: {
          code: string;
          cohort: string | null;
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          max_uses: number;
          notes: string | null;
          status: string;
          updated_at: string | null;
          use_count: number;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          code: string;
          cohort?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          max_uses?: number;
          notes?: string | null;
          status?: string;
          updated_at?: string | null;
          use_count?: number;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          code?: string;
          cohort?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          max_uses?: number;
          notes?: string | null;
          status?: string;
          updated_at?: string | null;
          use_count?: number;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          amount: number;
          client_id: string | null;
          client_name: string | null;
          created_at: string | null;
          currency: string | null;
          deal_id: string | null;
          due_date: string | null;
          id: string;
          invoice_counter: number | null;
          invoice_hash: string | null;
          invoice_number: string | null;
          invoice_type: string | null;
          notes: string | null;
          paid_amount: number | null;
          paid_at: string | null;
          previous_hash: string | null;
          qr_code: string | null;
          status: string | null;
          tenant_id: string | null;
          title: string;
          total: number | null;
          updated_at: string | null;
          vat_amount: number | null;
          xml_submitted: boolean | null;
          xml_uuid: string | null;
          zatca_response: Json | null;
        };
        Insert: {
          amount?: number;
          client_id?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          deal_id?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_counter?: number | null;
          invoice_hash?: string | null;
          invoice_number?: string | null;
          invoice_type?: string | null;
          notes?: string | null;
          paid_amount?: number | null;
          paid_at?: string | null;
          previous_hash?: string | null;
          qr_code?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          title: string;
          total?: number | null;
          updated_at?: string | null;
          vat_amount?: number | null;
          xml_submitted?: boolean | null;
          xml_uuid?: string | null;
          zatca_response?: Json | null;
        };
        Update: {
          amount?: number;
          client_id?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          deal_id?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_counter?: number | null;
          invoice_hash?: string | null;
          invoice_number?: string | null;
          invoice_type?: string | null;
          notes?: string | null;
          paid_amount?: number | null;
          paid_at?: string | null;
          previous_hash?: string | null;
          qr_code?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          title?: string;
          total?: number | null;
          updated_at?: string | null;
          vat_amount?: number | null;
          xml_submitted?: boolean | null;
          xml_uuid?: string | null;
          zatca_response?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_base: {
        Row: {
          category: string;
          content: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          tags: string[] | null;
          target_id: string;
          target_kind: string;
          tenant_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          content: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          tags?: string[] | null;
          target_id: string;
          target_kind: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          content?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          tags?: string[] | null;
          target_id?: string;
          target_kind?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_base_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_captures: {
        Row: {
          context_id: string | null;
          context_type: string;
          converted_at: string | null;
          converted_to_client_id: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string;
          id: string;
          intent: string | null;
          ip_address: string | null;
          notes: string | null;
          phone: string;
          referer: string | null;
          status: string;
          temperature: string | null;
          tenant_id: string;
          updated_at: string | null;
          user_agent: string | null;
          utm_campaign: string | null;
          utm_source: string | null;
        };
        Insert: {
          context_id?: string | null;
          context_type: string;
          converted_at?: string | null;
          converted_to_client_id?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          intent?: string | null;
          ip_address?: string | null;
          notes?: string | null;
          phone: string;
          referer?: string | null;
          status?: string;
          temperature?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          user_agent?: string | null;
          utm_campaign?: string | null;
          utm_source?: string | null;
        };
        Update: {
          context_id?: string | null;
          context_type?: string;
          converted_at?: string | null;
          converted_to_client_id?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          intent?: string | null;
          ip_address?: string | null;
          notes?: string | null;
          phone?: string;
          referer?: string | null;
          status?: string;
          temperature?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          user_agent?: string | null;
          utm_campaign?: string | null;
          utm_source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_captures_converted_to_client_id_fkey";
            columns: ["converted_to_client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_captures_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      legal_documents: {
        Row: {
          created_at: string | null;
          doc_number: string | null;
          doc_type: string | null;
          doc_url: string | null;
          expiry_date: string | null;
          id: string;
          issue_date: string | null;
          notes: string | null;
          related_party: string | null;
          status: string | null;
          tenant_id: string | null;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          doc_number?: string | null;
          doc_type?: string | null;
          doc_url?: string | null;
          expiry_date?: string | null;
          id?: string;
          issue_date?: string | null;
          notes?: string | null;
          related_party?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          title: string;
        };
        Update: {
          created_at?: string | null;
          doc_number?: string | null;
          doc_type?: string | null;
          doc_url?: string | null;
          expiry_date?: string | null;
          id?: string;
          issue_date?: string | null;
          notes?: string | null;
          related_party?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legal_documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_requests: {
        Row: {
          client_id: string | null;
          contract_id: string | null;
          cost: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          priority: string;
          property_id: string | null;
          resolved_at: string | null;
          status: string;
          tenant_id: string | null;
          title: string;
        };
        Insert: {
          client_id?: string | null;
          contract_id?: string | null;
          cost?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          priority?: string;
          property_id?: string | null;
          resolved_at?: string | null;
          status?: string;
          tenant_id?: string | null;
          title: string;
        };
        Update: {
          client_id?: string | null;
          contract_id?: string | null;
          cost?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          priority?: string;
          property_id?: string | null;
          resolved_at?: string | null;
          status?: string;
          tenant_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_requests_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      manager_reviews: {
        Row: {
          concerns: Json | null;
          created_at: string;
          generated_by_model: string | null;
          highlights: Json | null;
          id: string;
          manager_id: string;
          metrics: Json | null;
          period_end: string;
          period_start: string;
          suggestions_count: number | null;
          summary: string;
          tenant_id: string;
        };
        Insert: {
          concerns?: Json | null;
          created_at?: string;
          generated_by_model?: string | null;
          highlights?: Json | null;
          id?: string;
          manager_id: string;
          metrics?: Json | null;
          period_end: string;
          period_start: string;
          suggestions_count?: number | null;
          summary: string;
          tenant_id: string;
        };
        Update: {
          concerns?: Json | null;
          created_at?: string;
          generated_by_model?: string | null;
          highlights?: Json | null;
          id?: string;
          manager_id?: string;
          metrics?: Json | null;
          period_end?: string;
          period_start?: string;
          suggestions_count?: number | null;
          summary?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manager_reviews_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "ai_managers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "manager_reviews_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_queue: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          channel: string;
          content: string;
          created_at: string;
          generated_at: string;
          generated_by_model: string | null;
          hashtags: string[] | null;
          id: string;
          property_id: string | null;
          published_at: string | null;
          published_url: string | null;
          rejection_reason: string | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          channel: string;
          content: string;
          created_at?: string;
          generated_at?: string;
          generated_by_model?: string | null;
          hashtags?: string[] | null;
          id?: string;
          property_id?: string | null;
          published_at?: string | null;
          published_url?: string | null;
          rejection_reason?: string | null;
          status?: string;
          tenant_id: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          channel?: string;
          content?: string;
          created_at?: string;
          generated_at?: string;
          generated_by_model?: string | null;
          hashtags?: string[] | null;
          id?: string;
          property_id?: string | null;
          published_at?: string | null;
          published_url?: string | null;
          rejection_reason?: string | null;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_queue_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_queue_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "marketing_queue_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          client_notes: string | null;
          code: string | null;
          created_at: string | null;
          id: string;
          match_reason: string | null;
          match_score: string | null;
          property_id: string | null;
          request_id: string | null;
          sent_to_client: boolean | null;
          status: string | null;
        };
        Insert: {
          client_notes?: string | null;
          code?: string | null;
          created_at?: string | null;
          id?: string;
          match_reason?: string | null;
          match_score?: string | null;
          property_id?: string | null;
          request_id?: string | null;
          sent_to_client?: boolean | null;
          status?: string | null;
        };
        Update: {
          client_notes?: string | null;
          code?: string | null;
          created_at?: string | null;
          id?: string;
          match_reason?: string | null;
          match_score?: string | null;
          property_id?: string | null;
          request_id?: string | null;
          sent_to_client?: boolean | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "matches_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "property_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      monthly_goals: {
        Row: {
          created_at: string | null;
          id: string;
          month: string;
          target_clients: number;
          target_deals: number;
          target_revenue: number;
          tenant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          month: string;
          target_clients?: number;
          target_deals?: number;
          target_revenue?: number;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          month?: string;
          target_clients?: number;
          target_deals?: number;
          target_revenue?: number;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_goals_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      neighborhood_intel: {
        Row: {
          ai_generated: boolean | null;
          amenities: Json | null;
          city: string;
          description_ar: string | null;
          description_en: string | null;
          district: string;
          highlights: Json | null;
          hospitals_count: number | null;
          id: string;
          last_updated_at: string | null;
          mosques_count: number | null;
          restaurants_count: number | null;
          schools_count: number | null;
        };
        Insert: {
          ai_generated?: boolean | null;
          amenities?: Json | null;
          city: string;
          description_ar?: string | null;
          description_en?: string | null;
          district: string;
          highlights?: Json | null;
          hospitals_count?: number | null;
          id?: string;
          last_updated_at?: string | null;
          mosques_count?: number | null;
          restaurants_count?: number | null;
          schools_count?: number | null;
        };
        Update: {
          ai_generated?: boolean | null;
          amenities?: Json | null;
          city?: string;
          description_ar?: string | null;
          description_en?: string | null;
          district?: string;
          highlights?: Json | null;
          hospitals_count?: number | null;
          id?: string;
          last_updated_at?: string | null;
          mosques_count?: number | null;
          restaurants_count?: number | null;
          schools_count?: number | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          action_url: string | null;
          body: string | null;
          created_at: string | null;
          id: string;
          kind: string;
          read_at: string | null;
          reference_id: string | null;
          reference_type: string | null;
          tenant_id: string;
          title: string;
          user_id: string | null;
        };
        Insert: {
          action_url?: string | null;
          body?: string | null;
          created_at?: string | null;
          id?: string;
          kind: string;
          read_at?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          tenant_id: string;
          title: string;
          user_id?: string | null;
        };
        Update: {
          action_url?: string | null;
          body?: string | null;
          created_at?: string | null;
          id?: string;
          kind?: string;
          read_at?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          tenant_id?: string;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      org_activity_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_kind: string;
          created_at: string;
          details: Json | null;
          id: string;
          target_id: string | null;
          target_kind: string | null;
          tenant_id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_kind: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          target_id?: string | null;
          target_kind?: string | null;
          tenant_id: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_kind?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          target_id?: string | null;
          target_kind?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_activity_log_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      org_escalations: {
        Row: {
          action_required: string | null;
          approval_kind: string | null;
          auto_approved: boolean | null;
          ceo_decision: string | null;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          description: string;
          executed_at: string | null;
          execution_result: Json | null;
          expires_at: string | null;
          id: string;
          payload: Json | null;
          pending_action: Json | null;
          raised_by_id: string;
          raised_by_kind: string;
          severity: string;
          status: string;
          tenant_id: string;
          title: string;
          type: string;
        };
        Insert: {
          action_required?: string | null;
          approval_kind?: string | null;
          auto_approved?: boolean | null;
          ceo_decision?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          description: string;
          executed_at?: string | null;
          execution_result?: Json | null;
          expires_at?: string | null;
          id?: string;
          payload?: Json | null;
          pending_action?: Json | null;
          raised_by_id: string;
          raised_by_kind: string;
          severity?: string;
          status?: string;
          tenant_id: string;
          title: string;
          type: string;
        };
        Update: {
          action_required?: string | null;
          approval_kind?: string | null;
          auto_approved?: boolean | null;
          ceo_decision?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          description?: string;
          executed_at?: string | null;
          execution_result?: Json | null;
          expires_at?: string | null;
          id?: string;
          payload?: Json | null;
          pending_action?: Json | null;
          raised_by_id?: string;
          raised_by_kind?: string;
          severity?: string;
          status?: string;
          tenant_id?: string;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_escalations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      partners: {
        Row: {
          client_id: string | null;
          code: string | null;
          cooperation_type: string | null;
          created_at: string | null;
          id: string;
          name: string | null;
          notes: string | null;
          partner_type: string | null;
          status: string | null;
          strength_level: string | null;
          work_scope: string | null;
        };
        Insert: {
          client_id?: string | null;
          code?: string | null;
          cooperation_type?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          notes?: string | null;
          partner_type?: string | null;
          status?: string | null;
          strength_level?: string | null;
          work_scope?: string | null;
        };
        Update: {
          client_id?: string | null;
          code?: string | null;
          cooperation_type?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          notes?: string | null;
          partner_type?: string | null;
          status?: string | null;
          strength_level?: string | null;
          work_scope?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partners_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_events: {
        Row: {
          amount: number | null;
          created_at: string;
          event_type: string;
          id: string;
          payment_id: string;
          raw_payload: Json | null;
          status: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          event_type: string;
          id?: string;
          payment_id: string;
          raw_payload?: Json | null;
          status?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          event_type?: string;
          id?: string;
          payment_id?: string;
          raw_payload?: Json | null;
          status?: string | null;
        };
        Relationships: [];
      };
      portal_listings: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          external_id: string | null;
          external_url: string | null;
          id: string;
          notes: string | null;
          portal: string;
          property_id: string;
          published_at: string | null;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          external_id?: string | null;
          external_url?: string | null;
          id?: string;
          notes?: string | null;
          portal: string;
          property_id: string;
          published_at?: string | null;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          external_id?: string | null;
          external_url?: string | null;
          id?: string;
          notes?: string | null;
          portal?: string;
          property_id?: string;
          published_at?: string | null;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "portal_listings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "portal_listings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "portal_listings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      preventive_maintenance: {
        Row: {
          asset_id: string | null;
          assigned_tech: string | null;
          created_at: string | null;
          description: string | null;
          frequency_days: number;
          id: string;
          is_active: boolean | null;
          last_done_at: string | null;
          next_due_at: string | null;
          property_id: string | null;
          tenant_id: string;
          title: string;
        };
        Insert: {
          asset_id?: string | null;
          assigned_tech?: string | null;
          created_at?: string | null;
          description?: string | null;
          frequency_days: number;
          id?: string;
          is_active?: boolean | null;
          last_done_at?: string | null;
          next_due_at?: string | null;
          property_id?: string | null;
          tenant_id: string;
          title: string;
        };
        Update: {
          asset_id?: string | null;
          assigned_tech?: string | null;
          created_at?: string | null;
          description?: string | null;
          frequency_days?: number;
          id?: string;
          is_active?: boolean | null;
          last_done_at?: string | null;
          next_due_at?: string | null;
          property_id?: string | null;
          tenant_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "preventive_maintenance_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "preventive_maintenance_assigned_tech_fkey";
            columns: ["assigned_tech"];
            isOneToOne: false;
            referencedRelation: "technicians";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "preventive_maintenance_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "preventive_maintenance_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "preventive_maintenance_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_cards: {
        Row: {
          accent_color: string | null;
          avatar_url: string | null;
          bg_color: string | null;
          bio: string | null;
          card_style: string;
          created_at: string;
          display_name: string | null;
          id: string;
          is_published: boolean;
          show_direct_contact: boolean;
          show_hours: boolean;
          show_licenses: boolean;
          show_powered_by: boolean;
          show_qr_button: boolean;
          show_share_button: boolean;
          show_social: boolean;
          tenant_id: string;
          text_color: string | null;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          accent_color?: string | null;
          avatar_url?: string | null;
          bg_color?: string | null;
          bio?: string | null;
          card_style?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_published?: boolean;
          show_direct_contact?: boolean;
          show_hours?: boolean;
          show_licenses?: boolean;
          show_powered_by?: boolean;
          show_qr_button?: boolean;
          show_share_button?: boolean;
          show_social?: boolean;
          tenant_id: string;
          text_color?: string | null;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          accent_color?: string | null;
          avatar_url?: string | null;
          bg_color?: string | null;
          bio?: string | null;
          card_style?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_published?: boolean;
          show_direct_contact?: boolean;
          show_hours?: boolean;
          show_licenses?: boolean;
          show_powered_by?: boolean;
          show_qr_button?: boolean;
          show_share_button?: boolean;
          show_social?: boolean;
          tenant_id?: string;
          text_color?: string | null;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "profile_cards_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_links: {
        Row: {
          bg_color: string | null;
          click_count: number;
          created_at: string;
          description: string | null;
          display_order: number;
          element_type: string | null;
          gradient_to: string | null;
          icon: string | null;
          id: string;
          is_active: boolean;
          is_gradient: boolean;
          label: string;
          last_clicked_at: string | null;
          link_type: string;
          metadata: Json | null;
          platform: string | null;
          subtitle: string | null;
          tenant_id: string;
          text_color: string | null;
          updated_at: string;
          value: string | null;
        };
        Insert: {
          bg_color?: string | null;
          click_count?: number;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          element_type?: string | null;
          gradient_to?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          is_gradient?: boolean;
          label: string;
          last_clicked_at?: string | null;
          link_type?: string;
          metadata?: Json | null;
          platform?: string | null;
          subtitle?: string | null;
          tenant_id: string;
          text_color?: string | null;
          updated_at?: string;
          value?: string | null;
        };
        Update: {
          bg_color?: string | null;
          click_count?: number;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          element_type?: string | null;
          gradient_to?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          is_gradient?: boolean;
          label?: string;
          last_clicked_at?: string | null;
          link_type?: string;
          metadata?: Json | null;
          platform?: string | null;
          subtitle?: string | null;
          tenant_id?: string;
          text_color?: string | null;
          updated_at?: string;
          value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_links_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_submissions: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          is_read: boolean;
          link_id: string | null;
          message: string | null;
          phone: string | null;
          tenant_id: string;
          visitor_name: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          is_read?: boolean;
          link_id?: string | null;
          message?: string | null;
          phone?: string | null;
          tenant_id: string;
          visitor_name: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          is_read?: boolean;
          link_id?: string | null;
          message?: string | null;
          phone?: string | null;
          tenant_id?: string;
          visitor_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_submissions_link_id_fkey";
            columns: ["link_id"];
            isOneToOne: false;
            referencedRelation: "profile_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_submissions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      project_units: {
        Row: {
          area: number | null;
          bathrooms: number | null;
          client_name: string | null;
          created_at: string;
          floor: number | null;
          id: string;
          notes: string | null;
          price: number | null;
          project_id: string;
          rooms: number | null;
          status: string;
          tenant_id: string | null;
          unit_number: string;
          unit_type: string | null;
        };
        Insert: {
          area?: number | null;
          bathrooms?: number | null;
          client_name?: string | null;
          created_at?: string;
          floor?: number | null;
          id?: string;
          notes?: string | null;
          price?: number | null;
          project_id: string;
          rooms?: number | null;
          status?: string;
          tenant_id?: string | null;
          unit_number: string;
          unit_type?: string | null;
        };
        Update: {
          area?: number | null;
          bathrooms?: number | null;
          client_name?: string | null;
          created_at?: string;
          floor?: number | null;
          id?: string;
          notes?: string | null;
          price?: number | null;
          project_id?: string;
          rooms?: number | null;
          status?: string;
          tenant_id?: string | null;
          unit_number?: string;
          unit_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_units_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_units_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          city: string | null;
          created_at: string;
          delivery_date: string | null;
          description: string | null;
          developer: string | null;
          district: string | null;
          id: string;
          images: string[] | null;
          location_url: string | null;
          main_image: string | null;
          name: string;
          status: string;
          tenant_id: string | null;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          delivery_date?: string | null;
          description?: string | null;
          developer?: string | null;
          district?: string | null;
          id?: string;
          images?: string[] | null;
          location_url?: string | null;
          main_image?: string | null;
          name: string;
          status?: string;
          tenant_id?: string | null;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          delivery_date?: string | null;
          description?: string | null;
          developer?: string | null;
          district?: string | null;
          id?: string;
          images?: string[] | null;
          location_url?: string | null;
          main_image?: string | null;
          name?: string;
          status?: string;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          ad_license_number: string | null;
          address_text: string | null;
          allow_visit_booking: boolean | null;
          bathrooms: number | null;
          built_area: number | null;
          city: string | null;
          code: string | null;
          contact_phone: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          district: string | null;
          floors: number | null;
          id: string;
          images: string[] | null;
          images_url: string | null;
          is_exclusive: boolean | null;
          is_published: boolean | null;
          land_area: number | null;
          last_availability_check: string | null;
          latitude: number | null;
          lead_capture_message: string | null;
          listing_status: string | null;
          location_url: string | null;
          longitude: number | null;
          main_category: string | null;
          main_image: string | null;
          marketing_status: string | null;
          offer_type: string | null;
          owner_confirmed_available: boolean | null;
          owner_id: string | null;
          owner_last_check: string | null;
          price: number | null;
          property_status: string | null;
          require_lead_capture: boolean | null;
          rooms: number | null;
          source: string | null;
          sub_category: string | null;
          tenant_id: string | null;
          title: string;
        };
        Insert: {
          ad_license_number?: string | null;
          address_text?: string | null;
          allow_visit_booking?: boolean | null;
          bathrooms?: number | null;
          built_area?: number | null;
          city?: string | null;
          code?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          district?: string | null;
          floors?: number | null;
          id?: string;
          images?: string[] | null;
          images_url?: string | null;
          is_exclusive?: boolean | null;
          is_published?: boolean | null;
          land_area?: number | null;
          last_availability_check?: string | null;
          latitude?: number | null;
          lead_capture_message?: string | null;
          listing_status?: string | null;
          location_url?: string | null;
          longitude?: number | null;
          main_category?: string | null;
          main_image?: string | null;
          marketing_status?: string | null;
          offer_type?: string | null;
          owner_confirmed_available?: boolean | null;
          owner_id?: string | null;
          owner_last_check?: string | null;
          price?: number | null;
          property_status?: string | null;
          require_lead_capture?: boolean | null;
          rooms?: number | null;
          source?: string | null;
          sub_category?: string | null;
          tenant_id?: string | null;
          title: string;
        };
        Update: {
          ad_license_number?: string | null;
          address_text?: string | null;
          allow_visit_booking?: boolean | null;
          bathrooms?: number | null;
          built_area?: number | null;
          city?: string | null;
          code?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          district?: string | null;
          floors?: number | null;
          id?: string;
          images?: string[] | null;
          images_url?: string | null;
          is_exclusive?: boolean | null;
          is_published?: boolean | null;
          land_area?: number | null;
          last_availability_check?: string | null;
          latitude?: number | null;
          lead_capture_message?: string | null;
          listing_status?: string | null;
          location_url?: string | null;
          longitude?: number | null;
          main_category?: string | null;
          main_image?: string | null;
          marketing_status?: string | null;
          offer_type?: string | null;
          owner_confirmed_available?: boolean | null;
          owner_id?: string | null;
          owner_last_check?: string | null;
          price?: number | null;
          property_status?: string | null;
          require_lead_capture?: boolean | null;
          rooms?: number | null;
          source?: string | null;
          sub_category?: string | null;
          tenant_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      property_alert_matches: {
        Row: {
          alert_id: string;
          created_at: string | null;
          id: string;
          match_score: number | null;
          notified_at: string | null;
          property_id: string;
        };
        Insert: {
          alert_id: string;
          created_at?: string | null;
          id?: string;
          match_score?: number | null;
          notified_at?: string | null;
          property_id: string;
        };
        Update: {
          alert_id?: string;
          created_at?: string | null;
          id?: string;
          match_score?: number | null;
          notified_at?: string | null;
          property_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_alert_matches_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "client_property_alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_alert_matches_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_alert_matches_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
        ];
      };
      property_categories: {
        Row: {
          id: string;
          main_category: string;
          sub_category: string | null;
        };
        Insert: {
          id?: string;
          main_category: string;
          sub_category?: string | null;
        };
        Update: {
          id?: string;
          main_category?: string;
          sub_category?: string | null;
        };
        Relationships: [];
      };
      property_comparisons: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          id: string;
          notes: string | null;
          property_ids: string[];
          share_token: string | null;
          tenant_id: string;
          title: string | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          notes?: string | null;
          property_ids: string[];
          share_token?: string | null;
          tenant_id: string;
          title?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          notes?: string | null;
          property_ids?: string[];
          share_token?: string | null;
          tenant_id?: string;
          title?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_comparisons_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      property_features_entries: {
        Row: {
          boolean_value: boolean | null;
          created_at: string | null;
          feature_group: string | null;
          feature_name: string | null;
          field_type: string | null;
          id: string;
          main_category: string | null;
          multi_value: string | null;
          notes: string | null;
          number_value: number | null;
          property_id: string | null;
          sub_category: string | null;
          text_value: string | null;
        };
        Insert: {
          boolean_value?: boolean | null;
          created_at?: string | null;
          feature_group?: string | null;
          feature_name?: string | null;
          field_type?: string | null;
          id?: string;
          main_category?: string | null;
          multi_value?: string | null;
          notes?: string | null;
          number_value?: number | null;
          property_id?: string | null;
          sub_category?: string | null;
          text_value?: string | null;
        };
        Update: {
          boolean_value?: boolean | null;
          created_at?: string | null;
          feature_group?: string | null;
          feature_name?: string | null;
          field_type?: string | null;
          id?: string;
          main_category?: string | null;
          multi_value?: string | null;
          notes?: string | null;
          number_value?: number | null;
          property_id?: string | null;
          sub_category?: string | null;
          text_value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_features_entries_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_features_entries_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
        ];
      };
      property_features_ref: {
        Row: {
          feature_group: string | null;
          feature_name: string | null;
          field_type: string | null;
          id: string;
          main_category: string | null;
          options: string | null;
          sub_category: string | null;
        };
        Insert: {
          feature_group?: string | null;
          feature_name?: string | null;
          field_type?: string | null;
          id?: string;
          main_category?: string | null;
          options?: string | null;
          sub_category?: string | null;
        };
        Update: {
          feature_group?: string | null;
          feature_name?: string | null;
          field_type?: string | null;
          id?: string;
          main_category?: string | null;
          options?: string | null;
          sub_category?: string | null;
        };
        Relationships: [];
      };
      property_requests: {
        Row: {
          area_max: number | null;
          area_min: number | null;
          assigned_to: string | null;
          budget_max: number | null;
          budget_min: number | null;
          city: string | null;
          client_file_id: string | null;
          code: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          converted_at: string | null;
          converted_to_deal_id: string | null;
          created_at: string | null;
          district: string | null;
          government_support: string | null;
          id: string;
          main_category: string | null;
          message: string | null;
          payment_method: string | null;
          request_type: string | null;
          required_features: string | null;
          rooms_max: number | null;
          rooms_min: number | null;
          status: string | null;
          sub_category: string | null;
          tenant_id: string | null;
          updated_at: string | null;
          urgency_level: string | null;
          whatsapp_opt_in: boolean | null;
        };
        Insert: {
          area_max?: number | null;
          area_min?: number | null;
          assigned_to?: string | null;
          budget_max?: number | null;
          budget_min?: number | null;
          city?: string | null;
          client_file_id?: string | null;
          code?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          converted_at?: string | null;
          converted_to_deal_id?: string | null;
          created_at?: string | null;
          district?: string | null;
          government_support?: string | null;
          id?: string;
          main_category?: string | null;
          message?: string | null;
          payment_method?: string | null;
          request_type?: string | null;
          required_features?: string | null;
          rooms_max?: number | null;
          rooms_min?: number | null;
          status?: string | null;
          sub_category?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          urgency_level?: string | null;
          whatsapp_opt_in?: boolean | null;
        };
        Update: {
          area_max?: number | null;
          area_min?: number | null;
          assigned_to?: string | null;
          budget_max?: number | null;
          budget_min?: number | null;
          city?: string | null;
          client_file_id?: string | null;
          code?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          converted_at?: string | null;
          converted_to_deal_id?: string | null;
          created_at?: string | null;
          district?: string | null;
          government_support?: string | null;
          id?: string;
          main_category?: string | null;
          message?: string | null;
          payment_method?: string | null;
          request_type?: string | null;
          required_features?: string | null;
          rooms_max?: number | null;
          rooms_min?: number | null;
          status?: string | null;
          sub_category?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          urgency_level?: string | null;
          whatsapp_opt_in?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_requests_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_requests_client_file_id_fkey";
            columns: ["client_file_id"];
            isOneToOne: false;
            referencedRelation: "client_files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_requests_converted_to_deal_id_fkey";
            columns: ["converted_to_deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      property_views_log: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string | null;
          device_type: string | null;
          event_type: string;
          id: string;
          ip_hash: string | null;
          property_id: string | null;
          referer: string | null;
          tenant_id: string;
          user_agent: string | null;
          utm_campaign: string | null;
          utm_source: string | null;
          visitor_id: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          event_type?: string;
          id?: string;
          ip_hash?: string | null;
          property_id?: string | null;
          referer?: string | null;
          tenant_id: string;
          user_agent?: string | null;
          utm_campaign?: string | null;
          utm_source?: string | null;
          visitor_id?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          event_type?: string;
          id?: string;
          ip_hash?: string | null;
          property_id?: string | null;
          referer?: string | null;
          tenant_id?: string;
          user_agent?: string | null;
          utm_campaign?: string | null;
          utm_source?: string | null;
          visitor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_views_log_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_views_log_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "property_views_log_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      property_visit_bookings: {
        Row: {
          agent_notes: string | null;
          created_at: string | null;
          flexible: boolean | null;
          id: string;
          lead_capture_id: string | null;
          preferred_date: string;
          preferred_time: string | null;
          property_id: string | null;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
          visitor_email: string | null;
          visitor_name: string;
          visitor_phone: string;
        };
        Insert: {
          agent_notes?: string | null;
          created_at?: string | null;
          flexible?: boolean | null;
          id?: string;
          lead_capture_id?: string | null;
          preferred_date: string;
          preferred_time?: string | null;
          property_id?: string | null;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          visitor_email?: string | null;
          visitor_name: string;
          visitor_phone: string;
        };
        Update: {
          agent_notes?: string | null;
          created_at?: string | null;
          flexible?: boolean | null;
          id?: string;
          lead_capture_id?: string | null;
          preferred_date?: string;
          preferred_time?: string | null;
          property_id?: string | null;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          visitor_email?: string | null;
          visitor_name?: string;
          visitor_phone?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_visit_bookings_lead_capture_id_fkey";
            columns: ["lead_capture_id"];
            isOneToOne: false;
            referencedRelation: "lead_captures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_visit_bookings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_visit_bookings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "property_visit_bookings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      property_voice_intakes: {
        Row: {
          audio_url: string | null;
          confidence_score: number | null;
          created_at: string | null;
          error: string | null;
          extracted_fields: Json | null;
          id: string;
          property_id: string | null;
          status: string | null;
          tenant_id: string;
          transcript: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          audio_url?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          error?: string | null;
          extracted_fields?: Json | null;
          id?: string;
          property_id?: string | null;
          status?: string | null;
          tenant_id: string;
          transcript?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          audio_url?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          error?: string | null;
          extracted_fields?: Json | null;
          id?: string;
          property_id?: string | null;
          status?: string | null;
          tenant_id?: string;
          transcript?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_voice_intakes_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_voice_intakes_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "property_voice_intakes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth_secret: string;
          created_at: string;
          device_label: string | null;
          endpoint: string;
          id: string;
          is_active: boolean;
          last_used_at: string | null;
          p256dh: string;
          tenant_id: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth_secret: string;
          created_at?: string;
          device_label?: string | null;
          endpoint: string;
          id?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          p256dh: string;
          tenant_id: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth_secret?: string;
          created_at?: string;
          device_label?: string | null;
          endpoint?: string;
          id?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          p256dh?: string;
          tenant_id?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      quotations: {
        Row: {
          amount: number;
          client_id: string | null;
          client_name: string | null;
          client_phone: string | null;
          created_at: string | null;
          currency: string | null;
          id: string;
          notes: string | null;
          property_id: string | null;
          status: string | null;
          tenant_id: string | null;
          title: string;
          updated_at: string | null;
          valid_until: string | null;
        };
        Insert: {
          amount?: number;
          client_id?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          notes?: string | null;
          property_id?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          title: string;
          updated_at?: string | null;
          valid_until?: string | null;
        };
        Update: {
          amount?: number;
          client_id?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          notes?: string | null;
          property_id?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
        ];
      };
      rent_contracts: {
        Row: {
          contract_pdf_url: string | null;
          created_at: string | null;
          end_date: string;
          id: string;
          monthly_rent: number;
          notes: string | null;
          payment_day: number | null;
          payment_frequency: string | null;
          property_id: string | null;
          start_date: string;
          status: string;
          tenant_email: string | null;
          tenant_id: string;
          tenant_id_number: string | null;
          tenant_name: string;
          tenant_phone: string | null;
          updated_at: string | null;
        };
        Insert: {
          contract_pdf_url?: string | null;
          created_at?: string | null;
          end_date: string;
          id?: string;
          monthly_rent: number;
          notes?: string | null;
          payment_day?: number | null;
          payment_frequency?: string | null;
          property_id?: string | null;
          start_date: string;
          status?: string;
          tenant_email?: string | null;
          tenant_id: string;
          tenant_id_number?: string | null;
          tenant_name: string;
          tenant_phone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          contract_pdf_url?: string | null;
          created_at?: string | null;
          end_date?: string;
          id?: string;
          monthly_rent?: number;
          notes?: string | null;
          payment_day?: number | null;
          payment_frequency?: string | null;
          property_id?: string | null;
          start_date?: string;
          status?: string;
          tenant_email?: string | null;
          tenant_id?: string;
          tenant_id_number?: string | null;
          tenant_name?: string;
          tenant_phone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rent_contracts_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rent_contracts_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "rent_contracts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      rent_payments: {
        Row: {
          amount: number;
          contract_id: string;
          created_at: string | null;
          due_date: string;
          id: string;
          notes: string | null;
          paid_amount: number | null;
          paid_at: string | null;
          payment_method: string | null;
          reference_number: string | null;
          reminder_count: number | null;
          reminder_sent_at: string | null;
          status: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          contract_id: string;
          created_at?: string | null;
          due_date: string;
          id?: string;
          notes?: string | null;
          paid_amount?: number | null;
          paid_at?: string | null;
          payment_method?: string | null;
          reference_number?: string | null;
          reminder_count?: number | null;
          reminder_sent_at?: string | null;
          status?: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          contract_id?: string;
          created_at?: string | null;
          due_date?: string;
          id?: string;
          notes?: string | null;
          paid_amount?: number | null;
          paid_at?: string | null;
          payment_method?: string | null;
          reference_number?: string | null;
          reminder_count?: number | null;
          reminder_sent_at?: string | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rent_payments_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "rent_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rent_payments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      site_analytics: {
        Row: {
          created_at: string | null;
          element: string | null;
          event_type: string | null;
          id: string;
          page: string | null;
          tenant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          element?: string | null;
          event_type?: string | null;
          id?: string;
          page?: string | null;
          tenant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          element?: string | null;
          event_type?: string | null;
          id?: string;
          page?: string | null;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_analytics_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          color_accent: string | null;
          color_accent_dark: string | null;
          color_bg_card: string | null;
          color_bg_primary: string | null;
          color_bg_secondary: string | null;
          color_text_muted: string | null;
          color_text_primary: string | null;
          color_text_secondary: string | null;
          contact_email: string | null;
          coverage_text: string | null;
          cr_number: string | null;
          created_at: string | null;
          cta_subtitle: string | null;
          cta_title: string | null;
          email: string | null;
          engineers_license: string | null;
          fal_license: string | null;
          font_size_body: string | null;
          font_size_hero: string | null;
          font_size_section_title: string | null;
          font_size_small: string | null;
          footer_text: string | null;
          freelance_license: string | null;
          gam_license: string | null;
          hero_badge: string | null;
          hero_image: string | null;
          hero_subtitle: string | null;
          hero_title: string | null;
          id: string;
          login_link_text: string | null;
          maaroof_license: string | null;
          mowathaq_license: string | null;
          navbar_links: Json | null;
          page_home: string | null;
          page_links: string | null;
          page_map: string | null;
          page_privacy: string | null;
          page_requests: string | null;
          page_terms: string | null;
          phone: string | null;
          plan: string | null;
          plan_expires_at: string | null;
          services: Json | null;
          show_cta_section: boolean | null;
          show_properties_section: boolean | null;
          show_request_form: boolean | null;
          show_services: boolean | null;
          show_services_section: boolean | null;
          show_socials: boolean | null;
          show_why: boolean | null;
          show_why_section: boolean | null;
          site_address: string | null;
          site_logo: string | null;
          site_name: string | null;
          social_facebook: string | null;
          social_googlemaps: string | null;
          social_instagram: string | null;
          social_linkedin: string | null;
          social_snapchat: string | null;
          social_telegram: string | null;
          social_threads: string | null;
          social_tiktok: string | null;
          social_whatsapp: string | null;
          social_x: string | null;
          social_youtube: string | null;
          tenant_id: string | null;
          vat_number: string | null;
          whatsapp: string | null;
          why_cards: Json | null;
        };
        Insert: {
          color_accent?: string | null;
          color_accent_dark?: string | null;
          color_bg_card?: string | null;
          color_bg_primary?: string | null;
          color_bg_secondary?: string | null;
          color_text_muted?: string | null;
          color_text_primary?: string | null;
          color_text_secondary?: string | null;
          contact_email?: string | null;
          coverage_text?: string | null;
          cr_number?: string | null;
          created_at?: string | null;
          cta_subtitle?: string | null;
          cta_title?: string | null;
          email?: string | null;
          engineers_license?: string | null;
          fal_license?: string | null;
          font_size_body?: string | null;
          font_size_hero?: string | null;
          font_size_section_title?: string | null;
          font_size_small?: string | null;
          footer_text?: string | null;
          freelance_license?: string | null;
          gam_license?: string | null;
          hero_badge?: string | null;
          hero_image?: string | null;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: string;
          login_link_text?: string | null;
          maaroof_license?: string | null;
          mowathaq_license?: string | null;
          navbar_links?: Json | null;
          page_home?: string | null;
          page_links?: string | null;
          page_map?: string | null;
          page_privacy?: string | null;
          page_requests?: string | null;
          page_terms?: string | null;
          phone?: string | null;
          plan?: string | null;
          plan_expires_at?: string | null;
          services?: Json | null;
          show_cta_section?: boolean | null;
          show_properties_section?: boolean | null;
          show_request_form?: boolean | null;
          show_services?: boolean | null;
          show_services_section?: boolean | null;
          show_socials?: boolean | null;
          show_why?: boolean | null;
          show_why_section?: boolean | null;
          site_address?: string | null;
          site_logo?: string | null;
          site_name?: string | null;
          social_facebook?: string | null;
          social_googlemaps?: string | null;
          social_instagram?: string | null;
          social_linkedin?: string | null;
          social_snapchat?: string | null;
          social_telegram?: string | null;
          social_threads?: string | null;
          social_tiktok?: string | null;
          social_whatsapp?: string | null;
          social_x?: string | null;
          social_youtube?: string | null;
          tenant_id?: string | null;
          vat_number?: string | null;
          whatsapp?: string | null;
          why_cards?: Json | null;
        };
        Update: {
          color_accent?: string | null;
          color_accent_dark?: string | null;
          color_bg_card?: string | null;
          color_bg_primary?: string | null;
          color_bg_secondary?: string | null;
          color_text_muted?: string | null;
          color_text_primary?: string | null;
          color_text_secondary?: string | null;
          contact_email?: string | null;
          coverage_text?: string | null;
          cr_number?: string | null;
          created_at?: string | null;
          cta_subtitle?: string | null;
          cta_title?: string | null;
          email?: string | null;
          engineers_license?: string | null;
          fal_license?: string | null;
          font_size_body?: string | null;
          font_size_hero?: string | null;
          font_size_section_title?: string | null;
          font_size_small?: string | null;
          footer_text?: string | null;
          freelance_license?: string | null;
          gam_license?: string | null;
          hero_badge?: string | null;
          hero_image?: string | null;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: string;
          login_link_text?: string | null;
          maaroof_license?: string | null;
          mowathaq_license?: string | null;
          navbar_links?: Json | null;
          page_home?: string | null;
          page_links?: string | null;
          page_map?: string | null;
          page_privacy?: string | null;
          page_requests?: string | null;
          page_terms?: string | null;
          phone?: string | null;
          plan?: string | null;
          plan_expires_at?: string | null;
          services?: Json | null;
          show_cta_section?: boolean | null;
          show_properties_section?: boolean | null;
          show_request_form?: boolean | null;
          show_services?: boolean | null;
          show_services_section?: boolean | null;
          show_socials?: boolean | null;
          show_why?: boolean | null;
          show_why_section?: boolean | null;
          site_address?: string | null;
          site_logo?: string | null;
          site_name?: string | null;
          social_facebook?: string | null;
          social_googlemaps?: string | null;
          social_instagram?: string | null;
          social_linkedin?: string | null;
          social_snapchat?: string | null;
          social_telegram?: string | null;
          social_threads?: string | null;
          social_tiktok?: string | null;
          social_whatsapp?: string | null;
          social_x?: string | null;
          social_youtube?: string | null;
          tenant_id?: string | null;
          vat_number?: string | null;
          whatsapp?: string | null;
          why_cards?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_invoices: {
        Row: {
          billing: string | null;
          created_at: string | null;
          currency: string;
          description: string | null;
          id: string;
          invoice_counter: number;
          invoice_hash: string | null;
          invoice_number: string;
          invoice_type: string;
          paid_at: string | null;
          payment_id: string;
          payment_method: string | null;
          plan: string | null;
          qr_code: string | null;
          refunded_at: string | null;
          status: string;
          subtotal: number;
          tenant_id: string;
          total: number;
          updated_at: string | null;
          vat_amount: number;
          vat_rate: number;
          xml_uuid: string | null;
        };
        Insert: {
          billing?: string | null;
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          invoice_counter: number;
          invoice_hash?: string | null;
          invoice_number: string;
          invoice_type?: string;
          paid_at?: string | null;
          payment_id: string;
          payment_method?: string | null;
          plan?: string | null;
          qr_code?: string | null;
          refunded_at?: string | null;
          status?: string;
          subtotal: number;
          tenant_id: string;
          total: number;
          updated_at?: string | null;
          vat_amount: number;
          vat_rate?: number;
          xml_uuid?: string | null;
        };
        Update: {
          billing?: string | null;
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          invoice_counter?: number;
          invoice_hash?: string | null;
          invoice_number?: string;
          invoice_type?: string;
          paid_at?: string | null;
          payment_id?: string;
          payment_method?: string | null;
          plan?: string | null;
          qr_code?: string | null;
          refunded_at?: string | null;
          status?: string;
          subtotal?: number;
          tenant_id?: string;
          total?: number;
          updated_at?: string | null;
          vat_amount?: number;
          vat_rate?: number;
          xml_uuid?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      super_admins: {
        Row: {
          granted_at: string;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      support_requests: {
        Row: {
          assigned_to: string | null;
          category: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          id: string;
          message: string;
          page_url: string | null;
          preferred_method: string | null;
          resolution_note: string | null;
          resolved_at: string | null;
          status: string;
          subject: string;
          tenant_id: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          category?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          id?: string;
          message: string;
          page_url?: string | null;
          preferred_method?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          status?: string;
          subject: string;
          tenant_id?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          category?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          id?: string;
          message?: string;
          page_url?: string | null;
          preferred_method?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          status?: string;
          subject?: string;
          tenant_id?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          code: string | null;
          completion_percent: number | null;
          created_at: string | null;
          due_date: string | null;
          id: string;
          notes: string | null;
          priority: string | null;
          related_code: string | null;
          related_entity: string | null;
          reminder: string | null;
          start_date: string | null;
          status: string | null;
          task_type: string | null;
          tenant_id: string | null;
          title: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          code?: string | null;
          completion_percent?: number | null;
          created_at?: string | null;
          due_date?: string | null;
          id?: string;
          notes?: string | null;
          priority?: string | null;
          related_code?: string | null;
          related_entity?: string | null;
          reminder?: string | null;
          start_date?: string | null;
          status?: string | null;
          task_type?: string | null;
          tenant_id?: string | null;
          title?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          code?: string | null;
          completion_percent?: number | null;
          created_at?: string | null;
          due_date?: string | null;
          id?: string;
          notes?: string | null;
          priority?: string | null;
          related_code?: string | null;
          related_entity?: string | null;
          reminder?: string | null;
          start_date?: string | null;
          status?: string | null;
          task_type?: string | null;
          tenant_id?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      technicians: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          notes: string | null;
          phone: string | null;
          specialty: string | null;
          tenant_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          specialty?: string | null;
          tenant_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          specialty?: string | null;
          tenant_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "technicians_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_ai_config: {
        Row: {
          ai_model_override: string | null;
          ai_provider_override: string | null;
          approval_overrides: Json | null;
          ceo_phones: Json | null;
          created_at: string;
          id: string;
          is_enabled: boolean;
          notes: string | null;
          target_id: string;
          target_kind: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          ai_model_override?: string | null;
          ai_provider_override?: string | null;
          approval_overrides?: Json | null;
          ceo_phones?: Json | null;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          notes?: string | null;
          target_id: string;
          target_kind: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          ai_model_override?: string | null;
          ai_provider_override?: string | null;
          approval_overrides?: Json | null;
          ceo_phones?: Json | null;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          notes?: string | null;
          target_id?: string;
          target_kind?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_ai_config_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_members: {
        Row: {
          activated_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          last_seen_at: string | null;
          role: string;
          status: string;
          tenant_id: string;
          user_id: string | null;
        };
        Insert: {
          activated_at?: string | null;
          email: string;
          full_name?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          last_seen_at?: string | null;
          role?: string;
          status?: string;
          tenant_id: string;
          user_id?: string | null;
        };
        Update: {
          activated_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          last_seen_at?: string | null;
          role?: string;
          status?: string;
          tenant_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_onboarding: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          dismissed: boolean | null;
          dismissed_at: string | null;
          step_assistant_tested: boolean | null;
          step_profile_completed: boolean | null;
          step_property_added: boolean | null;
          step_whatsapp_connected: boolean | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          dismissed?: boolean | null;
          dismissed_at?: string | null;
          step_assistant_tested?: boolean | null;
          step_profile_completed?: boolean | null;
          step_property_added?: boolean | null;
          step_whatsapp_connected?: boolean | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          dismissed?: boolean | null;
          dismissed_at?: string | null;
          step_assistant_tested?: boolean | null;
          step_profile_completed?: boolean | null;
          step_property_added?: boolean | null;
          step_whatsapp_connected?: boolean | null;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_onboarding_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_payments: {
        Row: {
          amount: number;
          client_id: string | null;
          contract_id: string | null;
          created_at: string | null;
          due_date: string;
          id: string;
          notes: string | null;
          paid_date: string | null;
          status: string;
          tenant_id: string | null;
        };
        Insert: {
          amount: number;
          client_id?: string | null;
          contract_id?: string | null;
          created_at?: string | null;
          due_date: string;
          id?: string;
          notes?: string | null;
          paid_date?: string | null;
          status?: string;
          tenant_id?: string | null;
        };
        Update: {
          amount?: number;
          client_id?: string | null;
          contract_id?: string | null;
          created_at?: string | null;
          due_date?: string;
          id?: string;
          notes?: string | null;
          paid_date?: string | null;
          status?: string;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_payments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_payments_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_payments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          daily_call_count: number;
          daily_call_limit: number;
          id: string;
          is_active: boolean;
          last_count_reset: string;
          master_paused_at: string | null;
          master_paused_reason: string | null;
          office_mode_enabled: boolean;
          owner_id: string | null;
          plan: string;
          slug: string;
          system_master_active: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          daily_call_count?: number;
          daily_call_limit?: number;
          id?: string;
          is_active?: boolean;
          last_count_reset?: string;
          master_paused_at?: string | null;
          master_paused_reason?: string | null;
          office_mode_enabled?: boolean;
          owner_id?: string | null;
          plan?: string;
          slug: string;
          system_master_active?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          daily_call_count?: number;
          daily_call_limit?: number;
          id?: string;
          is_active?: boolean;
          last_count_reset?: string;
          master_paused_at?: string | null;
          master_paused_reason?: string | null;
          office_mode_enabled?: boolean;
          owner_id?: string | null;
          plan?: string;
          slug?: string;
          system_master_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          client_avatar_url: string | null;
          client_name: string;
          client_role: string | null;
          created_at: string | null;
          display_order: number | null;
          id: string;
          is_featured: boolean | null;
          is_published: boolean | null;
          property_id: string | null;
          rating: number;
          tenant_id: string;
          testimonial_date: string | null;
          testimonial_text: string;
          updated_at: string | null;
        };
        Insert: {
          client_avatar_url?: string | null;
          client_name: string;
          client_role?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_featured?: boolean | null;
          is_published?: boolean | null;
          property_id?: string | null;
          rating?: number;
          tenant_id: string;
          testimonial_date?: string | null;
          testimonial_text: string;
          updated_at?: string | null;
        };
        Update: {
          client_avatar_url?: string | null;
          client_name?: string;
          client_role?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_featured?: boolean | null;
          is_published?: boolean | null;
          property_id?: string | null;
          rating?: number;
          tenant_id?: string;
          testimonial_date?: string | null;
          testimonial_text?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "testimonials_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "testimonials_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "testimonials_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      user_2fa_attempts: {
        Row: {
          created_at: string | null;
          id: string;
          ip_address: string | null;
          method: string | null;
          success: boolean;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          method?: string | null;
          success: boolean;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          method?: string | null;
          success?: boolean;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_2fa_secrets: {
        Row: {
          created_at: string | null;
          enabled_at: string | null;
          is_enabled: boolean | null;
          last_used_at: string | null;
          secret: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          enabled_at?: string | null;
          is_enabled?: boolean | null;
          last_used_at?: string | null;
          secret: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          enabled_at?: string | null;
          is_enabled?: boolean | null;
          last_used_at?: string | null;
          secret?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_recovery_codes: {
        Row: {
          code_hash: string;
          created_at: string | null;
          id: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          code_hash: string;
          created_at?: string | null;
          id?: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          code_hash?: string;
          created_at?: string | null;
          id?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          role: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          full_name?: string | null;
          id?: string;
          role?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      virtual_staging_jobs: {
        Row: {
          completed_at: string | null;
          cost_estimate: number | null;
          created_at: string | null;
          error: string | null;
          id: string;
          property_id: string | null;
          provider: string | null;
          result_image_url: string | null;
          room_type: string | null;
          source_image_url: string;
          status: string | null;
          style: string | null;
          tenant_id: string;
        };
        Insert: {
          completed_at?: string | null;
          cost_estimate?: number | null;
          created_at?: string | null;
          error?: string | null;
          id?: string;
          property_id?: string | null;
          provider?: string | null;
          result_image_url?: string | null;
          room_type?: string | null;
          source_image_url: string;
          status?: string | null;
          style?: string | null;
          tenant_id: string;
        };
        Update: {
          completed_at?: string | null;
          cost_estimate?: number | null;
          created_at?: string | null;
          error?: string | null;
          id?: string;
          property_id?: string | null;
          provider?: string | null;
          result_image_url?: string | null;
          room_type?: string | null;
          source_image_url?: string;
          status?: string | null;
          style?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "virtual_staging_jobs_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "virtual_staging_jobs_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "virtual_staging_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      weekly_insights: {
        Row: {
          created_at: string;
          email_sent_at: string | null;
          email_to: string | null;
          generated_by_model: string | null;
          id: string;
          period_end: string;
          period_start: string;
          raw_metrics: Json;
          recommendations: string | null;
          summary_text: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          email_sent_at?: string | null;
          email_to?: string | null;
          generated_by_model?: string | null;
          id?: string;
          period_end: string;
          period_start: string;
          raw_metrics?: Json;
          recommendations?: string | null;
          summary_text?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          email_sent_at?: string | null;
          email_to?: string | null;
          generated_by_model?: string | null;
          id?: string;
          period_end?: string;
          period_start?: string;
          raw_metrics?: Json;
          recommendations?: string | null;
          summary_text?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_insights_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_catalog_sync_log: {
        Row: {
          action: string;
          created_at: string | null;
          error: string | null;
          id: string;
          meta_product_id: string | null;
          payload: Json | null;
          property_id: string | null;
          response: Json | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          error?: string | null;
          id?: string;
          meta_product_id?: string | null;
          payload?: Json | null;
          property_id?: string | null;
          response?: Json | null;
          status?: string;
          tenant_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          error?: string | null;
          id?: string;
          meta_product_id?: string | null;
          payload?: Json | null;
          property_id?: string | null;
          response?: Json | null;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_catalog_sync_log_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_catalog_sync_log_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "whatsapp_catalog_sync_log_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_config: {
        Row: {
          access_token_enc: string | null;
          ai_model: string | null;
          ai_provider: string | null;
          auto_reply_enabled: boolean;
          business_account_id: string | null;
          created_at: string;
          display_name: string | null;
          display_phone: string | null;
          is_active: boolean;
          phone_number_id: string | null;
          tenant_id: string;
          updated_at: string;
          webhook_verify_token: string | null;
        };
        Insert: {
          access_token_enc?: string | null;
          ai_model?: string | null;
          ai_provider?: string | null;
          auto_reply_enabled?: boolean;
          business_account_id?: string | null;
          created_at?: string;
          display_name?: string | null;
          display_phone?: string | null;
          is_active?: boolean;
          phone_number_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          webhook_verify_token?: string | null;
        };
        Update: {
          access_token_enc?: string | null;
          ai_model?: string | null;
          ai_provider?: string | null;
          auto_reply_enabled?: boolean;
          business_account_id?: string | null;
          created_at?: string;
          display_name?: string | null;
          display_phone?: string | null;
          is_active?: boolean;
          phone_number_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          webhook_verify_token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_config_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_messages: {
        Row: {
          ai_intent: string | null;
          ai_replied: boolean | null;
          body_text: string | null;
          client_id: string | null;
          contact_name: string | null;
          contact_phone: string;
          created_at: string;
          direction: string;
          failure_reason: string | null;
          id: string;
          matched_property_ids: string[] | null;
          media_url: string | null;
          message_type: string | null;
          meta_message_id: string | null;
          status: string | null;
          template_name: string | null;
          tenant_id: string;
        };
        Insert: {
          ai_intent?: string | null;
          ai_replied?: boolean | null;
          body_text?: string | null;
          client_id?: string | null;
          contact_name?: string | null;
          contact_phone: string;
          created_at?: string;
          direction: string;
          failure_reason?: string | null;
          id?: string;
          matched_property_ids?: string[] | null;
          media_url?: string | null;
          message_type?: string | null;
          meta_message_id?: string | null;
          status?: string | null;
          template_name?: string | null;
          tenant_id: string;
        };
        Update: {
          ai_intent?: string | null;
          ai_replied?: boolean | null;
          body_text?: string | null;
          client_id?: string | null;
          contact_name?: string | null;
          contact_phone?: string;
          created_at?: string;
          direction?: string;
          failure_reason?: string | null;
          id?: string;
          matched_property_ids?: string[] | null;
          media_url?: string | null;
          message_type?: string | null;
          meta_message_id?: string | null;
          status?: string | null;
          template_name?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_templates: {
        Row: {
          body_text: string | null;
          category: string | null;
          created_at: string;
          display_name: string;
          id: string;
          language: string | null;
          meta_status: string | null;
          meta_template_name: string;
          tenant_id: string;
          updated_at: string;
          variables: Json | null;
        };
        Insert: {
          body_text?: string | null;
          category?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          language?: string | null;
          meta_status?: string | null;
          meta_template_name: string;
          tenant_id: string;
          updated_at?: string;
          variables?: Json | null;
        };
        Update: {
          body_text?: string | null;
          category?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          language?: string | null;
          meta_status?: string | null;
          meta_template_name?: string;
          tenant_id?: string;
          updated_at?: string;
          variables?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      work_orders: {
        Row: {
          actual_cost: number | null;
          asset_id: string | null;
          category: string | null;
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          estimated_cost: number | null;
          id: string;
          kind: string | null;
          photos: string[] | null;
          priority: string | null;
          property_id: string | null;
          reported_by: string | null;
          reporter_name: string | null;
          reporter_phone: string | null;
          resolution: string | null;
          scheduled_for: string | null;
          started_at: string | null;
          status: string | null;
          technician_id: string | null;
          tenant_id: string;
          ticket_number: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          actual_cost?: number | null;
          asset_id?: string | null;
          category?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          estimated_cost?: number | null;
          id?: string;
          kind?: string | null;
          photos?: string[] | null;
          priority?: string | null;
          property_id?: string | null;
          reported_by?: string | null;
          reporter_name?: string | null;
          reporter_phone?: string | null;
          resolution?: string | null;
          scheduled_for?: string | null;
          started_at?: string | null;
          status?: string | null;
          technician_id?: string | null;
          tenant_id: string;
          ticket_number?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          actual_cost?: number | null;
          asset_id?: string | null;
          category?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          estimated_cost?: number | null;
          id?: string;
          kind?: string | null;
          photos?: string[] | null;
          priority?: string | null;
          property_id?: string | null;
          reported_by?: string | null;
          reporter_name?: string | null;
          reporter_phone?: string | null;
          resolution?: string | null;
          scheduled_for?: string | null;
          started_at?: string | null;
          status?: string | null;
          technician_id?: string | null;
          tenant_id?: string;
          ticket_number?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "work_orders_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_orders_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_orders_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "property_distribution_summary";
            referencedColumns: ["property_id"];
          },
          {
            foreignKeyName: "work_orders_technician_id_fkey";
            columns: ["technician_id"];
            isOneToOne: false;
            referencedRelation: "technicians";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      zatca_submissions: {
        Row: {
          error_message: string | null;
          id: string;
          invoice_id: string;
          response_body: Json | null;
          status: string;
          submitted_at: string | null;
          tenant_id: string;
          xml_payload: string | null;
        };
        Insert: {
          error_message?: string | null;
          id?: string;
          invoice_id: string;
          response_body?: Json | null;
          status?: string;
          submitted_at?: string | null;
          tenant_id: string;
          xml_payload?: string | null;
        };
        Update: {
          error_message?: string | null;
          id?: string;
          invoice_id?: string;
          response_body?: Json | null;
          status?: string;
          submitted_at?: string | null;
          tenant_id?: string;
          xml_payload?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "zatca_submissions_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zatca_submissions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      property_distribution_summary: {
        Row: {
          active_portals: string[] | null;
          draft_count: number | null;
          expired_count: number | null;
          property_id: string | null;
          published_count: number | null;
          tenant_id: string | null;
          title: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      rent_dashboard_stats: {
        Row: {
          month_collected: number | null;
          overdue_amount: number | null;
          overdue_count: number | null;
          paid_count: number | null;
          partial_count: number | null;
          pending_count: number | null;
          tenant_id: string | null;
          unpaid_total: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "rent_payments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      activate_existing_invites: { Args: never; Returns: number };
      admin_audit_recent: {
        Args: { limit_n?: number };
        Returns: {
          action: string;
          created_at: string;
          entity_name: string;
          entity_type: string;
          id: string;
          ip_address: string;
          tenant_id: string;
          tenant_slug: string;
          user_email: string;
        }[];
      };
      admin_list_subscriptions: {
        Args: never;
        Returns: {
          broker_name: string;
          is_active: boolean;
          monthly_value: number;
          plan: string;
          slug: string;
          started_at: string;
          tenant_id: string;
        }[];
      };
      admin_list_tenants: {
        Args: never;
        Returns: {
          broker_name: string;
          client_count: number;
          created_at: string;
          deal_count: number;
          id: string;
          is_active: boolean;
          last_activity: string;
          owner_email: string;
          owner_id: string;
          plan: string;
          property_count: number;
          slug: string;
        }[];
      };
      admin_platform_overview: {
        Args: never;
        Returns: {
          active_tenants: number;
          basic_plan_count: number;
          free_plan_count: number;
          new_tenants_30d: number;
          paid_invoices_total: number;
          pro_plan_count: number;
          published_properties: number;
          suspended_tenants: number;
          total_clients: number;
          total_deals: number;
          total_invoices: number;
          total_properties: number;
          total_tenants: number;
        }[];
      };
      admin_set_tenant_plan: {
        Args: { new_plan: string; tid: string };
        Returns: boolean;
      };
      admin_suspend_tenant: {
        Args: { suspend: boolean; tid: string };
        Returns: boolean;
      };
      admin_tenant_detail: { Args: { tid: string }; Returns: Json };
      assert_system_active: { Args: { p_tenant_id: string }; Returns: Json };
      consume_invite_code: {
        Args: { p_code: string; p_user_id: string };
        Returns: Json;
      };
      decide_approval: {
        Args: {
          p_ceo_decision: string;
          p_decision: string;
          p_escalation_id: string;
          p_user_id: string;
        };
        Returns: {
          action_required: string | null;
          approval_kind: string | null;
          auto_approved: boolean | null;
          ceo_decision: string | null;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          description: string;
          executed_at: string | null;
          execution_result: Json | null;
          expires_at: string | null;
          id: string;
          payload: Json | null;
          pending_action: Json | null;
          raised_by_id: string;
          raised_by_kind: string;
          severity: string;
          status: string;
          tenant_id: string;
          title: string;
          type: string;
        };
        SetofOptions: {
          from: "*";
          to: "org_escalations";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      ensure_ai_employee_settings: {
        Args: never;
        Returns: {
          ai_model: string | null;
          ai_provider: string | null;
          analyst_enabled: boolean;
          analyst_report_email: string | null;
          created_at: string;
          followup_cold_days: number | null;
          followup_enabled: boolean;
          language: string | null;
          marketer_enabled: boolean;
          receiver_enabled: boolean;
          tenant_id: string;
          updated_at: string;
          voice_style: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "ai_employee_settings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      generate_rent_payments: {
        Args: { p_contract_id: string };
        Returns: number;
      };
      get_directives_for_target: {
        Args: {
          p_target_id: string;
          p_target_kind: string;
          p_tenant_id: string;
        };
        Returns: {
          content: string;
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          parent_directive_id: string | null;
          source: string;
          status: string;
          structured_rules: Json | null;
          target_id: string;
          target_kind: string;
          tenant_id: string;
          title: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "directives";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_kb_for_target: {
        Args: {
          p_target_id: string;
          p_target_kind: string;
          p_tenant_id: string;
        };
        Returns: {
          category: string;
          content: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          tags: string[] | null;
          target_id: string;
          target_kind: string;
          tenant_id: string;
          title: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "knowledge_base";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      increment_ai_call_count: {
        Args: { p_tenant_id: string };
        Returns: number;
      };
      is_ceo_phone: {
        Args: { p_phone: string; p_tenant_id: string };
        Returns: boolean;
      };
      is_super_admin: { Args: never; Returns: boolean };
      is_valid_saudi_vat: { Args: { v: string }; Returns: boolean };
      latest_manager_reviews: {
        Args: never;
        Returns: {
          concerns: Json;
          created_at: string;
          highlights: Json;
          manager_code: string;
          manager_id: string;
          manager_name: string;
          metrics: Json;
          period_end: string;
          review_id: string;
          suggestions_count: number;
          summary: string;
        }[];
      };
      mark_notification_read: { Args: { n_id: string }; Returns: undefined };
      my_push_subscriptions: {
        Args: never;
        Returns: {
          auth_secret: string;
          created_at: string;
          device_label: string | null;
          endpoint: string;
          id: string;
          is_active: boolean;
          last_used_at: string | null;
          p256dh: string;
          tenant_id: string;
          user_agent: string | null;
          user_id: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "push_subscriptions";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      my_role: { Args: never; Returns: string };
      my_tenant_id: { Args: never; Returns: string };
      next_e_contract_number: { Args: { tid: string }; Returns: string };
      next_invoice_counter: { Args: { t_id: string }; Returns: number };
      next_subscription_invoice_counter: {
        Args: { p_tenant_id: string };
        Returns: number;
      };
      org_structure_for_tenant: {
        Args: never;
        Returns: {
          active_directives: number;
          department: string;
          employee_count: number;
          kb_items: number;
          manager_code: string;
          manager_enabled: boolean;
          manager_id: string;
          manager_name: string;
          pending_suggestions: number;
        }[];
      };
      submit_for_approval: {
        Args: {
          p_description: string;
          p_employee_id: string;
          p_expires_in_minutes?: number;
          p_pending_action: Json;
          p_severity: string;
          p_tenant_id: string;
          p_title: string;
          p_type: string;
        };
        Returns: string;
      };
      tenant_2fa_coverage: {
        Args: never;
        Returns: {
          pct: number;
          total_users: number;
          with_2fa: number;
        }[];
      };
      tenant_by_whatsapp_phone_id: { Args: { pn_id: string }; Returns: string };
      user_has_2fa: { Args: { u_id: string }; Returns: boolean };
      validate_invite_code: { Args: { p_code: string }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
