"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface Step2Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function PartnershipStep2({ data, updateData, onNext, onBack }: Step2Props) {
  const [partners, setPartners] = useState(data.partners || [])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addPartner = () => {
    if (partners.length >= 2) {
      return
    }
    const newPartners = [
      ...partners,
      {
        companyName: "",
        licenseNumber: "",
        contactPerson: "",
        email: "",
        phone: "",
        sharePercentage: "",
      },
    ]
    setPartners(newPartners)
    updateData({ partners: newPartners })
  }

  const removePartner = (index: number) => {
    const newPartners = partners.filter((_: any, i: number) => i !== index)
    setPartners(newPartners)
    updateData({ partners: newPartners })
  }

  const updatePartner = (index: number, field: string, value: string) => {
    const newPartners = [...partners]
    newPartners[index][field] = value
    setPartners(newPartners)
    updateData({ partners: newPartners })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    partners.forEach((partner: any, index: number) => {
      if (partner.companyName && partner.companyName.length > 100) {
        newErrors[`companyName_${index}`] = "Company name must be 100 characters or less"
      }
      
      // Validation for License Number like LIC-2026-000004 (15 characters)
      if (partner.licenseNumber) {
        if (partner.licenseNumber.length !== 15) {
          newErrors[`licenseNumber_${index}`] = "License number must be exactly 15 characters (e.g., LIC-2026-000004)"
        } else if (!/^LIC-\d{4}-\d{6}$/.test(partner.licenseNumber)) {
          newErrors[`licenseNumber_${index}`] = "Invalid format. Expected: LIC-YYYY-NNNNNN"
        }
      }

      if (partner.contactPerson && partner.contactPerson.length > 50) {
        newErrors[`contactPerson_${index}`] = "Contact person must be 50 characters or less"
      }

      if (partner.phone) {
        if (partner.phone.length !== 10) {
          newErrors[`phone_${index}`] = "Phone number must be exactly 10 digits"
        } else if (!/^\d{10}$/.test(partner.phone)) {
          newErrors[`phone_${index}`] = "Phone number must contain only digits"
        }
      }
    })

    const totalShare = partners.reduce((sum: number, p: any) => sum + (Number.parseFloat(p.sharePercentage) || 0), 0)
    if (Math.abs(totalShare - 100) > 0.01) {
      newErrors.totalShare = "Total partnership share must equal 100%"
    }

    if (partners.length !== 2) {
      newErrors.partnersCount = "Exactly 2 partners are required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onNext()
    }
  }

  const totalShare = partners.reduce((sum: number, p: any) => sum + (Number.parseFloat(p.sharePercentage) || 0), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Label>Partner Companies (exactly 2) *</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPartner} disabled={partners.length >= 2}>
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      <div className="space-y-4">
        {partners.map((partner: any, index: number) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-semibold text-sm">Partner {index + 1}</h4>
                {partners.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePartner(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={partner.companyName}
                    onChange={(e) => updatePartner(index, "companyName", e.target.value)}
                    placeholder="Partner Company Ltd."
                    required
                    className={errors[`companyName_${index}`] ? "border-destructive" : ""}
                  />
                  {errors[`companyName_${index}`] && <p className="text-xs text-destructive">{errors[`companyName_${index}`]}</p>}
                </div>
                <div className="space-y-2">
                  <Label>License Number *</Label>
                  <Input
                    value={partner.licenseNumber}
                    onChange={(e) => updatePartner(index, "licenseNumber", e.target.value)}
                    placeholder="LIC-2026-000004"
                    required
                    className={errors[`licenseNumber_${index}`] ? "border-destructive" : ""}
                  />
                  {errors[`licenseNumber_${index}`] && <p className="text-xs text-destructive">{errors[`licenseNumber_${index}`]}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input
                    value={partner.contactPerson}
                    onChange={(e) => updatePartner(index, "contactPerson", e.target.value)}
                    placeholder="John Doe"
                    required
                    className={errors[`contactPerson_${index}`] ? "border-destructive" : ""}
                  />
                  {errors[`contactPerson_${index}`] && <p className="text-xs text-destructive">{errors[`contactPerson_${index}`]}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={partner.email}
                    onChange={(e) => updatePartner(index, "email", e.target.value)}
                    placeholder="contact@partner.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={partner.phone}
                    onChange={(e) => updatePartner(index, "phone", e.target.value)}
                    placeholder="0123456789"
                    required
                    className={errors[`phone_${index}`] ? "border-destructive" : ""}
                  />
                  {errors[`phone_${index}`] && <p className="text-xs text-destructive">{errors[`phone_${index}`]}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Share Percentage (%) *</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={partner.sharePercentage}
                    onChange={(e) => updatePartner(index, "sharePercentage", e.target.value)}
                    placeholder="50"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {partners.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No partners added yet. Click "Add Partner" to get started.</p>
          </div>
        )}
      </div>

      {partners.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total Share:</span>
            <span
              className={`text-lg font-bold ${!errors.totalShare ? "text-accent" : "text-destructive"}`}
            >
              {totalShare.toFixed(2)}%
            </span>
          </div>
          {errors.totalShare && (
            <p className="text-xs text-destructive mt-2">
              {errors.totalShare}. Current total: {totalShare.toFixed(2)}%
            </p>
          )}
          {errors.partnersCount && (
            <p className="text-xs text-destructive mt-2">
              {errors.partnersCount}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={partners.length !== 2}>
          Continue
        </Button>
      </div>
    </form>
  )
}
