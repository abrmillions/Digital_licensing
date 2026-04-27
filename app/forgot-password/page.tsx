"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { DJANGO_API_URL } from "@/lib/config/django-api"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const resp = await fetch(`${DJANGO_API_URL}/api/users/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frontend_url: window.location.origin }),
      })
      const data = await resp.json()
      if (!resp.ok) throw data
      
      const successMsg = "Go to Gmail to reset your password ."
      setMessage(successMsg)
      toast({
        title: "Reset Link Sent",
        description: successMsg,
      })
    } catch (err: any) {
      const errorMsg = err?.detail || err?.message || "Failed to request password reset."
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter the email associated with your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && <div className="text-green-700">{message}</div>}
            {error && <div className="text-red-700">{error}</div>}
            <div>
              <label className="block text-sm mb-1">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="w-full sm:w-auto">Send reset link</Button>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => router.push('/login')}>Back to login</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
