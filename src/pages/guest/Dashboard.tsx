import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

interface DashboardStats {
  totalBookings: number
  activeBooking: boolean
  upcomingBookings: number
}

export default function GuestDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBooking: false,
    upcomingBookings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch actual stats from bookings table
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('guest_id', user?.id)

      if (error) throw error

      const now = new Date()
      const activeBooking = bookings?.some(
        booking => 
          new Date(booking.check_in) <= now && 
          new Date(booking.check_out) >= now &&
          booking.status === 'approved'
      ) || false

      const upcomingBookings = bookings?.filter(
        booking => new Date(booking.check_in) > now
      ).length || 0

      setStats({
        totalBookings: bookings?.length || 0,
        activeBooking,
        upcomingBookings
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.profile.first_name}!</h1>
      <p className="mt-2 text-sm text-gray-600">Manage your bookings and explore our hotel services.</p>

      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Book a Room */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="inline-flex p-3 bg-blue-50 text-blue-700 rounded-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Book a Room</h3>
                <p className="mt-1 text-sm text-gray-500">Browse available rooms and make a new reservation.</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/guest/booking"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Book Now
                <svg className="ml-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>

          {/* My Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="inline-flex p-3 bg-green-50 text-green-700 rounded-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">My Bookings</h3>
                <p className="mt-1 text-sm text-gray-500">View and manage your current and upcoming stays.</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/guest/booking"
                className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-500"
              >
                View Bookings
                <svg className="ml-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>

          {/* At a Glance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="inline-flex p-3 bg-purple-50 text-purple-700 rounded-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">At a Glance</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-500">Total Bookings: {stats.totalBookings}</p>
                  <p className="text-sm text-gray-500">Active Booking: {stats.activeBooking ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-500">Upcoming Bookings: {stats.upcomingBookings}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hotel Announcements */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Hotel Announcements</h2>
        <div className="mt-4 bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-sm font-medium text-gray-900">Special Offer!</h3>
              <p className="mt-1 text-sm text-gray-600">Book a deluxe room for 3 nights and get 20% off.</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-sm font-medium text-gray-900">New Service Available</h3>
              <p className="mt-1 text-sm text-gray-600">Try our new spa services, now open daily from 9 AM to 9 PM.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 