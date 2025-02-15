'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  // new: state for GitHub followers
  const [followers, setFollowers] = useState([])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  // new: fetch GitHub followers when a GitHub user is logged in
  useEffect(() => {
    if (user && user.app_metadata.provider === 'github') {
      const username = user.user_metadata.user_name || user.user_metadata.login
      if (username) {
        const fetchFollowers = async () => {
          try {
            const res = await fetch(`https://api.github.com/users/${username}/followers`)
            const data = await res.json()
            setFollowers(data)
          } catch (error) {
            console.error('Error fetching followers:', error)
          }
        }
        fetchFollowers()
      }
    }
  }, [user])

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
      <div className="space-y-2">
        <h2 className="text-xl font-bold">GitHub Followers</h2>
        { followers.length > 0 ? (
          <ul>
            {followers.map(follower => (
              <li key={follower.id}>
                <img 
                  src={follower.avatar_url} 
                  alt={follower.login}
                  className="w-8 h-8 inline-block rounded-full mr-2"
                />
                {follower.login}
              </li>
            ))}
          </ul>
        ) : (
          <p>No followers found.</p>
        )}
      </div>
    </div>
  )
}