"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface Step2Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ContractorStep2({ data, updateData, onNext, onBack }: Step2Props) {
  const [taxIdError, setTaxIdError] = useState<string | null>(null)
  const [experienceError, setExperienceError] = useState<string | null>(null)
  const [companyNameError, setCompanyNameError] = useState<string | null>(null)
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null)

  const workScopeOptions = [
    "Building Construction",
    "Road Construction",
    "Bridge Construction",
    "Water & Sewage",
    "Electrical Works",
    "HVAC Systems",
    "Landscaping",
    "Demolition",
  ]

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

  const validateExperience = (years: string) => {
    if (!years) return null
    const y = parseInt(years)
    if (isNaN(y) || y < 0) {
      return "Years of Experience must be a positive number"
    }
    if (y > 40) {
      return "Years of Experience cannot exceed 40 years"
    }
    return null
  }

  const toggleWorkScope = (scope: string) => {
    const current = data.workScope || []
    if (current.includes(scope)) {
      updateData({ workScope: current.filter((s: string) => s !== scope) })
    } else {
      updateData({ workScope: [...current, scope] })
    }
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
    setExperienceError(null)
    setCompanyNameError(null)
    setPostalCodeError(null)

    const companyNameValidationError = validateWordCount(data.companyName, 100);
    if (companyNameValidationError) {
      setCompanyNameError(companyNameValidationError);
      return;
    }

    const taxIdValidationError = validateTaxId(data.taxId)
    if (taxIdValidationError) {
      setTaxIdError(taxIdValidationError)
      return
    }

    const experienceValidationError = validateExperience(data.yearsOfExperience)
    if (experienceValidationError) {
      setExperienceError(experienceValidationError)
      return
    }

    if (data.postalCode && data.postalCode.length > 10) {
      setPostalCodeError("Postal code must be 10 characters or less");
      return;
    }

    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => {
              updateData({ companyName: e.target.value });
              setCompanyNameError(null);
            }}
            placeholder="ABC Construction Ltd."
            className={
              companyNameError
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
            required
          />
          {companyNameError && (
            <p className="text-xs text-destructive mt-1 font-medium">
              {companyNameError}
            </p>
          )}
        </div>

   
      <div className="space-y-2">
          <Label htmlFor="taxId">TIN Number*</Label>
          <Input
            id="taxId"
            value={data.taxId}
            onChange={(e) => {
              updateData({ taxId: e.target.value });
              setTaxIdError(null);
            }}
            placeholder="10-digit TIN number"
            maxLength={10}
            className={
              taxIdError
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
            required
          />
          {taxIdError && (
            <p className="text-xs text-destructive mt-1 font-medium">
              {taxIdError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
          <Input
            id="yearsOfExperience"
            type="number"
            min="0"
            max="40"
            value={data.yearsOfExperience}
            onChange={(e) => {
              updateData({ yearsOfExperience: e.target.value });
              setExperienceError(null);
            }}
            placeholder="Max 40 years"
            className={
              experienceError
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
            required
          />
          {experienceError && (
            <p className="text-xs text-destructive mt-1 font-medium">
              {experienceError}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Company Address *</Label>
          <Select value={data.address} onValueChange={(value) => updateData({ address: value, city: value })}>
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
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            value={data.postalCode}
            onChange={(e) => {
              updateData({ postalCode: e.target.value });
              setPostalCodeError(null);
            }}
            placeholder="10001"
            className={
              postalCodeError
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
            required
          />
          {postalCodeError && (
            <p className="text-xs text-destructive mt-1 font-medium">
              {postalCodeError}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="licenseType">License Type *</Label>
          <Select value={data.licenseType} onValueChange={(value) => updateData({ licenseType: value })}>
            <SelectTrigger id="licenseType">
              <SelectValue placeholder="Select license type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade-1">Grade 1 - Large Projects</SelectItem>
              <SelectItem value="grade-2">Grade 2 - Medium Projects</SelectItem>
              <SelectItem value="grade-3">Grade 3 - Small Projects</SelectItem>
              <SelectItem value="grade-4">Grade 4</SelectItem>
              <SelectItem value="grade-5">Grade 5</SelectItem>
              <SelectItem value="grade-6">Grade 6</SelectItem>
              <SelectItem value="grade-7">Grade 7</SelectItem>
              <SelectItem value="specialized">Specialized Contractor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Work Scope (Select all that apply) *</Label>
        <div className="grid md:grid-cols-2 gap-3">
          {workScopeOptions.map((scope) => (
            <div key={scope} className="flex items-center space-x-2">
              <Checkbox
                id={scope}
                checked={(data.workScope || []).includes(scope)}
                onCheckedChange={() => toggleWorkScope(scope)}
              />
              <label
                htmlFor={scope}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {scope}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto order-2 sm:order-1">
          Back
        </Button>
        <Button type="submit" className="w-full sm:w-auto order-1 sm:order-2">Continue</Button>
      </div>
    </form>
  )
}
