import { useState, useEffect } from 'react'
import { supabase, addTestRooms } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

interface Room {
  number: string;
  type: string;
}

interface ActiveBooking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  room: Room;
}

interface BookingResponse {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  room_id: string;
  rooms: Room;
}

export default function BookRoom() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [numberOfGuests, setNumberOfGuests] = useState(1)
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    checkActiveBooking()
  }, [])

  const checkActiveBooking = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in_date,
          check_out_date,
          status,
          room_id,
          rooms:rooms!bookings_room_id_fkey (
            number,
            type
          )
        `)
        .eq('guest_id', user?.id)
        .eq('status', 'approved')
        .gte('check_out_date', new Date().toISOString().split('T')[0])
        .order('check_in_date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
        throw error
      }

      if (data) {
        console.log('Booking data:', data) // Debug log
        const bookingData = data as BookingResponse
        // Transform the data to match the ActiveBooking interface
        const booking: ActiveBooking = {
          id: bookingData.id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date,
          status: bookingData.status,
          room: bookingData.rooms
        }
        setActiveBooking(booking)
      } else {
        // Only fetch available rooms if there's no active booking
        await fetchAvailableRooms()
      }
    } catch (error) {
      console.error('Error checking active booking:', error)
      setError('Failed to check current booking status')
      // If there's an error, fetch available rooms as fallback
      await fetchAvailableRooms()
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableRooms = async () => {
    try {
      setError('')

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available')
        .order('floor')
        .order('number')

      if (error) throw error

      console.log('Fetched rooms:', data)
      setRooms(data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setError('Failed to load available rooms. Please try again later.')
    }
  }

  const calculateTotalPrice = (pricePerNight: number, checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return pricePerNight * nights
  }

  const handleBookRoom = async (room: Room) => {
    try {
      if (!checkInDate || !checkOutDate) {
        setError('Please select check-in and check-out dates')
        return
      }

      if (new Date(checkInDate) >= new Date(checkOutDate)) {
        setError('Check-out date must be after check-in date')
        return
      }

      if (numberOfGuests > room.capacity) {
        setError(`This room's capacity is ${room.capacity} guests`)
        return
      }

      setLoading(true)
      setError('')

      // Call the book_room stored procedure
      const { error: bookingError } = await supabase.rpc('book_room', {
        p_room_id: room.id,
        p_guest_id: user?.id,
        p_check_in_date: checkInDate,
        p_check_out_date: checkOutDate,
        p_number_of_guests: numberOfGuests,
        p_total_price: calculateTotalPrice(room.price_per_night, checkInDate, checkOutDate)
      })

      if (bookingError) throw bookingError

      // Refresh the room list
      await fetchAvailableRooms()
      
      // Show success message and clear form
      setError('Booking successful! Check your bookings page for details.')
      setCheckInDate('')
      setCheckOutDate('')
      setNumberOfGuests(1)
    } catch (error: any) {
      console.error('Error booking room:', error)
      setError(error.message || 'Failed to book the room. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestRooms = async () => {
    try {
      setLoading(true)
      setError('')
      await addTestRooms()
      await fetchAvailableRooms()
    } catch (error) {
      console.error('Error adding test rooms:', error)
      setError('Failed to add test rooms. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (activeBooking) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">You Already Have an Active Booking</h2>
            <div className="mb-4">
              <p className="text-gray-600">
                You currently have an active booking for Room {activeBooking.room.number} ({activeBooking.room.type})
              </p>
              <p className="text-gray-600 mt-2">
                Check-in: {new Date(activeBooking.check_in_date).toLocaleDateString()}
                <br />
                Check-out: {new Date(activeBooking.check_out_date).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/guest/my-room"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                View My Room
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Available Rooms</h1>
          <div className="space-x-4">
            <button
              onClick={handleAddTestRooms}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Test Rooms
            </button>
            <button
              onClick={() => fetchAvailableRooms()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Booking Form */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="check-in" className="block text-sm font-medium text-gray-700">
                Check-in Date
              </label>
              <input
                type="date"
                id="check-in"
                min={new Date().toISOString().split('T')[0]}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="check-out" className="block text-sm font-medium text-gray-700">
                Check-out Date
              </label>
              <input
                type="date"
                id="check-out"
                min={checkInDate || new Date().toISOString().split('T')[0]}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
                Number of Guests
              </label>
              <input
                type="number"
                id="guests"
                min="1"
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Room {room.number}</h3>
                    <p className="mt-1 text-sm text-gray-500">{room.type}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">{room.description}</p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Floor</span>
                    <span className="font-medium text-gray-900">{room.floor}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Capacity</span>
                    <span className="font-medium text-gray-900">{room.capacity} persons</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Price per night</span>
                    <span className="font-medium text-gray-900">${room.price_per_night}</span>
                  </div>
                  {checkInDate && checkOutDate && (
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-500">Total Price</span>
                      <span className="font-medium text-gray-900">
                        ${calculateTotalPrice(room.price_per_night, checkInDate, checkOutDate)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Amenities</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {room.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6">
                <button
                  onClick={() => handleBookRoom(room)}
                  disabled={!checkInDate || !checkOutDate || loading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Book Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && !loading && (
          <div className="mt-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">No rooms available</h3>
            <p className="mt-1 text-sm text-gray-500">Please check back later for availability.</p>
          </div>
        )}
      </div>
    </div>
  )
} 