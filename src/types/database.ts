export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          onboarding_completed: boolean;
          beginner_focus: boolean;
          sleep_focus: boolean;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          onboarding_completed?: boolean;
          beginner_focus?: boolean;
          sleep_focus?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          onboarding_completed?: boolean;
          beginner_focus?: boolean;
          sleep_focus?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
        };
        Relationships: [];
      };
      sleep_sessions: {
        Row: {
          id: string;
          user_id: string;
          date_key: string;
          date_label: string;
          focus: string;
          focus_label: string;
          sound: string;
          sound_label: string;
          length_minutes: number;
          speech_enabled: boolean;
          started_at: string | null;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date_key: string;
          date_label: string;
          focus: string;
          focus_label: string;
          sound: string;
          sound_label: string;
          length_minutes: number;
          speech_enabled?: boolean;
          started_at?: string | null;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date_key?: string;
          date_label?: string;
          focus?: string;
          focus_label?: string;
          sound?: string;
          sound_label?: string;
          length_minutes?: number;
          speech_enabled?: boolean;
          started_at?: string | null;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
