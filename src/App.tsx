import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLayout from './pages/admin/AdminLayout'
import GuestLayout from './pages/guest/GuestLayout'
import Dashboard from './pages/admin/Dashboard'
import GuestDashboard from './pages/guest/Dashboard'
import Profile from './pages/guest/Profile'
import BookRoom from './pages/guest/BookRoom'
import Bookings from './pages/guest/Bookings'
import MyRoom from './pages/guest/MyRoom'
import MaintenanceRequest from './pages/guest/MaintenanceRequest'
import FoodOrder from './pages/guest/FoodOrder'
import Orders from './pages/guest/Orders'
import Rooms from './pages/admin/Rooms'
import Guests from './pages/admin/Guests'
import BookRequests from './pages/admin/BookRequests'
import MaintenanceRequests from './pages/admin/MaintenanceRequests'
import Analytics from './pages/admin/Analytics'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={user ? <Navigate to={`/${user.profile.role}/dashboard`} replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to={`/${user.profile.role}/dashboard`} replace /> : <Signup />}
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={user?.profile.role === 'admin' ? <AdminLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="guests" element={<Guests />} />
        <Route path="book-requests" element={<BookRequests />} />
        <Route path="maintenance" element={<MaintenanceRequests />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Guest routes */}
      <Route
        path="/guest"
        element={user?.profile.role === 'guest' ? <GuestLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<GuestDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="book-room" element={<BookRoom />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="my-room" element={<MyRoom />} />
        <Route path="maintenance" element={<MaintenanceRequest />} />
        <Route path="food-order" element={<FoodOrder />} />
        <Route path="orders" element={<Orders />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
} 