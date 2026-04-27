"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Loader2, CheckCircle2, AlertCircle, UserPlus, FileText, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { notificationsApi } from "@/lib/api/django-client"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: number
  title: string
  message: string
  type: "application" | "registration" | "contact" | "general"
  is_read: boolean
  created_at: string
  application?: number
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const fetchNotifications = useCallback(async (isFirstLoad = false) => {
    if (!isAuthenticated) return

    setIsLoading(true)
    try {
      const data = await notificationsApi.list()
      const newUnreadCount = data.filter((n: Notification) => !n.is_read).length
      
      // Play sound if unread count increased
      if (!isFirstLoad && newUnreadCount > unreadCount) {
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
          audio.volume = 0.5
          audio.play().catch(e => console.warn("[Notification] Audio play blocked by browser:", e))
        } catch (e) {
          console.warn("[Notification] Failed to play sound:", e)
        }
      }

      setNotifications(data)
      setUnreadCount(newUnreadCount)
    } catch (error: any) {
      // For 401s, we handle them quietly unless we specifically want a toast
      const msg = error?.error?.detail || error?.message || "Failed to fetch notifications"
      if (error?.status === 401) {
         // Silently stop if unauthenticated in background
         return
      }
      
      toast({
        title: "Notification Sync Error",
        description: msg,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, unreadCount, toast])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(true)
      // Poll for new notifications every 60 seconds
      const interval = setInterval(() => fetchNotifications(false), 60000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, fetchNotifications])

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.id)
    }

    setIsOpen(false)

    // Navigation logic based on notification type and user role
    const isAdmin = user?.role === "Admin"

    if (n.type === "application" && n.application) {
      if (isAdmin) {
        router.push(`/admin/applications/${n.application}`)
      } else {
        router.push(`/dashboard/applications/#app-${n.application}`)
      }
    } else if (n.type === "contact") {
      if (isAdmin) {
        router.push("/admin/contact")
      }
    } else if (n.type === "registration") {
      if (isAdmin) {
        router.push("/admin/users")
      } else {
        router.push("/dashboard/profile")
      }
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "application": return <FileText className="h-4 w-4 text-blue-600" />
      case "registration": return <UserPlus className="h-4 w-4 text-emerald-600" />
      case "contact": return <Mail className="h-4 w-4 text-purple-600" />
      default: return <Bell className="h-4 w-4 text-slate-600" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full border-slate-200">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 hover:bg-red-700 text-white border-2 border-white rounded-full text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-blue-600 hover:text-blue-700 h-auto p-0"
              onClick={markAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-87.5">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-200 mb-2" />
              <p className="text-sm text-slate-500 font-medium">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No new notifications for now.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 hover:bg-slate-50 transition-colors cursor-pointer relative",
                    !n.is_read && "bg-blue-50/50"
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  {!n.is_read && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  )}
                  <div className="flex gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      n.type === "application" ? "bg-blue-100" : 
                      n.type === "registration" ? "bg-emerald-100" : "bg-purple-100"
                    )}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm text-slate-900 leading-snug",
                        !n.is_read ? "font-bold" : "font-medium"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-bold tracking-wider">
                        {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
          {/* <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500" asChild>
            <Link href="/admin/settings">Notification Settings</Link>
          </Button> */}
        </div>
      </PopoverContent>
    </Popover>
  )
}
