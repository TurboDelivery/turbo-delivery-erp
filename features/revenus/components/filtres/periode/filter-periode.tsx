"use client"

import { useState, useMemo } from "react"
import { useUniversalFilter } from "@/hooks/use-universal-filter"
import { useLivraisonList } from "@/features/revenus/hooks/use-livraison-list"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { User } from "lucide-react"
import { CalendarInput } from "@/components/components-finance/block/dateInput"


interface FilterPeriodeProps {
    moduleName?: string
}

export default function FilterPeriode({ moduleName = 'livraison' }: FilterPeriodeProps) {
    const [selectedDateDebut, setSelectedDateDebut] = useState<Date | undefined>(undefined)
    
    const { applyFilter } = useUniversalFilter()
    const { livraisons } = useLivraisonList()
    
    // Extraire les noms de livreurs uniques depuis les livraisons
    const livreurNames = useMemo(() => {
        if (!Array.isArray(livraisons)) return []
        
        const uniqueNames = new Set<string>()
        livraisons.forEach(livraison => {
            if (livraison.nomLivreur) {
                uniqueNames.add(livraison.nomLivreur)
            }
        })
        return Array.from(uniqueNames).sort()
    }, [livraisons])
    
    // Gérer le changement de livreur
    const handleLivreurChange = (value: string) => {
        applyFilter('search', value === "all" ? "" : value)
    }

    // Gérer le changement de date de livraison
    const handleDateLivraisonChange = (date: Date | undefined) => {
        setSelectedDateDebut(date)
        
        if (date) {
            const dateStr = date.toISOString().split('T')[0]
            applyFilter('dateLivraison', dateStr)
        } else {
            applyFilter('dateLivraison', '')
        }
    }


    return (
        <div className="flex flex-col md:flex-row justify-evenly items-center gap-4">
            {/* Filtre par date */}
            <div className="flex justify-evenly items-center gap-2">
                <CalendarInput  
                    value={selectedDateDebut}
                    onChange={handleDateLivraisonChange}
                    placeholder="Date de livraison"
                    className="w-[200px]"
                />
            </div>
            
            {/* Filtre par livreur */}
            <Select onValueChange={handleLivreurChange}>
                <SelectTrigger className="w-[200px]">
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrer par livreur" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Livreurs</SelectLabel>
                        
                        {/* Option pour afficher tous les livreurs */}
                        <SelectItem value="all">
                            Tous les livreurs
                        </SelectItem>
                        
                        {/* Mapping des noms de livreurs uniques */}
                        {livreurNames.map((nomLivreur) => (
                            <SelectItem 
                                key={nomLivreur} 
                                value={nomLivreur}
                            >
                                {nomLivreur}
                            </SelectItem>
                        ))}
                        
                        {/* Message si aucun livreur */}
                        {livreurNames.length === 0 && (
                            <SelectItem value="none" disabled>
                                Aucun livreur disponible
                            </SelectItem>
                        )}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}