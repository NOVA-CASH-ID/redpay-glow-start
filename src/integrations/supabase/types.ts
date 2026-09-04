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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          image_url: string | null
          sort_order: number
          subtitle: string
          title: string
        }
        Insert: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string
          title: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string
          title?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          purpose: string
          reference: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          purpose?: string
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          purpose?: string
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: string
          balance: number
          ban_reason: string | null
          banned_at: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_claim_at: string | null
          last_name: string
          last_seen_at: string
          phone: string | null
          referral_code: string
          referral_count: number
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          balance?: number
          ban_reason?: string | null
          banned_at?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id: string
          last_claim_at?: string | null
          last_name?: string
          last_seen_at?: string
          phone?: string | null
          referral_code: string
          referral_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          balance?: number
          ban_reason?: string | null
          banned_at?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_claim_at?: string | null
          last_name?: string
          last_seen_at?: string
          phone?: string | null
          referral_code?: string
          referral_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          card_type: string
          created_at: string
          denomination: number
          discount: number
          id: string
          network: string
          phone: string | null
          plan_label: string
          quantity: number
          rpc_code: string | null
          status: string
          total: number
          user_id: string
        }
        Insert: {
          card_type: string
          created_at?: string
          denomination?: number
          discount?: number
          id?: string
          network: string
          phone?: string | null
          plan_label?: string
          quantity?: number
          rpc_code?: string | null
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          card_type?: string
          created_at?: string
          denomination?: number
          discount?: number
          id?: string
          network?: string
          phone?: string | null
          plan_label?: string
          quantity?: number
          rpc_code?: string | null
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number
          channel: string
          created_at: string
          id: string
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount?: number
          channel: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          channel?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      rpc_codes: {
        Row: {
          active: boolean
          benefit_type: string
          benefit_value: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          label: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          active?: boolean
          benefit_type?: string
          benefit_value?: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          active?: boolean
          benefit_type?: string
          benefit_value?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          id?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      withdrawals: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_name: string
          created_at: string
          id: string
          method: string
          reviewed_at: string | null
          reviewed_by: string | null
          rpc_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          id?: string
          method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rpc_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          id?: string
          method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rpc_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_settings: { Args: never; Returns: Json }
      admin_list_payments: {
        Args: { _search?: string; _status?: string }
        Returns: Json
      }
      admin_list_purchases: { Args: { _search?: string }; Returns: Json }
      admin_list_users: {
        Args: {
          _limit?: number
          _offset?: number
          _search?: string
          _status?: string
        }
        Returns: Json
      }
      admin_list_withdrawals: { Args: { _status?: string }; Returns: Json }
      admin_review_payment: {
        Args: { _note?: string; _payment_id: string; _status: string }
        Returns: Json
      }
      admin_review_withdrawal: {
        Args: { _note?: string; _status: string; _withdrawal_id: string }
        Returns: Json
      }
      admin_set_ban: {
        Args: { _banned: boolean; _reason?: string; _user_id: string }
        Returns: Json
      }
      admin_signed_proof_path: {
        Args: { _payment_id: string }
        Returns: string
      }
      admin_stats: { Args: never; Returns: Json }
      admin_update_setting: {
        Args: { _key: string; _value: Json }
        Returns: Json
      }
      admin_user_detail: { Args: { _user_id: string }; Returns: Json }
      check_rpc_code: { Args: { _code: string }; Returns: Json }
      check_withdrawal_code: { Args: { _code: string }; Returns: Json }
      claim_bonus: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_banned: { Args: { _user_id: string }; Returns: boolean }
      purchase_card: {
        Args: {
          _card_type: string
          _code: string
          _denomination: number
          _network: string
          _phone: string
          _plan_label: string
          _quantity: number
        }
        Returns: Json
      }
      request_withdrawal: {
        Args: {
          _account_name: string
          _account_number: string
          _amount: number
          _bank_name: string
          _code: string
        }
        Returns: Json
      }
      start_group_reward: { Args: { _channel: string }; Returns: Json }
      submit_payment: {
        Args: {
          _amount: number
          _purpose?: string
          _reference: string
          _screenshot_path: string
        }
        Returns: Json
      }
      touch_last_seen: { Args: never; Returns: Json }
      verify_group_reward: { Args: { _channel: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
