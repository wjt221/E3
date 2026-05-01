// Auto-generated Supabase type stubs — replace with output of `supabase gen types typescript`
// keeping this minimal so TypeScript compiles before you run the generator

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      companies: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          industry: string | null;
          stage: string | null;
          website: string | null;
          description: string | null;
          founded_year: number | null;
          employee_count: number | null;
          revenue_range: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      user_profiles: {
        Row: {
          id: string;
          org_id: string;
          company_id: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
      user_company_access: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          access_level: string;
          granted_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_company_access"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["user_company_access"]["Insert"]>;
      };
      source_documents: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          type: string;
          file_path: string | null;
          url: string | null;
          content_text: string | null;
          chunk_count: number;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["source_documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["source_documents"]["Insert"]>;
      };
      document_chunks: {
        Row: {
          id: string;
          company_id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          embedding: number[] | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["document_chunks"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["document_chunks"]["Insert"]>;
      };
      conversations: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          title: string | null;
          mode: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["conversations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          company_id: string;
          role: string;
          content: string;
          sources: Json;
          tool_calls: Json | null;
          mode: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      artifacts: {
        Row: {
          id: string;
          company_id: string;
          type: string;
          title: string;
          content: Json;
          version: number;
          created_by: string;
          source_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["artifacts"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["artifacts"]["Insert"]>;
      };
      goals: {
        Row: {
          id: string;
          company_id: string;
          level: number;
          title: string;
          description: string | null;
          owner: string | null;
          success_metric: string | null;
          due_date: string | null;
          status: string;
          parent_goal_id: string | null;
          artifact_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["goals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
      };
      action_items: {
        Row: {
          id: string;
          company_id: string;
          goal_id: string | null;
          title: string;
          owner: string | null;
          due_date: string | null;
          status: string;
          priority: string;
          notes: string | null;
          source_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["action_items"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["action_items"]["Insert"]>;
      };
      risks: {
        Row: {
          id: string;
          company_id: string;
          category: string;
          description: string;
          likelihood: string;
          impact: string;
          owner: string | null;
          mitigation: string | null;
          status: string;
          artifact_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["risks"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["risks"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          org_id: string;
          company_id: string | null;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at">;
        Update: never;
      };
    };
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_company_id: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          metadata: Json;
          similarity: number;
        }[];
      };
      search_document_chunks_fts: {
        Args: {
          query_text: string;
          match_company_id: string;
          match_count?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          metadata: Json;
          rank: number;
        }[];
      };
      get_accessible_company_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
  };
}
