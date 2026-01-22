"use client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePretList } from "@/feature-finance/revenus/hooks/use-pret-list";
import { useMemo } from "react"

interface RestaurantFiltreProps {
  onFilterChange?: (filterName: string, value: string) => void;
}

export default function RestaurantFiltre({ onFilterChange }: RestaurantFiltreProps) {
  const { allFactures, filters, handleFilterChange } = usePretList();

  // Extraire les noms de restaurants uniques à partir de TOUTES les données
  const restaurants = useMemo(() => {
    if (!allFactures || allFactures.length === 0) {
      return [];
    }
    
    const uniqueRestaurants = Array.from(
      new Set(allFactures.map(rec => rec.nomRestaurant).filter(Boolean))
    ).sort();
    
    return uniqueRestaurants;
  }, [allFactures]);

  // Gérer le changement de restaurant
  const handleRestaurantChange = (value: string) => {
    const filterValue = value === 'all' ? '' : value
    
    // Utiliser la fonction handleFilterChange du hook
    handleFilterChange('nomRestaurant', filterValue)
    
    // Callback optionnel
    if (onFilterChange) {
      onFilterChange('nomRestaurant', filterValue)
    }
  }

  return (
    <div className="w-full max-w-xs">
      <Select 
        value={filters.nomRestaurant || 'all'} 
        onValueChange={handleRestaurantChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionner un restaurant" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les restaurants</SelectItem>
          {restaurants.map((restaurant) => (
            <SelectItem key={restaurant} value={restaurant}>
              {restaurant}
            </SelectItem>
          ))}
          {restaurants.length === 0 && (
            <SelectItem value="no-restaurants" disabled>
              Aucun restaurant trouvé
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}