import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { MaintenanceRequest } from '../../lib/supabase'

interface MaintenanceRequestWithDetails extends MaintenanceRequest {
  room: {
    number: string
    type: string
  }
  profiles: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function MaintenanceRequests() {
  const [requests, setRequests] = useState<MaintenanceRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  })

  useEffect(() => {
    fetchMaintenanceRequests()
  }, [])

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          rooms!maintenance_requests_room_id_fkey(number, type),
          profiles!maintenance_requests_guest_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching maintenance requests:', error)
        throw error
      }

      if (!data) {
        setRequests([])
        return
      }

      // Transform the data to match our interface
      const transformedData = data.map(request => ({
        ...request,
        room: request.rooms,
        profiles: request.profiles
      }))

      setRequests(transformedData)

      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(req => req.status === 'pending').length,
        in_progress: data.filter(req => req.status === 'in_progress').length,
        completed: data.filter(req => req.status === 'completed').length,
        cancelled: data.filter(req => req.status === 'cancelled').length
      })
    } catch (error: any) {
      console.error('Error in fetchMaintenanceRequests:', error)
      setError(error.message || 'Failed to fetch maintenance requests')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: MaintenanceRequest['status']) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating maintenance request:', error)
        throw error
      }

      // Refresh the requests list
      await fetchMaintenanceRequests()
    } catch (error: any) {
      console.error('Error in handleUpdateStatus:', error)
      setError(error.message || 'Failed to update maintenance request status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Maintenance Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              {stats.total} total • {stats.pending} pending • {stats.in_progress} in progress • {stats.completed} completed • {stats.cancelled} cancelled
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-8 text-center py-12">
            <p className="text-gray-500 text-lg">No maintenance requests found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Maintenance requests will appear here when guests submit them.
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Guest</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Room</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Priority</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {request.profiles?.first_name} {request.profiles?.last_name}
                            <div className="text-xs text-gray-500">{request.profiles?.email}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            Room {request.room?.number}
                            <div className="text-xs text-gray-500">{request.room?.type}</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="font-medium text-gray-900">{request.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-2">{request.description}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(request.priority)}`}>
                              {request.priority}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <select
                              value={request.status}
                              onChange={(e) => handleUpdateStatus(request.id, e.target.value as MaintenanceRequest['status'])}
                              className="block w-32 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                              disabled={loading}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 