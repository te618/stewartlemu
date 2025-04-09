import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase, UserProfile, Room } from '../../lib/supabase'

interface DashboardStats {
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  totalGuests: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    totalGuests: 0
  })

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch rooms statistics
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('status')

      if (roomsError) throw roomsError

      const roomStats = {
        total: rooms?.length || 0,
        available: rooms?.filter(room => room.status === 'available').length || 0,
        occupied: rooms?.filter(room => room.status === 'occupied').length || 0
      }

      // Fetch total guests
      const { count: guestsCount, error: guestsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'guest')

      if (guestsError) throw guestsError

      setStats({
        totalRooms: roomStats.total,
        availableRooms: roomStats.available,
        occupiedRooms: roomStats.occupied,
        totalGuests: guestsCount || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.profile.first_name}! View your hotel statistics below.</p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Stats Cards */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-md bg-indigo-500 flex items-center justify-center">
                    <span className="text-white text-xl">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalRooms}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-md bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xl">🏨</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Available Rooms</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.availableRooms}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-md bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xl">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Guests</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalGuests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Sections */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h2>
            <div className="text-gray-500">
              No recent bookings
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-gray-500">
              No recent activity
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 