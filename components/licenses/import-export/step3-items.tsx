"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface Step3Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ImportExportStep3({ data, updateData, onNext, onBack }: Step3Props) {
  const [items, setItems] = useState(data.items || [])
  const [itemErrors, setItemErrors] = useState<Record<number, string | null>>({})

  const addItem = () => {
    const newItems = [
      ...items,
      {
        name: "",
        category: "",
        quantity: "",
        unit: "",
        value: "",
        hsCode: "",
        manufacturer: "",
        countryOfOrigin: "",
      },
    ]
    setItems(newItems)
    updateData({ items: newItems })
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index)
    setItems(newItems)
    updateData({ items: newItems })
    // Clear errors for the removed item
    const newErrors = { ...itemErrors }
    delete newErrors[index]
    setItemErrors(newErrors)
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
    updateData({ items: newItems })
    // Clear error for this item when edited
    if (itemErrors[index]) {
      setItemErrors((prev) => ({ ...prev, [index]: null }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<number, string | null> = {}
    let hasError = false

    items.forEach((item: any, index: number) => {
      if (item.name && item.name.length > 150) {
        newErrors[index] = "Item name must be 150 characters or less"
        hasError = true
      } else if (item.hsCode && item.hsCode.length > 20) {
        newErrors[index] = "HS Code must be 20 characters or less"
        hasError = true
      } else if (item.manufacturer && item.manufacturer.length > 100) {
        newErrors[index] = "Manufacturer name must be 100 characters or less"
        hasError = true
      } else if (item.countryOfOrigin && item.countryOfOrigin.length > 100) {
        newErrors[index] = "Country of origin must be 100 characters or less"
        hasError = true
      }
    })

    if (hasError) {
      setItemErrors(newErrors)
      return
    }

    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Label>Equipment/Materials List (at least 1 item) *</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item: any, index: number) => (
          <Card key={index} className={itemErrors[index] ? "border-destructive" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-sm">Item {index + 1}</h4>
                  {itemErrors[index] && (
                    <p className="text-xs text-destructive mt-1 font-medium">{itemErrors[index]}</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Item Name/Description *</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    placeholder="e.g., Excavator, Steel Beams, Cement"
                    className={itemErrors[index] && item.name?.length > 150 ? "border-destructive" : ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={item.category} onValueChange={(value) => updateItem(index, "category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heavy-equipment">Heavy Equipment</SelectItem>
                      <SelectItem value="tools">Tools & Machinery</SelectItem>
                      <SelectItem value="building-materials">Building Materials</SelectItem>
                      <SelectItem value="electrical">Electrical Equipment</SelectItem>
                      <SelectItem value="plumbing">Plumbing Supplies</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>HS Code</Label>
                  <Input
                    value={item.hsCode}
                    onChange={(e) => updateItem(index, "hsCode", e.target.value)}
                    placeholder="8429.52"
                    className={itemErrors[index] && item.hsCode?.length > 20 ? "border-destructive" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    placeholder="10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Select value={item.unit} onValueChange={(value) => updateItem(index, "unit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="m3">Cubic Meters</SelectItem>
                      <SelectItem value="containers">Containers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Total Value (USD) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.value}
                    onChange={(e) => updateItem(index, "value", e.target.value)}
                    placeholder="50000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={item.manufacturer}
                    onChange={(e) => updateItem(index, "manufacturer", e.target.value)}
                    placeholder="Company name"
                    className={itemErrors[index] && item.manufacturer?.length > 100 ? "border-destructive" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country of Origin *</Label>
                  <Input
                    value={item.countryOfOrigin}
                    onChange={(e) => updateItem(index, "countryOfOrigin", e.target.value)}
                    placeholder="e.g., USA, China, Germany"
                    className={itemErrors[index] && item.countryOfOrigin?.length > 100 ? "border-destructive" : ""}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No items added yet. Click "Add Item" to get started.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={items.length === 0}>
          Continue
        </Button>
      </div>
    </form>
  )
}
