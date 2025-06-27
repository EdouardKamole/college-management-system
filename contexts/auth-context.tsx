"use client"

import type React from "react"
import { type User } from "@/lib/data"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          setIsLoading(false)
          return
        }

        if (session?.user?.id) {
          // Fetch user data from database
          const { data, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userError) {
            console.error('Error fetching user data:', userError)
            setIsLoading(false)
            return
          }
          setUser(data)
        }
        setIsLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setIsLoading(false)
      }
    }
    
    checkSession()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.signInWithPassword({
      email: username,
      password: password
    })

    if (authError) {
      console.error('Auth error:', authError)
      return false
    }

    if (authUser) {
      // Fetch user data without PIN check
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) {
        console.error('User data error:', userError)
        return false
      }

      if (userData) {
        setUser(userData)
        return true
      }
    }
    return false
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
