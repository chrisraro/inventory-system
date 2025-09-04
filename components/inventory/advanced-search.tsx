"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X, SlidersHorizontal } from "lucide-react"
import type { Product } from "@/lib/supabase"

interface SearchFilters {
  searchTerm: string
  unitType: string
  stockStatus: string
  priceRange: { min: string; max: string }
  quantityRange: { min: string; max: string }
}

interface AdvancedSearchProps {
  products: Product[]
  onFilteredResults: (filtered: Product[]) => void
  onFiltersChange: (filters: SearchFilters) => void
}

export default function AdvancedSearch({ products, onFilteredResults, onFiltersChange }: AdvancedSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: "",
    unitType: "all",
    stockStatus: "all",
    priceRange: { min: "", max: "" },
    quantityRange: { min: "", max: "" },
  })

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
    applyFilters(newFilters)
  }

  const applyFilters = (currentFilters: SearchFilters) => {
    let filtered = [...products]

    // Text search
    if (currentFilters.searchTerm) {
      const searchLower = currentFilters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.remarks?.toLowerCase().includes(searchLower),
      )
    }

    // Unit type filter
    if (currentFilters.unitType !== "all") {
      filtered = filtered.filter((product) => product.unit_type === currentFilters.unitType)
    }

    // Stock status filter
    if (currentFilters.stockStatus !== "all") {
      filtered = filtered.filter((product) => {
        switch (currentFilters.stockStatus) {
          case "in-stock":
            return product.quantity > product.min_threshold
          case "low-stock":
            return product.quantity <= product.min_threshold && product.quantity > 0
          case "out-of-stock":
            return product.quantity === 0
          default:
            return true
        }
      })
    }

    // Price range filter
    if (currentFilters.priceRange.min || currentFilters.priceRange.max) {
      filtered = filtered.filter((product) => {
        const price = product.unit_cost
        const min = currentFilters.priceRange.min ? Number.parseFloat(currentFilters.priceRange.min) : 0
        const max = currentFilters.priceRange.max
          ? Number.parseFloat(currentFilters.priceRange.max)
          : Number.POSITIVE_INFINITY
        return price >= min && price <= max
      })
    }

    // Quantity range filter
    if (currentFilters.quantityRange.min || currentFilters.quantityRange.max) {
      filtered = filtered.filter((product) => {
        const quantity = product.quantity
        const min = currentFilters.quantityRange.min ? Number.parseFloat(currentFilters.quantityRange.min) : 0
        const max = currentFilters.quantityRange.max
          ? Number.parseFloat(currentFilters.quantityRange.max)
          : Number.POSITIVE_INFINITY
        return quantity >= min && quantity <= max
      })
    }

    onFilteredResults(filtered)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      searchTerm: "",
      unitType: "all",
      stockStatus: "all",
      priceRange: { min: "", max: "" },
      quantityRange: { min: "", max: "" },
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onFilteredResults(products)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.searchTerm) count++
    if (filters.unitType !== "all") count++
    if (filters.stockStatus !== "all") count++
    if (filters.priceRange.min || filters.priceRange.max) count++
    if (filters.quantityRange.min || filters.quantityRange.max) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filter
          </span>
          <div className="flex items-center space-x-2">
            {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
            <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showAdvanced ? "Simple" : "Advanced"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter("searchTerm", e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filters.stockStatus} onValueChange={(value) => updateFilter("stockStatus", value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Unit Type</Label>
                <Select value={filters.unitType} onValueChange={(value) => updateFilter("unitType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    <SelectItem value="Bottle">Bottle</SelectItem>
                    <SelectItem value="Liter">Liter</SelectItem>
                    <SelectItem value="Shot">Shot</SelectItem>
                    <SelectItem value="Case">Case</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Range ($)</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange.min}
                    onChange={(e) => updateFilter("priceRange", { ...filters.priceRange, min: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange.max}
                    onChange={(e) => updateFilter("priceRange", { ...filters.priceRange, max: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity Range</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.quantityRange.min}
                    onChange={(e) => updateFilter("quantityRange", { ...filters.quantityRange, min: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.quantityRange.max}
                    onChange={(e) => updateFilter("quantityRange", { ...filters.quantityRange, max: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
