import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Icons for the sidebar
import {
  HomeIcon,
  UserIcon,
  BookOpenIcon,
  BedIcon,
  WrenchIcon,
  RestaurantIcon,
  ReceiptIcon,
  RoomIcon
} from '../../components/Icons'

export default function GuestLayout() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navigation = [
    { name: 'Dashboard', to: '/guest/dashboard', icon: HomeIcon },
    { name: 'Profile', to: '/guest/profile', icon: UserIcon },
    { name: 'Book Room', to: '/guest/book-room', icon: BedIcon },
    { name: 'My Bookings', to: '/guest/bookings', icon: BookOpenIcon },
    { name: 'My Room', to: '/guest/my-room', icon: RoomIcon },
    { name: 'Maintenance Request', to: '/guest/maintenance', icon: WrenchIcon },
    { name: 'Food Order', to: '/guest/food-order', icon: RestaurantIcon },
    { name: 'Order History', to: '/guest/orders', icon: ReceiptIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4">
            <h1 className="text-xl font-bold text-white">Smart Hotel</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.name}
                  to={item.to}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.profile.first_name} {user?.profile.last_name}
                  </p>
                  <p className="text-xs font-medium text-gray-300 group-hover:text-gray-200">
                    {user?.profile.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="mt-3 w-full flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
} 