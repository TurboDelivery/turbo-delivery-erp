// composants/filtres/filtre-nom-investisseur.tsx
"use client"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { useState, useEffect } from "react"
  import { useInvestissementList } from "@/feature-finance/revenus/hooks/use-investissement-list"
  
  interface InvestisseurNameFilterProps {
      onFilterChange?: (filterName: string, value: string) => void;
  }
  
  export default function InvestisseurNameFilter({ onFilterChange }: InvestisseurNameFilterProps) {
      const [selectedInvestisseur, setSelectedInvestisseur] = useState('all')
      const [investisseurs, setInvestisseurs] = useState<string[]>([])
      
      const { investissements, filters, handleFilterChange } = useInvestissementList()
  
      // Extraire les noms d'investisseurs uniques
      useEffect(() => {
          if (investissements && investissements.length > 0) {
              const uniqueInvestisseurs = Array.from(
                  new Set(investissements.map((inv: any) => inv.nomInvestisseur).filter(Boolean))
              ).sort() as string[]
              setInvestisseurs(uniqueInvestisseurs)
          }
      }, [investissements])
      
      // Synchroniser l'état sélectionné avec les filtres actuels
      useEffect(() => {
          if (filters.nomInvestisseur) {
              setSelectedInvestisseur(filters.nomInvestisseur)
          } else {
              setSelectedInvestisseur('all')
          }
      }, [filters.nomInvestisseur])
  
      // Gérer le changement de nom d'investisseur
      const handleInvestisseurChange = (value: string) => {
          setSelectedInvestisseur(value)
          
          // Si la valeur est "all", on réinitialise le filtre
          const filterValue = value === 'all' ? '' : value
          
          // Appliquer le filtre via le hook useInvestissementList
          handleFilterChange('nomInvestisseur', filterValue)
          
          // Utiliser le callback direct si fourni
          if (onFilterChange) {
              onFilterChange('nomInvestisseur', filterValue)
          }
      }
  
      return (
          <div className="w-full">
              <Select value={selectedInvestisseur} onValueChange={handleInvestisseurChange}>
                  <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un investisseur" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Tous les investisseurs</SelectItem>
                      {investisseurs.map((investisseur) => (
                          <SelectItem key={investisseur} value={investisseur}>
                              {investisseur}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
      )
  }