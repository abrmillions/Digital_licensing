"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Step2Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ProfessionalStep2({ data, updateData, onNext, onBack }: Step2Props) {
  const [gradYearError, setGradYearError] = useState<string | null>(null)
  const [specializationError, setSpecializationError] = useState<string | null>(null)
  const [universityError, setUniversityError] = useState<string | null>(null)
  const [licenseNumberError, setLicenseNumberError] = useState<string | null>(null)

  const validateGradYear = (year: string) => {
    if (!year) return null
    const y = parseInt(year)
    if (isNaN(y)) return "Invalid year"
    if (y > 2018) {
      return "Graduation year must be 2018 or earlier"
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setGradYearError(null)
    setSpecializationError(null)
    setUniversityError(null)
    setLicenseNumberError(null)

    if (data.specialization && data.specialization.length > 100) {
      setSpecializationError("Specialization must be 100 characters or less")
      return
    }

    if (data.university && data.university.length > 150) {
      setUniversityError("University name must be 150 characters or less")
      return
    }

    const licenseRegex = /^LIC-\d{4}-\d{6}$/
    if (data.licenseNumber && !licenseRegex.test(data.licenseNumber)) {
      setLicenseNumberError("License number must be in format LIC-YYYY-NNNNNN (e.g., LIC-2026-000123)")
      return
    }

    const error = validateGradYear(data.graduationYear)
    if (error) {
      setGradYearError(error)
      return
    }

    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="profession">Profession *</Label>
          <Select value={data.profession} onValueChange={(value) => updateData({ profession: value })}>
            <SelectTrigger id="profession">
              <SelectValue placeholder="Select profession" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="civil-engineer">Civil Engineer</SelectItem>
              <SelectItem value="structural-engineer">Structural Engineer</SelectItem>
              <SelectItem value="electrical-engineer">Electrical Engineer</SelectItem>
              <SelectItem value="mechanical-engineer">Mechanical Engineer</SelectItem>
              <SelectItem value="architect">Architect</SelectItem>
              <SelectItem value="landscape-architect">Landscape Architect</SelectItem>
              <SelectItem value="quantity-surveyor">Quantity Surveyor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization *</Label>
          <Input
            id="specialization"
            value={data.specialization}
            onChange={(e) => {
              updateData({ specialization: e.target.value });
              setSpecializationError(null);
            }}
            placeholder="e.g., Structural Design, Urban Planning"
            className={specializationError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {specializationError && (
            <p className="text-xs text-destructive mt-1 font-medium">{specializationError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="degree">Highest Degree *</Label>
          <Select value={data.degree} onValueChange={(value) => updateData({ degree: value })}>
            <SelectTrigger id="degree">
              <SelectValue placeholder="Select degree" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
              <SelectItem value="master">Master's Degree</SelectItem>
              <SelectItem value="phd">PhD/Doctorate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">University/Institution *</Label>
          <Input
            id="university"
            value={data.university}
            onChange={(e) => {
              updateData({ university: e.target.value });
              setUniversityError(null);
            }}
            placeholder="Name of institution"
            className={universityError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {universityError && (
            <p className="text-xs text-destructive mt-1 font-medium">{universityError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="graduationYear">Graduation Year *</Label>
          <Input
            id="graduationYear"
            type="number"
            min="1950"
            max="2018"
            value={data.graduationYear}
            onChange={(e) => {
              updateData({ graduationYear: e.target.value })
              setGradYearError(null)
            }}
            placeholder="2015"
            className={gradYearError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {gradYearError && (
            <p className="text-xs text-destructive mt-1 font-medium">{gradYearError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Previous License Number (if any)</Label>
          <Input
            id="licenseNumber"
            value={data.licenseNumber}
            onChange={(e) => {
              updateData({ licenseNumber: e.target.value });
              setLicenseNumberError(null);
            }}
            placeholder="LIC-2026-000123"
            className={licenseNumberError ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {licenseNumberError && (
            <p className="text-xs text-destructive mt-1 font-medium">{licenseNumberError}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}
