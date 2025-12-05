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
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
          work_unit_id: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title: string
          updated_at?: string
          work_unit_id?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          work_unit_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_messages: {
        Row: {
          attachments: Json | null
          consultation_id: string
          content: string
          created_at: string
          id: string
          is_from_admin_pusat: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          attachments?: Json | null
          consultation_id: string
          content: string
          created_at?: string
          id?: string
          is_from_admin_pusat?: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          attachments?: Json | null
          consultation_id?: string
          content?: string
          created_at?: string
          id?: string
          is_from_admin_pusat?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "consultation_messages_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          category: Database["public"]["Enums"]["consultation_category"] | null
          closed_at: string | null
          created_at: string
          current_handler_id: string | null
          description: string
          id: string
          is_escalated: boolean
          priority: Database["public"]["Enums"]["consultation_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["consultation_status"]
          subject: string
          updated_at: string
          user_id: string
          work_unit_id: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["consultation_category"] | null
          closed_at?: string | null
          created_at?: string
          current_handler_id?: string | null
          description: string
          id?: string
          is_escalated?: boolean
          priority?: Database["public"]["Enums"]["consultation_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          subject: string
          updated_at?: string
          user_id: string
          work_unit_id: number
        }
        Update: {
          category?: Database["public"]["Enums"]["consultation_category"] | null
          closed_at?: string | null
          created_at?: string
          current_handler_id?: string | null
          description?: string
          id?: string
          is_escalated?: boolean
          priority?: Database["public"]["Enums"]["consultation_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          subject?: string
          updated_at?: string
          user_id?: string
          work_unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "consultations_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_ratings: {
        Row: {
          created_at: string
          criteria_totals: Json
          detailed_ratings: Json
          id: string
          max_possible_points: number
          rated_employee_id: string
          rater_id: string
          rating_period: string
          reason: string
          total_points: number
        }
        Insert: {
          created_at?: string
          criteria_totals?: Json
          detailed_ratings?: Json
          id?: string
          max_possible_points?: number
          rated_employee_id: string
          rater_id: string
          rating_period: string
          reason: string
          total_points?: number
        }
        Update: {
          created_at?: string
          criteria_totals?: Json
          detailed_ratings?: Json
          id?: string
          max_possible_points?: number
          rated_employee_id?: string
          rater_id?: string
          rating_period?: string
          reason?: string
          total_points?: number
        }
        Relationships: []
      }
      job_formations: {
        Row: {
          created_at: string
          description: string | null
          filled: number
          id: string
          position_name: string
          quota: number
          updated_at: string
          work_unit_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          filled?: number
          id?: string
          position_name: string
          quota?: number
          updated_at?: string
          work_unit_id: number
        }
        Update: {
          created_at?: string
          description?: string | null
          filled?: number
          id?: string
          position_name?: string
          quota?: number
          updated_at?: string
          work_unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_formations_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_deferrals: {
        Row: {
          approval_document: string | null
          created_at: string
          created_by: string | null
          days_deferred: number
          deferral_year: number
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_document?: string | null
          created_at?: string
          created_by?: string | null
          days_deferred?: number
          deferral_year: number
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_document?: string | null
          created_at?: string
          created_by?: string | null
          days_deferred?: number
          deferral_year?: number
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leave_details: {
        Row: {
          created_at: string
          emergency_contact: string | null
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string
          service_id: string
          start_date: string
          substitute_employee: string | null
          total_days: number
        }
        Insert: {
          created_at?: string
          emergency_contact?: string | null
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string
          service_id: string
          start_date: string
          substitute_employee?: string | null
          total_days: number
        }
        Update: {
          created_at?: string
          emergency_contact?: string | null
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string
          service_id?: string
          start_date?: string
          substitute_employee?: string | null
          total_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_details_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agama: string | null
          alamat: string | null
          alamat_lengkap: string | null
          avatar_url: string | null
          created_at: string
          documents: Json | null
          email: string | null
          email_alternatif: string | null
          id: string
          jabatan: string | null
          jenis_kelamin: string | null
          kriteria_asn: string | null
          masa_kerja_bulan: number | null
          masa_kerja_tahun: number | null
          name: string
          nip: string
          nomor_hp: string | null
          nomor_wa: string | null
          pangkat_golongan: string | null
          pendidikan_terakhir: string | null
          phone: string | null
          retirement_date: string | null
          retirement_reminder_sent_at: string | null
          riwayat_jabatan: Json | null
          riwayat_mutasi: Json | null
          role: Database["public"]["Enums"]["user_role"]
          status_perkawinan: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          tmt_pensiun: string | null
          tmt_pns: string | null
          updated_at: string
          work_unit_id: number | null
        }
        Insert: {
          agama?: string | null
          alamat?: string | null
          alamat_lengkap?: string | null
          avatar_url?: string | null
          created_at?: string
          documents?: Json | null
          email?: string | null
          email_alternatif?: string | null
          id: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          kriteria_asn?: string | null
          masa_kerja_bulan?: number | null
          masa_kerja_tahun?: number | null
          name: string
          nip: string
          nomor_hp?: string | null
          nomor_wa?: string | null
          pangkat_golongan?: string | null
          pendidikan_terakhir?: string | null
          phone?: string | null
          retirement_date?: string | null
          retirement_reminder_sent_at?: string | null
          riwayat_jabatan?: Json | null
          riwayat_mutasi?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          status_perkawinan?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          tmt_pensiun?: string | null
          tmt_pns?: string | null
          updated_at?: string
          work_unit_id?: number | null
        }
        Update: {
          agama?: string | null
          alamat?: string | null
          alamat_lengkap?: string | null
          avatar_url?: string | null
          created_at?: string
          documents?: Json | null
          email?: string | null
          email_alternatif?: string | null
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          kriteria_asn?: string | null
          masa_kerja_bulan?: number | null
          masa_kerja_tahun?: number | null
          name?: string
          nip?: string
          nomor_hp?: string | null
          nomor_wa?: string | null
          pangkat_golongan?: string | null
          pendidikan_terakhir?: string | null
          phone?: string | null
          retirement_date?: string | null
          retirement_reminder_sent_at?: string | null
          riwayat_jabatan?: Json | null
          riwayat_mutasi?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          status_perkawinan?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          tmt_pensiun?: string | null
          tmt_pns?: string | null
          updated_at?: string
          work_unit_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      retirement_reminders: {
        Row: {
          created_at: string
          id: string
          message: string | null
          reminder_type: string
          sender_id: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          reminder_type: string
          sender_id: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          reminder_type?: string
          sender_id?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      service_history: {
        Row: {
          action: string
          actor_id: string
          actor_role: Database["public"]["Enums"]["user_role"]
          id: string
          notes: string | null
          service_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          timestamp: string
        }
        Insert: {
          action: string
          actor_id: string
          actor_role: Database["public"]["Enums"]["user_role"]
          id?: string
          notes?: string | null
          service_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          timestamp?: string
        }
        Update: {
          action?: string
          actor_id?: string
          actor_role?: Database["public"]["Enums"]["user_role"]
          id?: string
          notes?: string | null
          service_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          approved_at: string | null
          created_at: string
          current_reviewer_id: string | null
          description: string | null
          documents: Json | null
          id: string
          notes: Json | null
          rejected_at: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["service_status"]
          title: string
          updated_at: string
          user_id: string
          work_unit_id: number
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          current_reviewer_id?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          notes?: Json | null
          rejected_at?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["service_status"]
          title: string
          updated_at?: string
          user_id: string
          work_unit_id: number
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          current_reviewer_id?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          notes?: Json | null
          rejected_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["service_status"]
          title?: string
          updated_at?: string
          user_id?: string
          work_unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_units: {
        Row: {
          admin_unit_id: string | null
          code: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          admin_unit_id?: string | null
          code: string
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          admin_unit_id?: string | null
          code?: string
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_user_work_unit: { Args: never; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin_pusat: { Args: never; Returns: boolean }
    }
    Enums: {
      consultation_category:
        | "kepegawaian"
        | "administrasi"
        | "teknis"
        | "lainnya"
      consultation_priority: "low" | "medium" | "high"
      consultation_status:
        | "submitted"
        | "under_review"
        | "responded"
        | "escalated"
        | "escalated_responded"
        | "follow_up_requested"
        | "resolved"
        | "closed"
      leave_type:
        | "tahunan"
        | "sakit"
        | "melahirkan"
        | "alasan_penting"
        | "besar"
        | "bersama"
        | "di_luar_tanggungan_negara"
      message_type: "question" | "answer" | "follow_up"
      service_status:
        | "draft"
        | "submitted"
        | "under_review_unit"
        | "returned_to_user"
        | "approved_by_unit"
        | "under_review_central"
        | "returned_to_unit"
        | "approved_final"
        | "rejected"
        | "resubmitted"
      service_type: "kenaikan_pangkat" | "mutasi" | "pensiun" | "cuti"
      user_role: "user_unit" | "admin_unit" | "admin_pusat"
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
      consultation_category: [
        "kepegawaian",
        "administrasi",
        "teknis",
        "lainnya",
      ],
      consultation_priority: ["low", "medium", "high"],
      consultation_status: [
        "submitted",
        "under_review",
        "responded",
        "escalated",
        "escalated_responded",
        "follow_up_requested",
        "resolved",
        "closed",
      ],
      leave_type: [
        "tahunan",
        "sakit",
        "melahirkan",
        "alasan_penting",
        "besar",
        "bersama",
        "di_luar_tanggungan_negara",
      ],
      message_type: ["question", "answer", "follow_up"],
      service_status: [
        "draft",
        "submitted",
        "under_review_unit",
        "returned_to_user",
        "approved_by_unit",
        "under_review_central",
        "returned_to_unit",
        "approved_final",
        "rejected",
        "resubmitted",
      ],
      service_type: ["kenaikan_pangkat", "mutasi", "pensiun", "cuti"],
      user_role: ["user_unit", "admin_unit", "admin_pusat"],
    },
  },
} as const
