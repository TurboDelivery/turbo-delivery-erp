"use client"
import * as React from "react"
import { Filter } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useUniversalFilter } from "@/hooks/use-universal-filter"
import { ICommission } from "@/feature-finance/revenus/types/commission.types"

interface FilterRestaurantProps {
    moduleName?: string;
    commissions?: ICommission[];
    
}

export default function FilterRestaurantComponent({ 
    moduleName = 'commission',
    commissions = [],
    onFilterChange
}: FilterRestaurantProps & { onFilterChange?: (filterName: string, value: string) => void }) {
    const { applyFilter } = useUniversalFilter()
    
    const handleValueChange = (value: string) => {
        const filterValue = value === "all" ? "" : value;
        
        // Utiliser le callback direct si fourni (pour l'approche locale)
        if (onFilterChange) {
            onFilterChange('nomRestaurant', filterValue);
        }
        
        // Appliquer le filtre universel (pour l'approche globale)
        applyFilter('nomRestaurant', filterValue);
    }

    // Extraire les noms de restaurants uniques depuis les livraisons
    const restaurantNames = React.useMemo(() => {
        const uniqueNames = new Set<string>();
        commissions.forEach(commission => {
            if (commission.nomRestaurant) {
                uniqueNames.add(commission.nomRestaurant);
            }
        });
        return Array.from(uniqueNames).sort();
    }, [commissions]);

    return (
        <div className="w-full">
            <Select onValueChange={handleValueChange}>
                <SelectTrigger className="w-[170px] md:w-[250px] lg:w-[350px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrer par restaurant" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Restaurants</SelectLabel>
                        
                        {/* Option pour afficher tous les restaurants */}
                        <SelectItem value="all">
                            Tous les restaurants
                        </SelectItem>
                        
                        {/* Mapping des noms de restaurants uniques */}
                        {restaurantNames.map((nomRestaurant) => (
                            <SelectItem 
                                key={nomRestaurant} 
                                value={nomRestaurant}
                            >
                                {nomRestaurant}
                            </SelectItem>
                        ))}
                        
                        {/* Message si aucun restaurant */}
                        {restaurantNames.length === 0 && (
                            <SelectItem value="none" disabled>
                                Aucun restaurant disponible
                            </SelectItem>
                        )}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}