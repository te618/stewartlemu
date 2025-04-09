import { createClient, User as SupabaseUser } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'guest'

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  national_id: string
  phone_number: string
  role: UserRole
  created_at: string
}

export interface Room {
  id: string
  number: string
  type: string
  price_per_night: number
  capacity: number
  description: string
  amenities: string[]
  status: 'available' | 'occupied' | 'maintenance'
  floor: number
  created_at: string
  updated_at: string
}

export interface Booking {
  id: number
  room_id: string
  guest_id: string
  check_in: string
  check_out: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  total_price: number
}

export interface MaintenanceRequest {
  id: number
  room_id: number
  guest_id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: 'appetizer' | 'main_course' | 'dessert' | 'beverage'
  image_url: string
  dietary_info: string[]
  available: boolean
  created_at: string
  updated_at: string
}

export interface FoodOrder {
  id: number
  guest_id: string
  room_id: string
  items: {
    item_id: number
    quantity: number
    special_instructions?: string
  }[]
  total_amount: number
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'completed' | 'failed'
  payment_method: 'card' | 'room_charge' | 'mobile_wallet'
  special_instructions?: string
  created_at: string
  updated_at: string
}

// Define the database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at'>
        Update: Partial<Omit<UserProfile, 'id'>>
      }
      rooms: {
        Row: Room
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Room, 'id'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at'>
        Update: Partial<Omit<Booking, 'id'>>
      }
      maintenance_requests: {
        Row: MaintenanceRequest
        Insert: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MaintenanceRequest, 'id'>>
      }
      menu_items: {
        Row: MenuItem
        Insert: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MenuItem, 'id'>>
      }
      food_orders: {
        Row: FoodOrder
        Insert: Omit<FoodOrder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FoodOrder, 'id'>>
      }
    }
  }
}

export interface User extends SupabaseUser {
  profile: UserProfile
}

const supabaseUrl = 'https://qcnwvzbmlqthhczfjzyw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbnd2emJtbHF0aGhjemZqenl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5Mjc3MDYsImV4cCI6MjA1OTUwMzcwNn0.EvpnxwbMDSd7beSPGoMBIBV-ipf1rd1bxx-3_DVFPeE'

// Create a single instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: localStorage,
        storageKey: 'hotel_auth_token',
        detectSessionInUrl: false
      }
    })

    // Set up auth state change listener
    supabaseInstance.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('hotel_auth_token')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          localStorage.setItem('hotel_auth_token', JSON.stringify(session))
        }
      }
    })
  }
  return supabaseInstance
})()

export async function signUp(email: string, password: string, profile: Omit<UserProfile, 'id' | 'created_at' | 'email'>) {
  try {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role
        }
      }
    })

    if (error) {
      if (error.message.includes('rate limit')) {
        throw new Error('Too many signup attempts. Please try again in a few minutes.')
      }
      throw error
    }

    if (!data.user) {
      throw new Error('Signup failed. Please try again.')
    }

    // Create the user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        email: email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        national_id: profile.national_id,
        phone_number: profile.phone_number,
        role: profile.role,
        created_at: new Date().toISOString()
      }])

    if (profileError) {
      // If profile creation fails, clean up the auth user
      await supabase.auth.signOut()
      throw new Error('Failed to create user profile. Please try again.')
    }

    // Return the role for redirection
    return {
      success: true,
      role: profile.role,
      email: email
    }
  } catch (error: any) {
    console.error('Signup error:', error)
    throw error
  }
}

export async function signIn(email: string, password: string) {
  try {
    // Clear any existing session data
    localStorage.removeItem('hotel_auth_token')

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password')
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Too many login attempts. Please try again in a few minutes.')
      }
      throw error
    }

    if (!data.user) {
      throw new Error('Login failed. Please try again.')
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw new Error('Failed to load user profile. Please try again.')
    }

    // Store the session
    if (data.session) {
      localStorage.setItem('hotel_auth_token', JSON.stringify(data.session))
    }

    // Return complete user data with properly typed profile
    return {
      ...data,
      user: {
        ...data.user,
        profile: profile as UserProfile
      } as User
    }
  } catch (error: any) {
    console.error('Login error:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Clear local storage
    localStorage.removeItem('hotel_auth_token')
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function getUser(): Promise<User | null> {
  try {
    // Check for existing session in localStorage
    const storedSession = localStorage.getItem('hotel_auth_token')
    if (!storedSession) {
      return null
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      localStorage.removeItem('hotel_auth_token')
      return null
    }

    if (!session) {
      localStorage.removeItem('hotel_auth_token')
      return null
    }

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting user:', error)
      localStorage.removeItem('hotel_auth_token')
      return null
    }

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw profileError
      }

      return {
        ...user,
        profile: profile as UserProfile
      } as User
    }
  } catch (error: any) {
    console.error('Error fetching user:', error)
    // If we get a 401 or invalid refresh token, clear the session
    if (error.status === 401 || error.message?.includes('Invalid Refresh Token')) {
      localStorage.removeItem('hotel_auth_token')
      await supabase.auth.signOut()
    }
    return null
  }

  return null
}

export async function addTestRooms() {
  const testRooms = [
    {
      number: '101',
      type: 'Standard',
      price_per_night: 100.00,
      capacity: 2,
      description: 'Cozy standard room with city view',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Fridge'],
      status: 'available',
      floor: 1
    },
    {
      number: '201',
      type: 'Deluxe',
      price_per_night: 150.00,
      capacity: 3,
      description: 'Spacious deluxe room with mountain view',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker'],
      status: 'available',
      floor: 2
    },
    {
      number: '301',
      type: 'Suite',
      price_per_night: 250.00,
      capacity: 4,
      description: 'Luxury suite with separate living area',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker', 'Jacuzzi'],
      status: 'available',
      floor: 3
    }
  ]

  const { error } = await supabase
    .from('rooms')
    .insert(testRooms)

  if (error) {
    console.error('Error adding test rooms:', error)
    throw error
  }

  return { success: true }
} 