// ================================================================
// Domain types derived from the database schema.
// Keep these in sync with the SQL schema in /supabase/migrations/.
// ================================================================

export type UserRole = 'admin' | 'owner' | 'staff' | 'customer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  business_id: string | null
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  name: string
  logo_url: string | null
  stamps_goal: number
  created_at: string
  updated_at: string
}

export interface LoyaltyCard {
  id: string
  customer_id: string
  business_id: string
  stamps_count: number
  created_at: string
  updated_at: string
}

export interface StampLog {
  id: string
  card_id: string
  staff_id: string
  created_at: string
}

export interface Reward {
  id: string
  card_id: string
  reward_code: string
  is_redeemed: boolean
  redeemed_at: string | null
  staff_id_redeemer: string | null
  created_at: string
}

// RPC response from add_stamp()
export interface AddStampResult {
  success: boolean
  card_id: string
  stamps_count: number
  stamps_goal: number
  reward_available: boolean
}

// Supabase Database type (for typed client).
// Must include Views, Enums, CompositeTypes, and Relationships so that
// supabase-js v2 generic constraints resolve correctly.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      businesses: {
        Row: Business
        Insert: Omit<Business, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Business, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      loyalty_cards: {
        Row: LoyaltyCard
        Insert: Omit<LoyaltyCard, 'id' | 'stamps_count' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LoyaltyCard, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      stamps_log: {
        Row: StampLog
        Insert: Omit<StampLog, 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      rewards: {
        Row: Reward
        Insert: Omit<Reward, 'id' | 'reward_code' | 'created_at'>
        Update: Partial<Pick<Reward, 'is_redeemed' | 'redeemed_at' | 'staff_id_redeemer'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      add_stamp: {
        Args: { p_customer_id: string; p_business_id: string }
        Returns: AddStampResult
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
      get_my_business_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
    }
    CompositeTypes: Record<string, never>
  }
}
