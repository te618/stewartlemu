import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface AnalyticsData {
  bookings: {
    total: number
    approved: number
    pending: number
    rejected: number
    revenue: number
    trendData: Array<{ date: string; count: number; revenue: number }>
  }
  foodOrders: {
    total: number
    revenue: number
    popularItems: Array<{ name: string; count: number }>
    trendData: Array<{ date: string; count: number; revenue: number }>
  }
  maintenance: {
    total: number
    pending: number
    completed: number
    avgResolutionTime: number
    byPriority: Array<{ priority: string; count: number }>
  }
  occupancyRate: number
  predictions: {
    nextMonthBookings: number
    nextMonthRevenue: number
    peakDays: string[]
    recommendedActions: string[]
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get date range
      const endDate = new Date()
      const startDate = new Date()
      if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7)
      } else if (timeRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1)
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1)
      }

      // Fetch bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, check_in, total_price')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (bookingsError) throw bookingsError

      // Fetch food orders data
      const { data: foodOrders, error: foodOrdersError } = await supabase
        .from('food_orders')
        .select('status, created_at, total_amount, items')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (foodOrdersError) throw foodOrdersError

      // Fetch maintenance requests data
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('status, priority, created_at, updated_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (maintenanceError) throw maintenanceError

      // Process data and generate insights
      const analyticsData: AnalyticsData = {
        bookings: processBookingsData(bookings || []),
        foodOrders: processFoodOrdersData(foodOrders || []),
        maintenance: processMaintenanceData(maintenance || []),
        occupancyRate: calculateOccupancyRate(bookings || []),
        predictions: generatePredictions(bookings || [], foodOrders || [])
      }

      setData(analyticsData)
    } catch (error: any) {
      console.error('Error fetching analytics data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const processBookingsData = (bookings: any[]): AnalyticsData['bookings'] => {
    const approved = bookings.filter(b => b.status === 'approved').length
    const pending = bookings.filter(b => b.status === 'pending').length
    const rejected = bookings.filter(b => b.status === 'rejected').length
    const revenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)

    // Generate trend data by grouping bookings by date
    const trendData = generateTrendData(bookings, 'check_in', 'total_price')

    return {
      total: bookings.length,
      approved,
      pending,
      rejected,
      revenue,
      trendData
    }
  }

  const processFoodOrdersData = (orders: any[]): AnalyticsData['foodOrders'] => {
    const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    // Calculate popular items
    const itemCounts = new Map<string, number>()
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const count = itemCounts.get(item.name) || 0
        itemCounts.set(item.name, count + item.quantity)
      })
    })

    const popularItems = Array.from(itemCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Generate trend data
    const trendData = generateTrendData(orders, 'created_at', 'total_amount')

    return {
      total: orders.length,
      revenue,
      popularItems,
      trendData
    }
  }

  const processMaintenanceData = (requests: any[]): AnalyticsData['maintenance'] => {
    const completed = requests.filter(r => r.status === 'completed').length
    const pending = requests.filter(r => r.status === 'pending').length

    // Calculate average resolution time
    const completedRequests = requests.filter(r => r.status === 'completed')
    const totalResolutionTime = completedRequests.reduce((sum, r) => {
      const created = new Date(r.created_at)
      const updated = new Date(r.updated_at)
      return sum + (updated.getTime() - created.getTime())
    }, 0)
    const avgResolutionTime = completedRequests.length > 0
      ? totalResolutionTime / completedRequests.length / (1000 * 60 * 60) // Convert to hours
      : 0

    // Group by priority
    const byPriority = ['low', 'medium', 'high'].map(priority => ({
      priority,
      count: requests.filter(r => r.priority === priority).length
    }))

    return {
      total: requests.length,
      completed,
      pending,
      avgResolutionTime,
      byPriority
    }
  }

  const calculateOccupancyRate = (bookings: any[]): number => {
    // Simple occupancy rate calculation
    const approvedBookings = bookings.filter(b => b.status === 'approved')
    const totalDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365
    const totalRooms = 20 // Assuming 20 rooms, adjust as needed
    const occupiedRoomDays = approvedBookings.length
    return (occupiedRoomDays / (totalRooms * totalDays)) * 100
  }

  const generatePredictions = (bookings: any[], orders: any[]): AnalyticsData['predictions'] => {
    // Simple linear regression for predictions
    const recentBookings = bookings.slice(-30)
    const bookingTrend = recentBookings.length > 0
      ? recentBookings.length / 30
      : 0

    const predictedBookings = Math.round(bookingTrend * 30)
    const avgBookingValue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0) / bookings.length

    return {
      nextMonthBookings: predictedBookings,
      nextMonthRevenue: Math.round(predictedBookings * avgBookingValue),
      peakDays: ['Friday', 'Saturday', 'Sunday'],
      recommendedActions: [
        'Consider dynamic pricing for peak days',
        'Prepare additional staff for predicted busy periods',
        'Stock up on popular food items',
        'Schedule preventive maintenance'
      ]
    }
  }

  const generateTrendData = (data: any[], dateField: string, valueField: string) => {
    const grouped = new Map<string, { count: number; revenue: number }>()
    
    data.forEach(item => {
      const date = new Date(item[dateField]).toISOString().split('T')[0]
      const current = grouped.get(date) || { count: 0, revenue: 0 }
      grouped.set(date, {
        count: current.count + 1,
        revenue: current.revenue + (item[valueField] || 0)
      })
    })

    return Array.from(grouped.entries())
      .map(([date, values]) => ({
        date,
        ...values
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Error loading analytics: {error}
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Reports & Analytics</h1>
        <div className="flex gap-4 mb-6">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as 'week' | 'month' | 'year')}
              className={`px-4 py-2 rounded ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* AI Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Predicted Bookings</h3>
          <p className="text-3xl font-bold text-blue-600">
            {data.predictions.nextMonthBookings}
          </p>
          <p className="text-sm text-gray-600">Next Month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Predicted Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            ${data.predictions.nextMonthRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Next Month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Current Occupancy</h3>
          <p className="text-3xl font-bold text-purple-600">
            {Math.round(data.occupancyRate)}%
          </p>
          <p className="text-sm text-gray-600">Room Occupancy Rate</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Avg Resolution Time</h3>
          <p className="text-3xl font-bold text-orange-600">
            {Math.round(data.maintenance.avgResolutionTime)}h
          </p>
          <p className="text-sm text-gray-600">Maintenance Requests</p>
        </div>
      </div>

      {/* Booking Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Booking Trends</h3>
          <LineChart width={500} height={300} data={data.bookings.trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              name="Bookings"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#82ca9d"
              name="Revenue"
            />
          </LineChart>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Food Order Trends</h3>
          <BarChart width={500} height={300} data={data.foodOrders.trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Orders" />
            <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
          </BarChart>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Maintenance by Priority</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={data.maintenance.byPriority}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.maintenance.byPriority.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Popular Food Items</h3>
          <BarChart width={500} height={300} data={data.foodOrders.popularItems}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-semibold mb-4">AI Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Peak Days</h4>
            <ul className="list-disc list-inside">
              {data.predictions.peakDays.map((day) => (
                <li key={day}>{day}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Recommended Actions</h4>
            <ul className="list-disc list-inside">
              {data.predictions.recommendedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 