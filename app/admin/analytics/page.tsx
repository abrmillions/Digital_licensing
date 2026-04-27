"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, ArrowLeft, Users, FileText, Wallet, CheckCircle, Loader2, RefreshCw } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { analyticsApi, paymentsApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsData {
  applicationTrends: any[]
  licenseTypes: any[]
  revenueData: any[]
  totalApplications: number
  approvalRate: number
  totalRevenue: number
  activeUsers: number
  processingTimes: any[]
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("month")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAuthAndFetchAnalytics()
  }, [timeRange])

  const checkAuthAndFetchAnalytics = async () => {
    try {
        setLoading(true)
        // Check local user role first
        const userStr = localStorage.getItem('clms_user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (user.role !== 'Admin') {
                setError("Access Denied: You do not have administrator privileges.")
                setLoading(false)
                return
            }
        }

        // Fetch dashboard stats and payments list in parallel
        const [response, paymentsResponse] = await Promise.all([
          analyticsApi.getDashboard(timeRange),
          paymentsApi.list().catch(err => {
            console.warn("Failed to fetch payments list for real-time revenue:", err)
            return []
          })
        ])
        
        // Calculate real-time total revenue from all successful payments
        try {
          const allPayments = Array.isArray(paymentsResponse) 
            ? paymentsResponse 
            : (paymentsResponse.results || [])
          
          const successfulPayments = allPayments.filter((p: any) => {
            const status = String(p.status || "").toLowerCase();
            const currency = String(p.currency || "").toLowerCase();
            return (
              (status === "success" || status === "paid" || status === "active") &&
              (currency === "etb" || !p.currency) // Default to ETB if not specified
            ) || p.is_paid === true;
          })
          
          // Calculate total revenue for the card
          const calculatedTotalRevenue = successfulPayments.reduce((sum: number, p: any) => 
            sum + (parseFloat(String(p.amount).replace(/,/g, '')) || 0), 0
          )
          
          // Update dashboard total revenue - only if we found payments or if backend says 0
          // This prevents overwriting a valid backend sum with 0 if list() failed
          if (calculatedTotalRevenue > 0 || (response.totalRevenue === 0 && successfulPayments.length === 0)) {
            response.totalRevenue = calculatedTotalRevenue
          }

          // Update chart data to be consistent with successful payments
          // Group by month for the line chart
          const monthlyRevenue: { [key: string]: number } = {}
          successfulPayments.forEach((p: any) => {
            const date = new Date(p.paid_at || p.created_at || new Date())
            const monthName = date.toLocaleString('default', { month: 'short' })
            monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + (parseFloat(String(p.amount).replace(/,/g, '')) || 0)
          })

          // Convert to chart format (e.g., [{ month: 'Jan', revenue: 1000 }, ...])
          // We can use the existing month order from response.revenueData if available
          if (response.revenueData && response.revenueData.length > 0) {
            response.revenueData = response.revenueData.map((item: any) => ({
              ...item,
              revenue: monthlyRevenue[item.month] || 0
            }))
          } else {
            // If no revenueData from backend, build it from the payments we found
            // Sort months chronologically
            const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            response.revenueData = Object.entries(monthlyRevenue)
              .map(([month, revenue]) => ({ month, revenue }))
              .sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month))
          }
        } catch (payErr) {
          console.warn("Real-time revenue calculation failed, falling back to dashboard stats:", payErr)
        }

        setData(response)
    } catch (error: any) {
        // console.error("Failed to fetch analytics:", error) // Suppress noisy console log
        
        const isDbError = error?.status === 500 || error?.message?.includes("500");
        
        if (error?.status === 403 || error?.response?.status === 403 || error?.message?.includes("Permission denied")) {
             setError("Access Denied: You do not have administrator privileges.")
        } else if (isDbError) {
             toast({
                title: "Database Connection Issue",
                description: "The server is currently experiencing high traffic. Please wait a moment and try again.",
                variant: "destructive",
            })
        } else {
             toast({
                title: "Loading Error",
                description: "We couldn't load the analytics data right now.",
                variant: "destructive",
            })
        }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Access Denied
                    </CardTitle>
                    <CardDescription>
                        {error}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/dashboard">Return to User Portal</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-slate-900 flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    No Data Available
                </CardTitle>
                <CardDescription>
                    We couldn't retrieve the analytics data. This might be due to a temporary database connection issue.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Button onClick={checkAuthAndFetchAnalytics} className="gap-2">
                    <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                </Button>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 line-clamp-1">Analytics Dashboard</h1>
                <p className="text-sm text-slate-600">System performance and insights</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkAuthAndFetchAnalytics}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.totalApplications}</div>
              {/* Trends removed as backend doesn't provide comparison data yet */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Approval Rate</CardTitle>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.approvalRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                  maximumFractionDigits: 0,
                }).format(data.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.activeUsers}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>Monthly application submissions and outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.applicationTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis 
                    stroke="#64748B" 
                    tickFormatter={(value) => `${value}`}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px" }}
                    formatter={(value: any, name: string | undefined) => {
                      const displayName = name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
                      return [`${value}`, displayName];
                    }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar dataKey="applications" fill="#94A3B8" name="Total Submissions" />
                  <Bar dataKey="active" fill="#3B82F6" name="Active" />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" />
                  <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>License Distribution</CardTitle>
              <CardDescription>Breakdown by license type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-75 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.licenseTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.licenseTypes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} Licenses`, "Count"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>Monthly revenue overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis 
                    stroke="#64748B" 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px" }}
                    formatter={(value: any) => [`${new Intl.NumberFormat("en-ET").format(value)} ETB`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Times</CardTitle>
              <CardDescription>Average processing time by license type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.processingTimes.map((item: any, index: number) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${index % 2 === 0 ? "bg-blue-500" : "bg-emerald-500"}`} />
                      <span className="text-sm font-medium text-slate-700 truncate">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="h-2 flex-1 sm:w-32 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${index % 2 === 0 ? "bg-blue-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(item.avgDays * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 shrink-0">{item.avgDays} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
