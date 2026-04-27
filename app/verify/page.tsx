"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, QrCode, Search, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import QRScanner from "@/components/qr-scanner"
import djangoApi, { licensesApi, partnershipsApi, vehiclesApi } from "@/lib/api/django-client"
import { parseQRData } from "@/lib/qr/qr-utils"
import { useAuth } from "@/lib/auth/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { generateLicensePDF, generatePartnershipPDF, generateVehicleCertificatePDF } from "@/lib/downloads/pdf-generator"

function QueryReader({ onParams }: { onParams: (p: { licenseNumber?: string; token?: string }) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const licenseNumber = searchParams.get('licenseNumber') || undefined
    const token = searchParams.get('token') || undefined
    onParams({ licenseNumber, token })
    // Intentionally run only once on mount to avoid dependency length changes during HMR
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function VerifyPage() {
  const [licenseNumber, setLicenseNumber] = useState("")
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const { maintenanceMode } = useAuth()
  const { toast } = useToast()

  const generateCertificate = async (id: string, type: string, existingData?: any) => {
    setIsGeneratingPdf(true)
    try {
      let pdf: any
      const section = type?.toLowerCase()

      // Use existing data if provided (e.g. from verification result)
      // This avoids extra API calls and permission issues on public pages
      if (existingData) {
        if (section === "partnership") {
          pdf = await generatePartnershipPDF(existingData)
        } else if (section === "vehicle") {
          pdf = await generateVehicleCertificatePDF(existingData)
        } else {
          pdf = await generateLicensePDF(existingData)
        }
      } 
      
      // Fallback only if no existing data (though in this page we should always have it)
      if (!pdf) {
        if (section === "partnership") {
          const detail = await partnershipsApi.getDetail(id)
          pdf = await generatePartnershipPDF(detail)
        } else if (section === "vehicle") {
          const detail = await vehiclesApi.getDetail(id)
          pdf = await generateVehicleCertificatePDF(detail)
        } else {
          try {
            const response = await licensesApi.download(id)
            if (response?.license) {
              pdf = await generateLicensePDF(response.license)
            }
          } catch (err) {
            console.warn("Could not download full license details, generating from basic info", err)
            // If download fails (e.g. 403), we can't do much more without existingData
          }
        }
      }

      if (pdf) {
        const blob = pdf.output("bloburl")
        setPdfUrl(blob)
      }
    } catch (err) {
      console.error("Certificate generation error:", err)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const localVerify = async (targetNumber?: string) => {
    const num = String(targetNumber || licenseNumber || '').trim()
    if (!num) return false
    try {
      const all: any[] = await licensesApi.list()
      const target = (all || []).find((lic) => {
        const n = String(
          lic.license_number ||
            (lic.data && (lic.data.licenseNumber || lic.data.registrationNumber)) ||
            ''
        ).trim()
        return n.toUpperCase() === num.toUpperCase()
      })
      if (target) {
        const st = String(target.status || '').toLowerCase()
        const notExpired = !target.expiry_date || new Date(target.expiry_date) >= new Date()
        if (st === 'active' || st === 'approved') {
          if (notExpired) {
            setLicenseNumber(num)
            setVerificationResult({
              found: true,
              data: {
                licenseId: target.id,
                licenseNumber: num,
                companyName: target.data?.companyName || '',
                licenseType: target.license_type || '',
                issueDate: target.issued_date || target.data?.issueDate || 'N/A',
                expiryDate: target.expiry_date || target.data?.expiryDate || 'N/A',
                authorizedScope: target.license_type || '',
                status: target.status || 'active',
                verified: true,
              },
            })
            // Proactively generate certificate for viewing (local fallback)
            void generateCertificate(target.id, target.license_type, target)
            return true
          }
        }
      }
    } catch {}
    return false
  }

  const runVerification = async (options: { licenseNumber?: string; token?: string }) => {
    if (!options.licenseNumber && !options.token) return

    setIsSearching(true)
    setError(null)
    setPdfUrl(null)

    try {
      const result = await djangoApi.verifyLicense(options)
      
      if (result.valid) {
        // Ensure the input shows the verified license number
        if (result.license_number) {
          setLicenseNumber(result.license_number)
        }
        
        // Format license type for display
        const formatLicenseType = (type: string, subtype?: string) => {
          if (!type) return "Construction License"
          const typeMap: Record<string, string> = {
            contractor: "Contractor License",
            professional: "Professional License",
            vehicle: "Vehicle License"
          }
          const baseType = typeMap[type.toLowerCase()] || type
          if (subtype) {
            // Capitalize first letter of each word in subtype
            const formattedSubtype = subtype.split(/[-_\s]/).map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')
            return `${baseType} - Grade ${formattedSubtype}`
          }
          return baseType
        }
        
        const verificationData = {
          licenseId: result.id,
          licenseNumber: result.license_number,
          companyName: result.company_name || "",
          licenseType: formatLicenseType(result.license_type, result.subtype),
          issueDate: result.issued_date || "N/A",
          expiryDate: result.expiry_date || "N/A",
          authorizedScope: result.authorized_scope || result.license_type || "General Construction",
          status: result.status || "active",
          verified: true,
          rawType: result.license_type,
        }

        setVerificationResult({
          found: true,
          data: verificationData,
        })

        // Proactively generate certificate for viewing
        void generateCertificate(result.id, result.license_type, result)
      } else {
        const ok = await localVerify(options.licenseNumber)
        if (!ok) {
          setVerificationResult({ found: false, data: null })
          const errorMsg = result.detail || "The license number you entered was not found in the database."
          setError(errorMsg)
          toast({
            title: "Verification Failed",
            description: errorMsg,
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      const ok = await localVerify(options.licenseNumber)
      if (!ok) {
        setVerificationResult({
          found: false,
          data: null,
        })
        const errorMsg = error?.message || 'An error occurred during verification.'
        setError(errorMsg)
        toast({
          title: "Verification Error",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    await runVerification({ licenseNumber })
  }

  const handleParams = (p: { licenseNumber?: string; token?: string }) => {
    if (p.token) {
      void runVerification({ token: p.token })
      return
    }
    if (p.licenseNumber) {
      setLicenseNumber(p.licenseNumber)
      void runVerification({ licenseNumber: p.licenseNumber })
    }
  }

  const handleQRScan = (qrData: string) => {
    const parsed = parseQRData(qrData)
    const licNum = parsed?.licenseNumber || parsed?.licenseId || (parsed?.type === 'text' ? parsed.value : null)
    
    if (licNum) {
      setLicenseNumber(licNum)
      setShowScanner(false)
      void runVerification({ licenseNumber: licNum })
    } else {
      setError('Could not extract a valid license number from the QR code.')
      setShowScanner(false)
    }
  }

  // (download certificate handler removed; not currently used)

  return (
      <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <QueryReader onParams={handleParams} />
      </Suspense>
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">CLMS</h1>
              <p className="text-xs text-muted-foreground">License Verification Portal</p>
            </div>
          </Link>
          <Button variant="outlineBlueHover" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
        {maintenanceMode && (
          <div className="w-full">
            <div className="container mx-auto px-4 pb-3">
              <Alert className="border-amber-300 bg-amber-50 text-amber-800">
                <AlertTitle>Maintenance in Progress</AlertTitle>
                <AlertDescription>Verification may be temporarily unavailable during updates.</AlertDescription>
              </Alert>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Verify Construction License</h2>
          <p className="text-muted-foreground">Enter a license number or scan the QR code to verify authenticity</p>
        </div>

        {!showScanner ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>License Verification</CardTitle>
              <CardDescription>Verify contractor licenses, professional certifications, and permits</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="licenseNumber"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="Enter license number (e.g., LIC-2026-000123)"
                      className="flex-1"
                      required
                    />
                    <Button type="submit" disabled={isSearching}>
                      <Search className="w-4 h-4 mr-2" />
                      {isSearching ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="w-full bg-transparent"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code with Camera
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-center mb-8">
            <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
          </div>
        )}

        {verificationResult && !verificationResult.found && (
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  License Not Found
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  The license number you entered was not found in our database.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please verify the license number and try again, or contact support for assistance.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationResult?.found && (
          <div className="mt-8">
            <Card className="overflow-hidden border-2 border-primary/20 bg-muted/30">
              <div className="relative aspect-[1/1.414] w-full">
                {pdfUrl ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-0"
                    title="License Certificate"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-12 h-12 text-primary/40 animate-spin mb-4" />
                        <p className="text-muted-foreground font-medium">Preparing certificate view...</p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-12 h-12 text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground font-medium">Certificate preview not available</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">This may happen for some older records or during maintenance.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
