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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled_for: Database["public"]["Enums"]["app_role"][]
          feature_key: string
          id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled_for?: Database["public"]["Enums"]["app_role"][]
          feature_key: string
          id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled_for?: Database["public"]["Enums"]["app_role"][]
          feature_key?: string
          id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          farmer_id: string
          name: string
          category: string
          price_per_unit: number
          unit: string
          stock: number
          description: string | null
          image_emoji: string | null
          cover_image_url: string | null
          video_url: string | null
          is_organic: boolean
          is_available: boolean
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          name: string
          category?: string
          price_per_unit: number
          unit?: string
          stock?: number
          description?: string | null
          image_emoji?: string | null
          cover_image_url?: string | null
          video_url?: string | null
          is_organic?: boolean
          is_available?: boolean
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          name?: string
          category?: string
          price_per_unit?: number
          unit?: string
          stock?: number
          description?: string | null
          image_emoji?: string | null
          cover_image_url?: string | null
          video_url?: string | null
          is_organic?: boolean
          is_available?: boolean
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          product_id: string
          buyer_id: string
          farmer_id: string
          quantity: number
          unit: string
          total_price: number
          delivery_fee: number
          status: string
          payment_method: string | null
          payment_ref: string | null
          payment_status: string
          merchant_request_id: string | null
          checkout_request_id: string | null
          payment_error: string | null
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          buyer_id: string
          farmer_id: string
          quantity: number
          unit: string
          total_price: number
          delivery_fee?: number
          status?: string
          payment_method?: string | null
          payment_ref?: string | null
          payment_status?: string
          merchant_request_id?: string | null
          checkout_request_id?: string | null
          payment_error?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          buyer_id?: string
          farmer_id?: string
          quantity?: number
          unit?: string
          total_price?: number
          delivery_fee?: number
          status?: string
          payment_method?: string | null
          payment_ref?: string | null
          payment_status?: string
          merchant_request_id?: string | null
          checkout_request_id?: string | null
          payment_error?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          participant_a: string
          participant_b: string
          last_message: string | null
          last_at: string
          unread_a: number
          unread_b: number
          created_at: string
        }
        Insert: {
          id?: string
          participant_a: string
          participant_b: string
          last_message?: string | null
          last_at?: string
          unread_a?: number
          unread_b?: number
          created_at?: string
        }
        Update: {
          id?: string
          participant_a?: string
          participant_b?: string
          last_message?: string | null
          last_at?: string
          unread_a?: number
          unread_b?: number
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      crop_events: {
        Row: {
          id: string
          farmer_id: string
          title: string
          crop: string
          type: string
          event_date: string
          notes: string | null
          done: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          title: string
          crop: string
          type: string
          event_date: string
          notes?: string | null
          done?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          title?: string
          crop?: string
          type?: string
          event_date?: string
          notes?: string | null
          done?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      id_verifications: {
        Row: {
          id: string
          user_id: string
          doc_url: string | null
          status: string
          reviewer_note: string | null
          submitted_at: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          doc_url?: string | null
          status?: string
          reviewer_note?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          doc_url?: string | null
          status?: string
          reviewer_note?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          county: string | null
          created_at: string
          farm_size: string | null
          full_name: string | null
          id: string
          main_crops: string[] | null
          phone: string | null
          photo_url: string | null
          payout_details_updated_at: string | null
          payout_method: string | null
          payout_mpesa_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          county?: string | null
          created_at?: string
          farm_size?: string | null
          full_name?: string | null
          id?: string
          main_crops?: string[] | null
          phone?: string | null
          photo_url?: string | null
          payout_details_updated_at?: string | null
          payout_method?: string | null
          payout_mpesa_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          county?: string | null
          created_at?: string
          farm_size?: string | null
          full_name?: string | null
          id?: string
          main_crops?: string[] | null
          phone?: string | null
          photo_url?: string | null
          payout_details_updated_at?: string | null
          payout_method?: string | null
          payout_mpesa_number?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "farmer_free" | "farmer_pro" | "buyer_enterprise"
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
      app_role: ["farmer_free", "farmer_pro", "buyer_enterprise"],
    },
  },
} as const
