"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, User, Lock, Key } from "lucide-react"

export function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [pin, setPin] = useState("")
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleFirstStep = () => {
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }
    setError("")
    setStep(2)
  }

  const handleLogin = async () => {
    if (!pin) {
      setError("Please enter your PIN")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const success = await login(username, password, pin)
      if (!success) {
        setError("Invalid credentials or PIN")
        setStep(1)
        setPin("")
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
      setStep(1)
      setPin("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">UAFC Management System</CardTitle>
          <CardDescription>{step === 1 ? "Enter your credentials" : "Two-Factor Authentication"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleFirstStep} className="w-full">
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="pin">Security PIN</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10"
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleLogin} disabled={isLoading} className="flex-1">
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="mt-6 text-xs text-gray-500 space-y-1">
            <p>
              <strong>Demo Credentials:</strong>
            </p>
            <p>Admin: admin/admin123/1234</p>
            <p>Instructor: instructor1/inst123/5678</p>
            <p>Student: student1/stud123/9012</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
