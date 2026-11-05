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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      clinic_assistant_settings: {
        Row: {
          agent_name: string
          clinic_facts: string
          clinic_id: string
          followup_text: string
          send_hour: number
          timezone: string
          updated_at: string
        }
        Insert: {
          agent_name?: string
          clinic_facts?: string
          clinic_id: string
          followup_text?: string
          send_hour?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          clinic_facts?: string
          clinic_id?: string
          followup_text?: string
          send_hour?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_assistant_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_conversations: {
        Row: {
          clinic_id: string
          contact_name: string
          handoff_reason: string | null
          id: string
          last_inbound_at: string | null
          mode: string
          patient_id: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          contact_name: string
          handoff_reason?: string | null
          id?: string
          last_inbound_at?: string | null
          mode?: string
          patient_id?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          contact_name?: string
          handoff_reason?: string | null
          id?: string
          last_inbound_at?: string | null
          mode?: string
          patient_id?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_handoffs: {
        Row: {
          actor_id: string
          clinic_id: string
          conversation_id: string
          created_at: string
          id: string
        }
        Insert: {
          actor_id: string
          clinic_id: string
          conversation_id: string
          created_at?: string
          id?: string
        }
        Update: {
          actor_id?: string
          clinic_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_handoffs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_handoffs_conversation_id_clinic_id_fkey"
            columns: ["conversation_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_conversations"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      clinic_invites: {
        Row: {
          clinic_id: string
          created_at: string
          email: string
          id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_invites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string
          email: string | null
          role: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email?: string | null
          role?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_messages: {
        Row: {
          body: string
          clinic_id: string
          conversation_id: string
          created_at: string
          delivery_state: string
          direction: string
          id: string
          provider_message_id: string | null
        }
        Insert: {
          body: string
          clinic_id: string
          conversation_id: string
          created_at?: string
          delivery_state?: string
          direction: string
          id?: string
          provider_message_id?: string | null
        }
        Update: {
          body?: string
          clinic_id?: string
          conversation_id?: string
          created_at?: string
          delivery_state?: string
          direction?: string
          id?: string
          provider_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_messages_conversation_id_clinic_id_fkey"
            columns: ["conversation_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_conversations"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          id: string
          message_template: string
          name: string
          owner_id: string
          plan_status: string
          trial_ends_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_template?: string
          name: string
          owner_id: string
          plan_status?: string
          trial_ends_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_template?: string
          name?: string
          owner_id?: string
          plan_status?: string
          trial_ends_at?: string
        }
        Relationships: []
      }
      contact_events: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          kind: string
          patient_id: string | null
          patient_name: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          patient_id?: string | null
          patient_name?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          patient_id?: string | null
          patient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          avg_value: number | null
          clinic_id: string
          consent: boolean
          created_at: string
          id: string
          interval_months: number
          last_visit: string
          name: string
          opted_out: boolean
          phone: string
          service: string
        }
        Insert: {
          avg_value?: number | null
          clinic_id: string
          consent?: boolean
          created_at?: string
          id?: string
          interval_months?: number
          last_visit?: string
          name: string
          opted_out?: boolean
          phone: string
          service?: string
        }
        Update: {
          avg_value?: number | null
          clinic_id?: string
          consent?: boolean
          created_at?: string
          id?: string
          interval_months?: number
          last_visit?: string
          name?: string
          opted_out?: boolean
          phone?: string
          service?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      accept_invites: { Args: never; Returns: number }
      anonymize_patient: { Args: { _patient: string }; Returns: undefined }
      log_export: { Args: { _clinic: string; _scope: string }; Returns: undefined }
      purge_old_records: { Args: { _clinic: string; _months: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member: { Args: { _clinic: string }; Returns: boolean }
      is_owner: { Args: { _clinic: string }; Returns: boolean }
      take_over_conversation: {
        Args: { _conversation: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
