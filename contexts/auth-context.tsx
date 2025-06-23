"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type User, initialData } from "@/lib/data"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, pin: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("uafc-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string, pin: string): Promise<boolean> => {
    const userData = JSON.parse(localStorage.getItem("uafc-data") || JSON.stringify(initialData))
    const foundUser = userData.users.find(
      (u: User) => u.username === username && u.password === password && u.pin === pin,
    )

    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem("uafc-user", JSON.stringify(foundUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("uafc-user")
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
