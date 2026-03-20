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
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "enterprise";
          credits?: number;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "enterprise";
          credits?: number;
        };
      };
      user_api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: "claude" | "openai";
          encrypted_key: string;
          model_preference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "claude" | "openai";
          encrypted_key: string;
          model_preference?: string | null;
        };
        Update: {
          provider?: "claude" | "openai";
          encrypted_key?: string;
          model_preference?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
