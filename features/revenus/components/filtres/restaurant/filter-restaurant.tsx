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
import { useLivraisonList } from "@/features/revenus/hooks/use-livraison-list"
import { ILivraison } from "@/features/revenus/types/livraison.types"

interface FilterRestaurantProps {
    moduleName?: string;
    livraisons?: ILivraison[];
    
}

export default function FilterRestaurant({ 
    moduleName = 'livraison',
    livraisons = []
}: FilterRestaurantProps) {
    const { applyFilter } = useUniversalFilter()
    const { filters } = useLivraisonList()
    
    const handleValueChange = (value: string) => {
        applyFilter('restaurant', value === "all" ? "" : value);
    }

    // Extraire les noms de restaurants uniques depuis les livraisons
    const restaurantNames = React.useMemo(() => {
        const uniqueNames = new Set<string>();
        livraisons.forEach(livraison => {
            if (livraison.nomRestaurant) {
                uniqueNames.add(livraison.nomRestaurant);
            }
        });
        return Array.from(uniqueNames).sort();
    }, [livraisons]);

    return (
        <div className="w-full px-4 py-6">
            <Select value={filters.nomRestaurant || "all"} onValueChange={handleValueChange}>
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