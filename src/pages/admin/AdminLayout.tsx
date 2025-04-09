import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a2b4b] text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-8">Smart Hotel</h1>
          <nav className="space-y-2">
            <Link
              to="/admin/dashboard"
              className={`flex items-center p-3 rounded-lg ${
                location.pathname === '/admin/dashboard'
                  ? 'bg-blue-700'
                  : 'hover:bg-blue-700'
              }`}
            >
              <span className="material-icons mr-3">dashboard</span>
              Dashboard
            </Link>

            <Link
              to="/admin/rooms"
              className={`flex items-center p-3 rounded-lg ${
                location.pathname === '/admin/rooms'
                  ? 'bg-blue-700'
                  : 'hover:bg-blue-700'
              }`}
            >
              <span className="material-icons mr-3">hotel</span>
              Rooms
            </Link>

            <Link
              to="/admin/guests"
              className={`flex items-center p-3 rounded-lg ${
                location.pathname === '/admin/guests'
                  ? 'bg-blue-700'
                  : 'hover:bg-blue-700'
              }`}
            >
              <span className="material-icons mr-3">people</span>
              Guests
            </Link>

            <Link
              to="/admin/book-requests"
              className={`flex items-center p-3 rounded-lg ${
                location.pathname === '/admin/book-requests'
                  ? 'bg-blue-700'
                  : 'hover:bg-blue-700'
              }`}
            >
              <span className="material-icons mr-3">book_online</span>
              Booking Requests
            </Link>

            <Link
              to="/admin/maintenance"
              className={`flex items-center p-3 rounded-lg ${
                location.pathname === '/admin/maintenance'
                  ? 'bg-blue-700'
                  : 'hover:bg-blue-700'
              }`}
            >
              <span className="material-icons mr-3">build</span>
              Maintenance
            </Link>

            <Link
              to="/admin/analytics"
              className={`flex items-center p-3 rounded-lg ${
                location.pathname === '/admin/analytics'
                  ? 'bg-blue-700'
                  : 'hover:bg-blue-700'
              }`}
            >
              <span className="material-icons mr-3">analytics</span>
              Reports & Analytics
            </Link>
          </nav>
        </div>

        {/* User Info & Sign Out */}
        <div className="absolute bottom-0 w-64 p-4 bg-[#1a2b4b]">
          <div className="flex items-center mb-4">
            <div>
              <p className="font-medium">{user?.profile.first_name} {user?.profile.last_name}</p>
              <p className="text-sm text-gray-400 capitalize">{user?.profile.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center p-3 text-left rounded-lg hover:bg-blue-700"
          >
            <span className="material-icons mr-3">logout</span>
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout; 