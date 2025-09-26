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
      ai_job_events: {
        Row: {
          created_at: string
          event_type: string | null
          id: string
          job_id: string | null
          payload_json: Json
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          id?: string
          job_id?: string | null
          payload_json?: Json
        }
        Update: {
          created_at?: string
          event_type?: string | null
          id?: string
          job_id?: string | null
          payload_json?: Json
        }
        Relationships: []
      }
      ai_job_inputs: {
        Row: {
          bytes: number | null
          created_at: string
          id: string
          index: number | null
          job_id: string | null
          metadata_json: Json
          mime_type: string | null
          r2_key: string | null
          source: string | null
          type: string | null
          url: string | null
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          id?: string
          index?: number | null
          job_id?: string | null
          metadata_json?: Json
          mime_type?: string | null
          r2_key?: string | null
          source?: string | null
          type?: string | null
          url?: string | null
        }
        Update: {
          bytes?: number | null
          created_at?: string
          id?: string
          index?: number | null
          job_id?: string | null
          metadata_json?: Json
          mime_type?: string | null
          r2_key?: string | null
          source?: string | null
          type?: string | null
          url?: string | null
        }
        Relationships: []
      }
      ai_job_outputs: {
        Row: {
          bytes: number | null
          created_at: string
          duration: number | null
          expires_at: string | null
          height: number | null
          id: string
          index: number | null
          job_id: string | null
          mime_type: string | null
          moderation_json: Json
          r2_key: string | null
          thumb_url: string | null
          type: string | null
          url: string | null
          width: number | null
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          duration?: number | null
          expires_at?: string | null
          height?: number | null
          id?: string
          index?: number | null
          job_id?: string | null
          mime_type?: string | null
          moderation_json?: Json
          r2_key?: string | null
          thumb_url?: string | null
          type?: string | null
          url?: string | null
          width?: number | null
        }
        Update: {
          bytes?: number | null
          created_at?: string
          duration?: number | null
          expires_at?: string | null
          height?: number | null
          id?: string
          index?: number | null
          job_id?: string | null
          mime_type?: string | null
          moderation_json?: Json
          r2_key?: string | null
          thumb_url?: string | null
          type?: string | null
          url?: string | null
          width?: number | null
        }
        Relationships: []
      }
      ai_jobs: {
        Row: {
          completed_at: string | null
          cost_actual_credits: number | null
          cost_estimated_credits: number | null
          created_at: string
          error_message: string | null
          id: string
          input_params_json: Json
          input_schema_version_at_submit: string | null
          is_public: boolean
          metadata_json: Json
          modality_code: string | null
          model_id: string | null
          model_slug_at_submit: string | null
          model_version_id: string | null
          pricing_schema_version_at_submit: string | null
          pricing_snapshot_json: Json
          priority: number | null
          provider_code: string | null
          provider_job_id: string | null
          public_assets: Json | null
          public_summary: string | null
          public_title: string | null
          reconciled_at: string | null
          seed: string | null
          share_conversion_count: number
          share_slug: string | null
          share_visit_count: number
          started_at: string | null
          status: string | null
          usage_metrics_json: Json
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          completed_at?: string | null
          cost_actual_credits?: number | null
          cost_estimated_credits?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_params_json?: Json
          input_schema_version_at_submit?: string | null
          is_public?: boolean
          metadata_json?: Json
          modality_code?: string | null
          model_id?: string | null
          model_slug_at_submit?: string | null
          model_version_id?: string | null
          pricing_schema_version_at_submit?: string | null
          pricing_snapshot_json?: Json
          priority?: number | null
          provider_code?: string | null
          provider_job_id?: string | null
          public_assets?: Json | null
          public_summary?: string | null
          public_title?: string | null
          reconciled_at?: string | null
          seed?: string | null
          share_conversion_count?: number
          share_slug?: string | null
          share_visit_count?: number
          started_at?: string | null
          status?: string | null
          usage_metrics_json?: Json
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          completed_at?: string | null
          cost_actual_credits?: number | null
          cost_estimated_credits?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_params_json?: Json
          input_schema_version_at_submit?: string | null
          is_public?: boolean
          metadata_json?: Json
          modality_code?: string | null
          model_id?: string | null
          model_slug_at_submit?: string | null
          model_version_id?: string | null
          pricing_schema_version_at_submit?: string | null
          pricing_snapshot_json?: Json
          priority?: number | null
          provider_code?: string | null
          provider_job_id?: string | null
          public_assets?: Json | null
          public_summary?: string | null
          public_title?: string | null
          reconciled_at?: string | null
          seed?: string | null
          share_conversion_count?: number
          share_slug?: string | null
          share_visit_count?: number
          started_at?: string | null
          status?: string | null
          usage_metrics_json?: Json
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      ai_modalities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata_json: Json
          modality_code: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata_json?: Json
          modality_code?: string | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata_json?: Json
          modality_code?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_model_tags: {
        Row: {
          model_id: string
          tag_id: string
        }
        Insert: {
          model_id: string
          tag_id: string
        }
        Update: {
          model_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      ai_model_versions: {
        Row: {
          activated_at: string | null
          base_cost_credits: number | null
          compute_class: string | null
          cost_formula_json: Json
          created_at: string
          default_params_json: Json
          deprecated_at: string | null
          hidden_at: string | null
          id: string
          input_schema_json: Json
          input_schema_version: string | null
          limits_json: Json
          model_id: string | null
          moderation_json: Json
          output_schema_json: Json
          output_schema_version: string | null
          pricing_mode: string | null
          pricing_schema_version: string | null
          provider_extra_json: Json
          provider_model_key: string | null
          regions: string[] | null
          safety_preset: string | null
          status: string | null
          updated_at: string
          version_label: string | null
          visibility_scope: string | null
        }
        Insert: {
          activated_at?: string | null
          base_cost_credits?: number | null
          compute_class?: string | null
          cost_formula_json?: Json
          created_at?: string
          default_params_json?: Json
          deprecated_at?: string | null
          hidden_at?: string | null
          id?: string
          input_schema_json?: Json
          input_schema_version?: string | null
          limits_json?: Json
          model_id?: string | null
          moderation_json?: Json
          output_schema_json?: Json
          output_schema_version?: string | null
          pricing_mode?: string | null
          pricing_schema_version?: string | null
          provider_extra_json?: Json
          provider_model_key?: string | null
          regions?: string[] | null
          safety_preset?: string | null
          status?: string | null
          updated_at?: string
          version_label?: string | null
          visibility_scope?: string | null
        }
        Update: {
          activated_at?: string | null
          base_cost_credits?: number | null
          compute_class?: string | null
          cost_formula_json?: Json
          created_at?: string
          default_params_json?: Json
          deprecated_at?: string | null
          hidden_at?: string | null
          id?: string
          input_schema_json?: Json
          input_schema_version?: string | null
          limits_json?: Json
          model_id?: string | null
          moderation_json?: Json
          output_schema_json?: Json
          output_schema_version?: string | null
          pricing_mode?: string | null
          pricing_schema_version?: string | null
          provider_extra_json?: Json
          provider_model_key?: string | null
          regions?: string[] | null
          safety_preset?: string | null
          status?: string | null
          updated_at?: string
          version_label?: string | null
          visibility_scope?: string | null
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          created_at: string
          default_version_id: string | null
          description: string | null
          display_order: number
          id: string
          lang_jsonb: Json
          metadata_json: Json
          modality_code: string | null
          model_slug: string | null
          name: string | null
          provider_code: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_version_id?: string | null
          description?: string | null
          display_order?: number
          id?: string
          lang_jsonb?: Json
          metadata_json?: Json
          modality_code?: string | null
          model_slug?: string | null
          name?: string | null
          provider_code?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_version_id?: string | null
          description?: string | null
          display_order?: number
          id?: string
          lang_jsonb?: Json
          metadata_json?: Json
          modality_code?: string | null
          model_slug?: string | null
          name?: string | null
          provider_code?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          created_at: string
          id: string
          metadata_json: Json
          name: string | null
          notes: string | null
          provider_code: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata_json?: Json
          name?: string | null
          notes?: string | null
          provider_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata_json?: Json
          name?: string | null
          notes?: string | null
          provider_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lang_jsonb: Json
          name: string | null
          tag_code: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lang_jsonb?: Json
          name?: string | null
          tag_code?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lang_jsonb?: Json
          name?: string | null
          tag_code?: string | null
        }
        Relationships: []
      }
      auth_email_otps: {
        Row: {
          attempts: number
          code_hash: string | null
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          payload_json: Json
          purpose: string | null
          status: string | null
          used_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          payload_json?: Json
          purpose?: string | null
          status?: string | null
          used_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          payload_json?: Json
          purpose?: string | null
          status?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      credit_logs: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          one_time_balance_after: number
          related_job_id: string | null
          related_order_id: string | null
          subscription_balance_after: number
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          one_time_balance_after: number
          related_job_id?: string | null
          related_order_id?: string | null
          subscription_balance_after: number
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          one_time_balance_after?: number
          related_job_id?: string | null
          related_order_id?: string | null
          subscription_balance_after?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_logs_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      image_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          feature_id: string
          final_output_url: string | null
          final_seed_used: number | null
          id: string
          is_public: boolean
          provider: string
          provider_job_id: string | null
          provider_model: string | null
          public_assets: Json | null
          public_summary: string | null
          public_title: string | null
          request_params: Json
          share_conversion_count: number
          share_slug: string | null
          share_visit_count: number
          status: Database["public"]["Enums"]["job_status"]
          temp_output_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          feature_id: string
          final_output_url?: string | null
          final_seed_used?: number | null
          id?: string
          is_public?: boolean
          provider?: string
          provider_job_id?: string | null
          provider_model?: string | null
          public_assets?: Json | null
          public_summary?: string | null
          public_title?: string | null
          request_params: Json
          share_conversion_count?: number
          share_slug?: string | null
          share_visit_count?: number
          status?: Database["public"]["Enums"]["job_status"]
          temp_output_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          feature_id?: string
          final_output_url?: string | null
          final_seed_used?: number | null
          id?: string
          is_public?: boolean
          provider?: string
          provider_job_id?: string | null
          provider_model?: string | null
          public_assets?: Json | null
          public_summary?: string | null
          public_title?: string | null
          request_params?: Json
          share_conversion_count?: number
          share_slug?: string | null
          share_visit_count?: number
          status?: Database["public"]["Enums"]["job_status"]
          temp_output_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_share_conversions: {
        Row: {
          created_at: string
          id: string
          invited_user_id: string
          inviter_user_id: string
          job_id: string
          metadata: Json | null
          reward_granted_at: string | null
          status: Database["public"]["Enums"]["job_share_conversion_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_user_id: string
          inviter_user_id: string
          job_id: string
          metadata?: Json | null
          reward_granted_at?: string | null
          status?: Database["public"]["Enums"]["job_share_conversion_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_user_id?: string
          inviter_user_id?: string
          job_id?: string
          metadata?: Json | null
          reward_granted_at?: string | null
          status?: Database["public"]["Enums"]["job_share_conversion_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_share_conversions_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_share_conversions_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_share_conversions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_discount: number | null
          amount_subtotal: number | null
          amount_tax: number | null
          amount_total: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          order_type: string
          plan_id: string | null
          price_id: string | null
          product_id: string | null
          provider: string
          provider_order_id: string
          status: string
          subscription_provider_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_discount?: number | null
          amount_subtotal?: number | null
          amount_tax?: number | null
          amount_total: number
          created_at?: string
          currency: string
          id?: string
          metadata?: Json | null
          order_type: string
          plan_id?: string | null
          price_id?: string | null
          product_id?: string | null
          provider: string
          provider_order_id: string
          status: string
          subscription_provider_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_discount?: number | null
          amount_subtotal?: number | null
          amount_tax?: number | null
          amount_total?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          order_type?: string
          plan_id?: string | null
          price_id?: string | null
          product_id?: string | null
          provider?: string
          provider_order_id?: string
          status?: string
          subscription_provider_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string | null
          created_at: string
          description: string | null
          featured_image_url: string | null
          id: string
          is_pinned: boolean
          language: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string
          description?: string | null
          featured_image_url?: string | null
          id?: string
          is_pinned?: boolean
          language: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string
          description?: string | null
          featured_image_url?: string | null
          id?: string
          is_pinned?: boolean
          language?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          benefits_jsonb: Json | null
          button_link: string | null
          button_text: string | null
          card_description: string | null
          card_title: string
          created_at: string
          currency: string | null
          display_order: number
          display_price: string | null
          enable_manual_input_coupon: boolean | null
          environment: string
          features: Json
          highlight_text: string | null
          id: string
          is_active: boolean
          is_highlighted: boolean
          lang_jsonb: Json
          original_price: string | null
          payment_type: string | null
          price: number | null
          price_suffix: string | null
          recurring_interval: string | null
          stripe_coupon_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          trial_period_days: number | null
          updated_at: string
        }
        Insert: {
          benefits_jsonb?: Json | null
          button_link?: string | null
          button_text?: string | null
          card_description?: string | null
          card_title: string
          created_at?: string
          currency?: string | null
          display_order?: number
          display_price?: string | null
          enable_manual_input_coupon?: boolean | null
          environment: string
          features?: Json
          highlight_text?: string | null
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          lang_jsonb?: Json
          original_price?: string | null
          payment_type?: string | null
          price?: number | null
          price_suffix?: string | null
          recurring_interval?: string | null
          stripe_coupon_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
        }
        Update: {
          benefits_jsonb?: Json | null
          button_link?: string | null
          button_text?: string | null
          card_description?: string | null
          card_title?: string
          created_at?: string
          currency?: string | null
          display_order?: number
          display_price?: string | null
          enable_manual_input_coupon?: boolean | null
          environment?: string
          features?: Json
          highlight_text?: string | null
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          lang_jsonb?: Json
          original_price?: string | null
          payment_type?: string | null
          price?: number | null
          price_suffix?: string | null
          recurring_interval?: string | null
          stripe_coupon_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          plan_id: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      usage: {
        Row: {
          balance_jsonb: Json
          created_at: string
          id: string
          one_time_credits_balance: number
          subscription_credits_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_jsonb?: Json
          created_at?: string
          id?: string
          one_time_credits_balance?: number
          subscription_credits_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_jsonb?: Json
          created_at?: string
          id?: string
          one_time_credits_balance?: number
          subscription_credits_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invite_code: string | null
          inviter_user_id: string | null
          payment_provider: string | null
          role: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          invite_code?: string | null
          inviter_user_id?: string | null
          payment_provider?: string | null
          role?: string
          stripe_customer_id?: string | null
          updated_at: string
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invite_code?: string | null
          inviter_user_id?: string | null
          payment_provider?: string | null
          role?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_specific_monthly_credit_for_year_plan: {
        Args: {
          p_current_yyyy_mm: string
          p_monthly_credits: number
          p_user_id: string
        }
        Returns: undefined
      }
      deduct_credits_and_log: {
        Args: { p_deduct_amount: number; p_notes: string; p_user_id: string }
        Returns: boolean
      }
      deduct_credits_priority_one_time: {
        Args: { p_amount_to_deduct: number; p_user_id: string }
        Returns: {
          message: string
          new_one_time_credits_balance: number
          new_subscription_credits_balance: number
          new_total_available_credits: number
          success: boolean
        }[]
      }
      deduct_credits_priority_subscription: {
        Args: { p_amount_to_deduct: number; p_user_id: string }
        Returns: {
          message: string
          new_one_time_credits_balance: number
          new_subscription_credits_balance: number
          new_total_available_credits: number
          success: boolean
        }[]
      }
      deduct_one_time_credits: {
        Args: { p_amount_to_deduct: number; p_user_id: string }
        Returns: {
          message: string
          new_one_time_credits_balance: number
          new_subscription_credits_balance: number
          new_total_available_credits: number
          success: boolean
        }[]
      }
      deduct_subscription_credits: {
        Args: { p_amount_to_deduct: number; p_user_id: string }
        Returns: {
          message: string
          new_one_time_credits_balance: number
          new_subscription_credits_balance: number
          new_total_available_credits: number
          success: boolean
        }[]
      }
      get_daily_growth_stats: {
        Args: { start_date_param: string }
        Returns: {
          new_orders_count: number
          new_users_count: number
          report_date: string
        }[]
      }
      get_order_stats_for_period: {
        Args: { end_date_param: string; start_date_param: string }
        Returns: Json
      }
      grant_one_time_credits_and_log: {
        Args: {
          p_credits_to_add: number
          p_related_order_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      grant_share_reward_and_log: {
        Args: {
          p_credits_to_add: number
          p_log_type?: string
          p_notes?: string
          p_related_job_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      grant_subscription_credits_and_log: {
        Args: {
          p_credits_to_set: number
          p_related_order_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      grant_welcome_credits_and_log: {
        Args: { p_user_id: string; p_welcome_credits?: number }
        Returns: {
          balance_jsonb: Json
          one_time_credits_balance: number
          subscription_credits_balance: number
        }[]
      }
      increment_ai_job_share_conversion: {
        Args: { p_job_id: string }
        Returns: undefined
      }
      increment_ai_job_share_visit: {
        Args: { p_job_id: string }
        Returns: undefined
      }
      initialize_or_reset_yearly_allocation: {
        Args:
          | {
              p_monthly_credits: number
              p_related_order_id?: string
              p_subscription_start_date: string
              p_total_months: number
              p_user_id: string
            }
          | {
              p_monthly_credits: number
              p_subscription_start_date: string
              p_total_months: number
              p_user_id: string
            }
        Returns: undefined
      }
      revoke_credits: {
        Args: {
          p_clear_monthly_details?: boolean
          p_clear_yearly_details?: boolean
          p_revoke_one_time: number
          p_revoke_subscription: number
          p_user_id: string
        }
        Returns: boolean
      }
      revoke_credits_and_log: {
        Args: {
          p_clear_monthly_details?: boolean
          p_clear_yearly_details?: boolean
          p_log_type: string
          p_notes: string
          p_related_order_id?: string
          p_revoke_one_time: number
          p_revoke_subscription: number
          p_user_id: string
        }
        Returns: undefined
      }
      update_my_profile: {
        Args: {
          new_avatar_url: string
          new_full_name: string
          new_invite_code: string
        }
        Returns: undefined
      }
    }
    Enums: {
      job_share_conversion_status: "pending" | "rewarded" | "dismissed"
      job_status:
        | "starting"
        | "processing"
        | "succeeded"
        | "failed"
        | "canceled"
      post_status: "draft" | "published" | "archived"
      post_visibility: "public" | "logged_in" | "subscribers"
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
      job_share_conversion_status: ["pending", "rewarded", "dismissed"],
      job_status: ["starting", "processing", "succeeded", "failed", "canceled"],
      post_status: ["draft", "published", "archived"],
      post_visibility: ["public", "logged_in", "subscribers"],
    },
  },
} as const
