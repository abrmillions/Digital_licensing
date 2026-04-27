"use client"

import React, { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhotoUpload } from "@/components/photo-upload"

interface Step1Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
}

export function ImportExportStep1({ data, updateData, onNext }: Step1Props) {
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [taxIdError, setTaxIdError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [companyNameError, setCompanyNameError] = useState<string | null>(null)
  const [contactPersonError, setContactPersonError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isPhotoVerified, setIsPhotoVerified] = useState(false)
  const hasPhoto = Boolean(
    data?.company_representative_photo &&
    ((typeof data.company_representative_photo === 'string' && data.company_representative_photo.trim().length > 0) ||
     (typeof File !== 'undefined' && data.company_representative_photo instanceof File))
  )
  useEffect(() => {
    if (hasPhoto && photoError) setPhotoError(null)
  }, [hasPhoto, photoError])

  const validatePhone = (phone: string) => {
    if (!phone) return null;
    // Ethiopian phone format: +251 followed by 9 digits
    const ethiopianPhoneRegex = /^\+251\d{9}$/;
    if (!ethiopianPhoneRegex.test(phone)) {
      return "Phone number must be in the format +251XXXXXXXXX (e.g., +251911223344)";
    }
    return null;
  };

  const validateTaxId = (id: string) => {
    if (!id) return null
    const isDigitsOnly = /^\d+$/.test(id)
    if (!isDigitsOnly) {
      return "TIN Number must contain only digits"
    }
    if (id.length !== 10) {
      return "TIN Number must be exactly 10 digits"
    }
    return null
  }

  const validateWordCount = (text: string, maxWords: number) => {
    if (!text) return null;
    const words = text.trim().split(/\s+/);
    if (words.length > maxWords) {
      return `Must not exceed ${maxWords} words`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setTaxIdError(null)
    setPhoneError(null)
    setPhotoError(null)
    setCompanyNameError(null)
    setContactPersonError(null)
    setEmailError(null)

    const companyNameValidationError = validateWordCount(data.companyName, 50);
    if (companyNameValidationError) {
      setCompanyNameError(companyNameValidationError);
      return;
    }

    const contactPersonValidationError = validateWordCount(data.contactPerson, 50);
    if (contactPersonValidationError) {
      setContactPersonError(contactPersonValidationError);
      return;
    }

    if (data.email && data.email.length > 100) {
      setEmailError("Email address must be 100 characters or less")
      return
    }

    const taxError = validateTaxId(data.taxId)
    if (taxError) {
      setTaxIdError(taxError)
      return
    }

    const phoneValidationError = validatePhone(data.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    if (!hasPhoto) {
      setPhotoError("Company representative photo is required")
      return
    }

    if (!isPhotoVerified) {
      setPhotoError("Please wait for photo verification to complete successfully")
      return
    }

    onNext()
  }

  const handlePhotoUpload = (file: File) => {
    updateData({
      company_representative_photo: file,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => {
              updateData({ companyName: e.target.value });
              setCompanyNameError(null);
            }}
            placeholder="ABC Trading Co."
            className={companyNameError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {companyNameError && (
            <p className="text-xs text-destructive mt-1 font-medium">{companyNameError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number *</Label>
          <Input
            id="registrationNumber"
            value={data.registrationNumber}
            onChange={(e) => updateData({ registrationNumber: e.target.value })}
            placeholder="REG-123456"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">TIN Number *</Label>
          <Input
            id="taxId"
            value={data.taxId}
            onChange={(e) => {
              updateData({ taxId: e.target.value })
              setTaxIdError(null)
            }}
            placeholder="10-digit TIN number"
            maxLength={10}
            className={taxIdError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {taxIdError && (
            <p className="text-xs text-destructive mt-1 font-medium">{taxIdError}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Company Address *</Label>
          <Select value={data.address} onValueChange={(value) => updateData({ address: value })}>
            <SelectTrigger id="address">
              <SelectValue placeholder="Select Company Address" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bale Robe">Bale Robe</SelectItem>
              <SelectItem value="Yabelo">Yabelo</SelectItem>
              <SelectItem value="Bedele">Bedele</SelectItem>
              <SelectItem value="Negele Borana">Negele Borana</SelectItem>
              <SelectItem value="Harar">Harar</SelectItem>
              <SelectItem value="Adama">Adama</SelectItem>
              <SelectItem value="Nekemte">Nekemte</SelectItem>
              <SelectItem value="Adola">Adola</SelectItem>
              <SelectItem value="Shambu">Shambu</SelectItem>
              <SelectItem value="Mettu">Mettu</SelectItem>
              <SelectItem value="Jimma">Jimma</SelectItem>
              <SelectItem value="Dembidolo">Dembidolo</SelectItem>
              <SelectItem value="Fiche">Fiche</SelectItem>
              <SelectItem value="Woliso">Woliso</SelectItem>
              <SelectItem value="Shashemene">Shashemene</SelectItem>
              <SelectItem value="Bule Hora">Bule Hora</SelectItem>
              <SelectItem value="Chiro">Chiro</SelectItem>
              <SelectItem value="Ambo">Ambo</SelectItem>
              <SelectItem value="Gimbi">Gimbi</SelectItem>
              <SelectItem value="Finfinne">Finfinne</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={data.contactPerson}
            onChange={(e) => {
              updateData({ contactPerson: e.target.value });
              setContactPersonError(null);
            }}
            placeholder="John Doe"
            className={contactPersonError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {contactPersonError && (
            <p className="text-xs text-destructive mt-1 font-medium">{contactPersonError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => {
              updateData({ email: e.target.value })
              setEmailError(null)
            }}
            placeholder="contact@company.com"
            className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {emailError && (
            <p className="text-xs text-destructive mt-1 font-medium">{emailError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => {
              updateData({ phone: e.target.value })
              setPhoneError(null)
            }}
            placeholder="+251911223344"
            className={phoneError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {phoneError && (
            <p className="text-xs text-destructive mt-1 font-medium">{phoneError}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <PhotoUpload
          label="Enter Your 4x3 size Photo/Company Representative Photo"
          required={true}
          requireAspectRatio={[4, 3]}
          validateRealTime={true}
          onVerificationChange={setIsPhotoVerified}
          onPhotoUpload={handlePhotoUpload}
          photoUrl={typeof data.company_representative_photo === 'string' ? data.company_representative_photo : undefined}
        />
        {photoError && (
          <p className="mt-2 text-sm text-destructive">{photoError}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={!hasPhoto || !isPhotoVerified}>Continue</Button>
      </div>
    </form>
  )
}
