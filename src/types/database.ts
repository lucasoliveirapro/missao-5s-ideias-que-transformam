export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "admin" | "leader" | "viewer";
export type ZCardType = "Z2" | "Z3" | "Z4";

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: AppRole;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: AppRole;
          full_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      operators: {
        Row: {
          id: string;
          name: string;
          normalized_name: string | null;
          badge: string | null;
          shift: string | null;
          team: string | null;
          ute: string | null;
          photo_path: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          badge?: string | null;
          shift?: string | null;
          team?: string | null;
          ute?: string | null;
          photo_path?: string | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          badge?: string | null;
          shift?: string | null;
          team?: string | null;
          ute?: string | null;
          photo_path?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      operator_aliases: {
        Row: {
          id: string;
          operator_id: string;
          alias: string;
          normalized_alias: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          operator_id: string;
          alias: string;
        };
        Update: {
          alias?: string;
        };
        Relationships: [];
      };
      import_batches: {
        Row: {
          id: string;
          file_name: string;
          total_rows: number;
          valid_cards: number;
          ignored_rows: number;
          error_rows: number;
          z2_count: number;
          z3_count: number;
          z4_count: number;
          min_created_at: string | null;
          max_created_at: string | null;
          imported_by: string | null;
          status: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          total_rows?: number;
          valid_cards?: number;
          ignored_rows?: number;
          error_rows?: number;
          z2_count?: number;
          z3_count?: number;
          z4_count?: number;
          min_created_at?: string | null;
          max_created_at?: string | null;
          imported_by?: string | null;
          status?: string;
          metadata?: Json;
        };
        Update: {
          file_name?: string;
          total_rows?: number;
          valid_cards?: number;
          ignored_rows?: number;
          error_rows?: number;
          z2_count?: number;
          z3_count?: number;
          z4_count?: number;
          min_created_at?: string | null;
          max_created_at?: string | null;
          imported_by?: string | null;
          status?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      ss_cards: {
        Row: {
          id: string;
          ss_number: string;
          status: string | null;
          company: string | null;
          unit: string | null;
          location_1: string | null;
          location_2: string | null;
          location_3: string | null;
          location_4: string | null;
          line: string | null;
          operation: string | null;
          ute_mapped: string | null;
          asset: string | null;
          requester_name: string | null;
          requester_email: string | null;
          user_name: string | null;
          normalized_user_name: string | null;
          main_subject: string | null;
          secondary_subject: string | null;
          z_type: ZCardType | null;
          description: string | null;
          machine_stopped: boolean | null;
          safety_item: boolean | null;
          created_at_manusis: string | null;
          classification: string | null;
          safety: string | null;
          production: string | null;
          quality: string | null;
          environment: string | null;
          cost_center: string | null;
          work_center: string | null;
          has_wcm_tag: boolean | null;
          wcm_pillar: string | null;
          om_number: string | null;
          om_status: string | null;
          om_service_type: string | null;
          om_service_nature: string | null;
          om_opened_at: string | null;
          om_description: string | null;
          om_closed_at: string | null;
          is_closed_for_operator: boolean;
          raw_data: Json;
          import_batch_id: string | null;
          imported_by: string | null;
          updated_by: string | null;
          imported_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ss_cards"]["Row"]> & {
          ss_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["ss_cards"]["Row"]>;
        Relationships: [];
      };
      import_errors: {
        Row: {
          id: string;
          import_batch_id: string | null;
          row_number: number | null;
          error_code: string;
          error_message: string;
          raw_row: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_batch_id?: string | null;
          row_number?: number | null;
          error_code: string;
          error_message: string;
          raw_row?: Json | null;
        };
        Update: {
          import_batch_id?: string | null;
          row_number?: number | null;
          error_code?: string;
          error_message?: string;
          raw_row?: Json | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      v_ss_cards_enriched: {
        Row: Database["public"]["Tables"]["ss_cards"]["Row"] & {
          operator_id: string | null;
          operator_name: string | null;
          operator_badge: string | null;
          operator_shift: string | null;
          operator_team: string | null;
          operator_ute: string | null;
          operator_photo_path: string | null;
          has_registered_operator: boolean;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      z_card_type: ZCardType;
    };
    CompositeTypes: Record<string, never>;
  };
};
