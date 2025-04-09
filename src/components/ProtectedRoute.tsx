import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check for admin access if required
  if (requireAdmin && user.profile.role !== 'admin') {
    return <Navigate to="/guest/dashboard" replace />
  }

  // Check for guest trying to access admin routes
  if (!requireAdmin && user.profile.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
} 