import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, getUser, signIn, signOut } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const user = await getUser()
      setUser(user)
      
      // If user exists, redirect based on role
      if (user) {
        if (user.profile.role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/guest/dashboard')
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error)
      setError('Failed to check authentication status')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn(email: string, password: string) {
    try {
      setLoading(true)
      setError(null)
      const { user: authUser } = await signIn(email, password)
      setUser(authUser)

      // Redirect based on user role
      if (authUser.profile.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/guest/dashboard')
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      setLoading(true)
      setError(null)
      await signOut()
      setUser(null)
      navigate('/login', { replace: true })
    } catch (error: any) {
      console.error('Sign out error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 