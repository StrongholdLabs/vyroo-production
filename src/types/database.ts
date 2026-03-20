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
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
