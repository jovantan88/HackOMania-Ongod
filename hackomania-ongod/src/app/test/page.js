'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

export default function ProfilePage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  if (!user) return (
    <div className="text-center py-8">
      <p>Loading user data...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="space-y-2">
        <p>Email: {user.email}</p>
        <p>Provider: {user.app_metadata.provider}</p>
        <p>Last Signed In: {new Date(user.last_sign_in_at).toLocaleString()}</p>
      </div>
    </div>
  )
}