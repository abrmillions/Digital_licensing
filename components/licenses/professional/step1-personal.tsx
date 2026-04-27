"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhotoUpload } from "@/components/photo-upload"
import { useEffect, useState } from "react"

interface Step1Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
}

export function ProfessionalStep1({ data, updateData, onNext }: Step1Props) {
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [dobError, setDobError] = useState<string | null>(null)
  const [nationalIdError, setNationalIdError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isPhotoVerified, setIsPhotoVerified] = useState(false)
  const hasPhoto = Boolean(
    data?.professional_photo &&
    ((typeof data.professional_photo === 'string' && data.professional_photo.trim().length > 0) ||
     (typeof File !== 'undefined' && data.professional_photo instanceof File))
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

  const validateNationalId = (id: string) => {
    if (!id) return null
    const isDigitsOnly = /^\d+$/.test(id)
    if (!isDigitsOnly) {
      return "National ID FAN number must contain only digits"
    }
    if (id.length !== 16) {
      return "National ID FAN number must be exactly 16 digits"
    }
    return null
  }

  const validateDOB = (dateString: string) => {
    if (!dateString) return null
    const selectedDate = new Date(dateString)
    const today = new Date()
    
    // Check if the date is in the future
    if (selectedDate > today) {
      return "Date of Birth is invalid";
    }

    // Optional: Check if the user is at least 18 years old
    const eighteenYearsAgo = new Date()
    eighteenYearsAgo.setFullYear(today.getFullYear() - 18)
    if (selectedDate > eighteenYearsAgo) {
      return "You must be at least 18 years old to apply"
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

    // Clear previous errors
    setPhotoError(null)
    setDobError(null)
    setNationalIdError(null)
    setPhoneError(null)
    setNameError(null)
    setEmailError(null)

    const nameValidationError = validateWordCount(data.fullName, 50);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    if (data.email && data.email.length > 100) {
      setEmailError("Email must be 100 characters or less");
      return;
    }

    const phoneValidationError = validatePhone(data.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    const nationalIdValidationError = validateNationalId(data.nationalId)
    if (nationalIdValidationError) {
      setNationalIdError(nationalIdValidationError)
      return
    }

    const dobValidationError = validateDOB(data.dateOfBirth)
    if (dobValidationError) {
      setDobError(dobValidationError)
      return
    }

    if (!hasPhoto) {
      setPhotoError("Professional photo is required")
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
      professional_photo: file,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => {
              updateData({ fullName: e.target.value });
              setNameError(null);
            }}
            placeholder="Dr. John Smith"
            className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {nameError && (
            <p className="text-xs text-destructive mt-1 font-medium">{nameError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => {
              updateData({ email: e.target.value });
              setEmailError(null);
            }}
            placeholder="john.smith@example.com"
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

        <div className="space-y-2">
          <Label htmlFor="nationalId">National ID FAN Number *</Label>
          <Input
            id="nationalId"
            value={data.nationalId}
            onChange={(e) => {
              updateData({ nationalId: e.target.value })
              setNationalIdError(null)
            }}
            placeholder="16-digit ID number"
            maxLength={16}
            className={nationalIdError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {nationalIdError && (
            <p className="text-xs text-destructive mt-1 font-medium">{nationalIdError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => {
              updateData({ dateOfBirth: e.target.value })
              setDobError(null)
            }}
            className={dobError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {dobError && (
            <p className="text-xs text-destructive mt-1 font-medium">{dobError}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Full Address *</Label>
        <Select value={data.address} onValueChange={(value) => updateData({ address: value })}>
          <SelectTrigger id="address">
            <SelectValue placeholder="Select Full Address" />
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

      <div className="border-t pt-6">
        <PhotoUpload
          label="Enter Your 4x3 size Photo"
          required={true}
          requireAspectRatio={[4, 3]}
          validateRealTime={true}
          onVerificationChange={setIsPhotoVerified}
          onPhotoUpload={handlePhotoUpload}
          photoUrl={typeof data.professional_photo === 'string' ? data.professional_photo : undefined}
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
