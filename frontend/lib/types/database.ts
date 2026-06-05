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

export interface BusinessOpeningHours {
  monday:    { open: string; close: string } | null
  tuesday:   { open: string; close: string } | null
  wednesday: { open: string; close: string } | null
  thursday:  { open: string; close: string } | null
  friday:    { open: string; close: string } | null
  saturday:  { open: string; close: string } | null
  sunday:    { open: string; close: string } | null
}

export interface Business {
  id: string
  name: string
  logo_url: string | null
  stamps_goal: number
  reward: string | null
  address: string | null
  opening_hours: BusinessOpeningHours | null
  instagram: string | null
  image_url: string | null
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

// Dashboard aggregate types
export interface ClientWithCard {
  id: string
  email: string
  full_name: string | null
  stamps_count: number
  card_id: string
}

export interface StampWithStaff {
  id: string
  created_at: string
  staff_id: string
  staff_name: string | null
  staff_email: string
}

export interface BusinessWithOwner {
  id: string
  name: string
  stamps_goal: number
  created_at: string
  owner_id: string | null
  owner_name: string | null
  owner_email: string | null
}

export interface OwnerWithBusiness {
  id: string
  email: string
  full_name: string | null
  business_id: string | null
  business_name: string | null
  created_at: string
}

export interface AdminMetrics {
  totalBusinesses: number
  stampsToday: number
  totalCustomers: number
  businessMetrics: Array<{
    id: string
    name: string
    totalStamps: number
    stampsToday: number
  }>
}

export interface ContactMessage {
  id: string
  user_id: string | null
  email: string
  message: string
  created_at: string
}

export interface BusinessNews {
  id: string
  business_id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

export interface FavouriteBusiness {
  id: string
  customer_id: string
  business_id: string
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
      contact_messages: {
        Row: ContactMessage
        Insert: Omit<ContactMessage, 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      business_news: {
        Row: BusinessNews
        Insert: Omit<BusinessNews, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<BusinessNews, 'title' | 'description'>>
        Relationships: []
      }
      favourite_businesses: {
        Row: FavouriteBusiness
        Insert: { customer_id: string; business_id: string }
        Update: never
        Relationships: []
      }
    }
    Views: Record<never, never>
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
