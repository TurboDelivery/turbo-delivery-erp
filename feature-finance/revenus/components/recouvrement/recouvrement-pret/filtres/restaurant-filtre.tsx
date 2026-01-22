// components/filtres/restaurant-filtre.tsx
"use client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMemo } from "react"
import { useRecouvrementList } from "@/feature-finance/revenus/hooks/use-recouvrement";

interface RestaurantFiltreProps {
  onFilterChange?: (filterName: string, value: string) => void;
}

export default function RestaurantFiltre({ onFilterChange }: RestaurantFiltreProps) {
  const { allRecouvrements, filters, handleFilterChange } = useRecouvrementList();

  // Extraire les noms de restaurants uniques à partir de TOUTES les données
  const restaurants = useMemo(() => {
    if (!allRecouvrements || allRecouvrements.length === 0) {
      return [];
    }
    
    const uniqueRestaurants = Array.from(
      new Set(allRecouvrements.map(rec => rec.nomRestaurant).filter(Boolean))
    ).sort();
    
    return uniqueRestaurants;
  }, [allRecouvrements]);

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