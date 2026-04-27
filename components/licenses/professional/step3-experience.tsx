"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface Step3Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ProfessionalStep3({ data, updateData, onNext, onBack }: Step3Props) {
  const [projects, setProjects] = useState(data.projects || [])
  const [experienceError, setExperienceError] = useState<string | null>(null)
  const [employerError, setEmployerError] = useState<string | null>(null)
  const [projectErrors, setProjectErrors] = useState<Record<number, string | null>>({})

  const addProject = () => {
    const newProjects = [...projects, { name: "", role: "", year: "", description: "" }]
    setProjects(newProjects)
    updateData({ projects: newProjects })
  }

  const removeProject = (index: number) => {
    const newProjects = projects.filter((_: any, i: number) => i !== index)
    setProjects(newProjects)
    updateData({ projects: newProjects })
    
    // Clear error for removed project
    const newErrors = { ...projectErrors }
    delete newErrors[index]
    setProjectErrors(newErrors)
  }

  const updateProject = (index: number, field: string, value: string) => {
    const newProjects = [...projects]
    newProjects[index][field] = value
    setProjects(newProjects)
    updateData({ projects: newProjects })

    if (field === "year") {
      const newErrors = { ...projectErrors }
      const y = parseInt(value)
      if (!isNaN(y) && y > 2018) {
        newErrors[index] = "Project year must be 2018 or earlier"
      } else {
        delete newErrors[index]
      }
      setProjectErrors(newErrors)
    }
  }

  const validateExperience = (years: string) => {
    if (!years) return null
    const y = parseInt(years)
    if (isNaN(y)) return "Invalid number"
    if (y > 40) return "Years of experience cannot exceed 40"
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setExperienceError(null)
    setEmployerError(null)

    if (data.currentEmployer && data.currentEmployer.length > 150) {
      setEmployerError("Employer name must be 150 characters or less")
      return
    }

    const expErr = validateExperience(data.yearsOfExperience)
    if (expErr) {
      setExperienceError(expErr)
      return
    }

    // Check project years and character limits
    const newErrors: Record<number, string | null> = {}
    let hasProjectError = false
    projects.forEach((p: any, i: number) => {
      if (p.name && p.name.length > 150) {
        newErrors[i] = "Project name must be 150 characters or less"
        hasProjectError = true
      } else if (p.role && p.role.length > 100) {
        newErrors[i] = "Role must be 100 characters or less"
        hasProjectError = true
      } else if (p.description && p.description.length > 500) {
        newErrors[i] = "Description must be 500 characters or less"
        hasProjectError = true
      } else {
        const y = parseInt(p.year)
        if (!isNaN(y) && y > 2018) {
          newErrors[i] = "Project year must be 2018 or earlier"
          hasProjectError = true
        }
      }
    })

    if (hasProjectError) {
      setProjectErrors(newErrors)
      return
    }

    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
          <Input
            id="yearsOfExperience"
            type="number"
            min="0"
            max="40"
            value={data.yearsOfExperience}
            onChange={(e) => {
              updateData({ yearsOfExperience: e.target.value })
              setExperienceError(null)
            }}
            placeholder="Max 40 years"
            className={experienceError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {experienceError && (
            <p className="text-xs text-destructive mt-1 font-medium">{experienceError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentEmployer">Current Employer *</Label>
          <Input
            id="currentEmployer"
            value={data.currentEmployer}
            onChange={(e) => {
              updateData({ currentEmployer: e.target.value });
              setEmployerError(null);
            }}
            placeholder="Company name"
            className={employerError ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {employerError && (
            <p className="text-xs text-destructive mt-1 font-medium">{employerError}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="position">Current Position *</Label>
          <Select value={data.position} onValueChange={(value) => updateData({ position: value })}>
            <SelectTrigger id="position">
              <SelectValue placeholder="Select current position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Engineer">Engineer</SelectItem>
              <SelectItem value="Architect">Architect</SelectItem>
              <SelectItem value="Surveyor">Surveyor</SelectItem>
              <SelectItem value="Consultant">Consultant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Notable Projects (at least 2) *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addProject}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        {projects.map((project: any, index: number) => (
          <Card key={index} className={projectErrors[index] ? "border-destructive" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Project {index + 1}</h4>
                  {projectErrors[index] && (
                    <p className="text-xs text-destructive font-medium">{projectErrors[index]}</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeProject(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input
                    value={project.name}
                    onChange={(e) => {
                      updateProject(index, "name", e.target.value);
                      const newErrors = { ...projectErrors };
                      delete newErrors[index];
                      setProjectErrors(newErrors);
                    }}
                    placeholder="Project name"
                    className={projectErrors[index] && project.name.length > 150 ? "border-destructive" : ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Your Role *</Label>
                  <Input
                    value={project.role}
                    onChange={(e) => {
                      updateProject(index, "role", e.target.value);
                      const newErrors = { ...projectErrors };
                      delete newErrors[index];
                      setProjectErrors(newErrors);
                    }}
                    placeholder="Lead Engineer, Designer, etc."
                    className={projectErrors[index] && project.role.length > 100 ? "border-destructive" : ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Input
                    type="number"
                    max="2018"
                    value={project.year}
                    onChange={(e) => {
                      updateProject(index, "year", e.target.value);
                      const newErrors = { ...projectErrors };
                      delete newErrors[index];
                      setProjectErrors(newErrors);
                    }}
                    placeholder="2015"
                    className={projectErrors[index] && parseInt(project.year) > 2018 ? "border-destructive focus-visible:ring-destructive" : ""}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={project.description}
                    onChange={(e) => {
                      updateProject(index, "description", e.target.value);
                      const newErrors = { ...projectErrors };
                      delete newErrors[index];
                      setProjectErrors(newErrors);
                    }}
                    placeholder="Brief description of the project"
                    className={projectErrors[index] && project.description.length > 500 ? "border-destructive" : ""}
                    rows={2}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No projects added yet. Click "Add Project" to get started.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={projects.length < 2}>
          Continue
        </Button>
      </div>
    </form>
  )
}
