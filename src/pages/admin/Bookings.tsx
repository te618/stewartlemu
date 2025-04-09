import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Bookings() {
  const [loading, setLoading] = useState(true)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <div className="mt-4">
          <p className="text-gray-500">Bookings management coming soon...</p>
        </div>
      </div>
    </div>
  )
} 