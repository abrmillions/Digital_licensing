"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api/django-client"

export function AdminLoginForm() {
  const router = useRouter()
  const { login, logout, user } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email.trim(), password)
      
      // We must fetch the latest user info to be absolutely sure of the role
      const currentUser = await authApi.getCurrentUser()
      const role = String(currentUser.role || (currentUser.is_staff ? "Admin" : "User")).toLowerCase()

      if (role !== "admin") {
        await logout() // Important: log out the non-admin user
        const accessError = "Access denied. Only administrator accounts can sign in to this portal."
        setError(accessError)
        toast({
          title: "Access Denied",
          description: accessError,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Login Successful",
        description: "Welcome back, Admin!",
      })
      router.push("/admin")
    } catch (err: any) {
      const detail = err?.error?.detail || err?.message || ""
      let finalMsg = detail || "Admin login failed."
      if (err?.status === 401 || /invalid|credentials|no active account/i.test(detail)) {
        finalMsg = "Invalid email or password. Try again."
        setError(finalMsg)
      } else {
        setError(finalMsg)
      }
      
      toast({
        title: "Login Failed",
        description: finalMsg,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Admin Login</CardTitle>
        <CardDescription>Enter your admin credentials to access the admin portal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@construction.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In as Admin"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-muted-foreground text-center">
          <Link href="/login" className="text-primary hover:underline font-medium">
            Back to User Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
