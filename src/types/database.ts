export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          plan: "free" | "pro" | "enterprise";
          credits: number;
          enabled_skills: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "enterprise";
          credits?: number;
          enabled_skills?: string[];
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "enterprise";
          credits?: number;
          enabled_skills?: string[];
        };
      };
      skills: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_name: string;
          category: "core" | "analysis" | "integration";
          is_premium: boolean;
          required_plan: "free" | "pro" | "enterprise";
          tools: string[];
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon_name: string;
          category: "core" | "analysis" | "integration";
          is_premium?: boolean;
          required_plan?: "free" | "pro" | "enterprise";
          tools?: string[];
          sort_order?: number;
        };
        Update: {
          name?: string;
          description?: string;
          icon_name?: string;
          category?: "core" | "analysis" | "integration";
          is_premium?: boolean;
          required_plan?: "free" | "pro" | "enterprise";
          tools?: string[];
          sort_order?: number;
        };
      };
      user_api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: "claude" | "openai" | "gemini" | "together";
          encrypted_key: string;
          model_preference: string | null;
          provider_config: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "claude" | "openai" | "gemini" | "together";
          encrypted_key: string;
          model_preference?: string | null;
          provider_config?: Record<string, unknown>;
        };
        Update: {
          provider?: "claude" | "openai" | "gemini" | "together";
          encrypted_key?: string;
          model_preference?: string | null;
          provider_config?: Record<string, unknown>;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          icon: string;
          type: "intelligence" | "website" | "research";
          is_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          icon?: string;
          type?: "intelligence" | "website" | "research";
          is_complete?: boolean;
        };
        Update: {
          title?: string;
          icon?: string;
          type?: "intelligence" | "website" | "research";
          is_complete?: boolean;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          has_report: boolean;
          report_title: string | null;
          report_summary: string | null;
          table_data: { headers: string[]; rows: string[][] } | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          has_report?: boolean;
          report_title?: string | null;
          report_summary?: string | null;
          table_data?: { headers: string[]; rows: string[][] } | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          content?: string;
          has_report?: boolean;
          report_title?: string | null;
          report_summary?: string | null;
          table_data?: { headers: string[]; rows: string[][] } | null;
          metadata?: Record<string, unknown>;
        };
      };
      steps: {
        Row: {
          id: string;
          conversation_id: string;
          step_number: number;
          label: string;
          detail: string | null;
          status: "pending" | "active" | "complete";
          icon_name: string;
          logs: { time: string; text: string; type: "info" | "action" | "result" }[];
          sub_tasks: { text: string; type?: "edit" | "image" | "terminal"; imageUrl?: string }[];
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          step_number: number;
          label: string;
          detail?: string | null;
          status?: "pending" | "active" | "complete";
          icon_name?: string;
          logs?: { time: string; text: string; type: "info" | "action" | "result" }[];
          sub_tasks?: { text: string; type?: "edit" | "image" | "terminal"; imageUrl?: string }[];
        };
        Update: {
          step_number?: number;
          label?: string;
          detail?: string | null;
          status?: "pending" | "active" | "complete";
          icon_name?: string;
          logs?: { time: string; text: string; type: "info" | "action" | "result" }[];
          sub_tasks?: { text: string; type?: "edit" | "image" | "terminal"; imageUrl?: string }[];
        };
      };
      user_connectors: {
        Row: {
          id: string;
          user_id: string;
          connector_id: string;
          status: string;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          scopes: string[] | null;
          account_info: Record<string, unknown>;
          config: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connector_id: string;
          status?: string;
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
          account_info?: Record<string, unknown>;
          config?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: {
          connector_id?: string;
          status?: string;
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
          account_info?: Record<string, unknown>;
          config?: Record<string, unknown>;
          updated_at?: string;
        };
      };
    };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: "free" | "pro" | "team" | "enterprise";
          status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "pro" | "team" | "enterprise";
          status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
        };
        Update: {
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "pro" | "team" | "enterprise";
          status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
      };
      usage_records: {
        Row: {
          id: string;
          user_id: string;
          type: "ai_message" | "voice_input" | "connector_call" | "plugin_action";
          model: string | null;
          tokens_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "ai_message" | "voice_input" | "connector_call" | "plugin_action";
          model?: string | null;
          tokens_used?: number;
        };
        Update: {
          type?: "ai_message" | "voice_input" | "connector_call" | "plugin_action";
          model?: string | null;
          tokens_used?: number;
        };
      };
      plan_limits: {
        Row: {
          plan: string;
          monthly_messages: number;
          monthly_voice_minutes: number;
          max_connectors: number;
          max_plugins: number;
          models_available: string[];
        };
        Insert: {
          plan: string;
          monthly_messages: number;
          monthly_voice_minutes: number;
          max_connectors: number;
          max_plugins: number;
          models_available: string[];
        };
        Update: {
          monthly_messages?: number;
          monthly_voice_minutes?: number;
          max_connectors?: number;
          max_plugins?: number;
          models_available?: string[];
        };
      };
    };
    Views: {
      monthly_usage: {
        Row: {
          user_id: string;
          messages_used: number;
          voice_minutes_used: number;
          total_tokens: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

