import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  HomeIcon,
  KeyIcon,
  WrenchScrewdriverIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface GuestLayoutProps {
  children: ReactNode
}

export default function GuestLayout({ children }: GuestLayoutProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/guest/dashboard', icon: HomeIcon },
    { name: 'Profile', href: '/guest/profile', icon: UserIcon },
    { name: 'Book a Room', href: '/guest/book', icon: BuildingOfficeIcon },
    { name: 'My Room', href: '/guest/my-room', icon: KeyIcon },
    { name: 'Maintenance', href: '/guest/maintenance', icon: WrenchScrewdriverIcon },
    { name: 'Order Food', href: '/guest/food-order', icon: ShoppingBagIcon },
    { name: 'My Orders', href: '/guest/orders', icon: ClipboardDocumentListIcon },
  ]

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col fixed h-full">
          <div className="flex flex-col flex-grow bg-[#1a3b61]">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 h-16">
              <span className="text-xl font-semibold text-white">Smart Hotel</span>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href)
                        ? 'bg-[#2c5282] text-white'
                        : 'text-gray-300 hover:bg-[#2c5282] hover:text-white'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* User Profile and Sign Out */}
            <div className="flex-shrink-0 p-4">
              <div className="flex flex-col space-y-3">
                <div>
                  <p className="text-sm font-medium text-white">{user?.profile.first_name} {user?.profile.last_name}</p>
                  <p className="text-xs font-medium text-gray-300">Guest</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-sm text-white bg-[#2c5282] hover:bg-[#3c6292] rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:pl-64 flex-1">
          <main className="h-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 