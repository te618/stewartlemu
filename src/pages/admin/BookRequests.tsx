import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Booking } from '../../lib/supabase'

interface BookRequestWithDetails extends Booking {
  room: {
    number: string
    type: string
    price_per_night: number
  }
  profiles: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function BookRequests() {
  const [requests, setRequests] = useState<BookRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBookRequests()
  }, [])

  async function fetchBookRequests() {
    try {
      console.log('Fetching booking requests...')
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(number, type, price_per_night),
          profiles(first_name, last_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched requests:', data)
      setRequests(data || [])
    } catch (error: any) {
      const errorMessage = error.message || 'Error fetching booking requests'
      console.error('Error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestAction(bookingId: number, status: 'approved' | 'rejected') {
    try {
      console.log(`Updating booking ${bookingId} to ${status}...`)
      setLoading(true)
      
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)

      if (bookingError) {
        console.error('Error updating booking:', bookingError)
        throw bookingError
      }

      // If approved, update room status to occupied
      if (status === 'approved') {
        const booking = requests.find(r => r.id === bookingId)
        if (booking) {
          console.log(`Updating room ${booking.room_id} to occupied...`)
          const { error: roomError } = await supabase
            .from('rooms')
            .update({ status: 'occupied' })
            .eq('id', booking.room_id)

          if (roomError) {
            console.error('Error updating room:', roomError)
            throw roomError
          }
        }
      }

      console.log('Action completed successfully, refreshing requests...')
      await fetchBookRequests()
    } catch (error: any) {
      const errorMessage = `Error ${status === 'approved' ? 'approving' : 'rejecting'} request: ${error.message}`
      console.error(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Booking Requests</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No pending booking requests
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.profiles?.first_name} {request.profiles?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{request.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Room {request.room?.number}</div>
                    <div className="text-sm text-gray-500">{request.room?.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.check_in).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.check_out).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${request.total_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleRequestAction(request.id, 'approved')}
                      className="text-green-600 hover:text-green-900 mr-4"
                      disabled={loading}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestAction(request.id, 'rejected')}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 