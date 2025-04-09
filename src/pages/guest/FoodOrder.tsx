import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { MenuItem, FoodOrder, Booking } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface CartItem extends MenuItem {
  quantity: number
  special_instructions?: string
}

interface BookingWithRoom {
  id: number
  room_id: string
  guest_id: string
  check_in: string
  check_out: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  total_price: number
  rooms: {
    id: string
    number: string
  }
}

export default function FoodOrder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<MenuItem['category'] | 'all'>('all')
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([])

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category')

      if (error) throw error

      setMenuItems(data || [])
    } catch (error: any) {
      console.error('Error fetching menu items:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesDietary = dietaryFilters.length === 0 ||
                          dietaryFilters.every(filter => item.dietary_info.includes(filter))
    return matchesSearch && matchesCategory && matchesDietary
  })

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }

  const updateCartItemQuantity = (itemId: number, quantity: number) => {
    if (quantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== itemId))
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      )
    }
  }

  const updateSpecialInstructions = (itemId: number, instructions: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, special_instructions: instructions } : item
      )
    )
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleCheckout = async () => {
    try {
      if (!user) {
        throw new Error('Please sign in to place an order')
      }

      // Get current date in ISO format without time
      const today = new Date().toISOString().split('T')[0];

      // First check if user has any active bookings using the same query as MyRoom
      const { data: bookingData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          room_id,
          guest_id,
          status,
          check_in_date,
          check_out_date,
          room:rooms!inner(
            id,
            number
          )
        `)
        .eq('guest_id', user.id)
        .eq('status', 'approved')
        .gte('check_out_date', today)
        .order('check_in_date', { ascending: false })
        .limit(1)
        .single()

      console.log('Booking query response:', { bookingData, bookingsError })

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
        throw new Error('Could not check your booking status')
      }

      if (!bookingData) {
        throw new Error('No active booking found. Please ensure you have an approved booking and are within your stay period.')
      }

      const orderData = {
        guest_id: user.id,
        room_id: bookingData.room_id,
        items: cart.map(item => ({
          item_id: item.id,
          quantity: item.quantity,
          special_instructions: item.special_instructions
        })),
        total_amount: calculateTotal(),
        status: 'pending' as const,
        payment_status: 'pending' as const,
        payment_method: 'room_charge' as const
      }

      console.log('Order data being submitted:', orderData)

      const { error: orderError } = await supabase
        .from('food_orders')
        .insert([orderData])

      if (orderError) {
        console.error('Order error:', orderError)
        throw new Error('Failed to place order. Please try again.')
      }

      // Clear cart and show success message
      setCart([])
      alert(`Order placed successfully! Your order will be delivered to Room ${bookingData.room.number}`)
      navigate('/guest/orders')
    } catch (error: any) {
      console.error('Error placing order:', error)
      setError(error.message)
    }
  }

  const categories: { value: MenuItem['category'] | 'all', label: string }[] = [
    { value: 'all', label: 'All Items' },
    { value: 'appetizer', label: 'Appetizers' },
    { value: 'main_course', label: 'Main Course' },
    { value: 'dessert', label: 'Desserts' },
    { value: 'beverage', label: 'Beverages' }
  ]

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Halal'
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Menu Section */}
        <div className="lg:w-2/3">
          <h1 className="text-2xl font-bold mb-6">Food Menu</h1>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full px-4 py-2 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    selectedCategory === category.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(option => (
                <button
                  key={option}
                  onClick={() => setDietaryFilters(prev =>
                    prev.includes(option)
                      ? prev.filter(item => item !== option)
                      : [...prev, option]
                  )}
                  className={`px-4 py-2 rounded-full text-sm ${
                    dietaryFilters.includes(option)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenuItems.map(item => (
                <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <span className="text-lg font-bold">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.dietary_info.map(info => (
                        <span
                          key={info}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {info}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Your Order</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex flex-col border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            ${item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-200 rounded"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-200 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <textarea
                        placeholder="Special instructions..."
                        value={item.special_instructions || ''}
                        onChange={(e) => updateSpecialInstructions(item.id, e.target.value)}
                        className="w-full text-sm p-2 border rounded"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Place Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 