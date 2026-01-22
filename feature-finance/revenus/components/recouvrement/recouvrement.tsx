"use client"
import { useMemo } from "react"

import DetailRecouvrement from "./detail"
import { RepartionPieDonutRecouvrement } from "./repartition"
import { useRecouvrementList } from "@/feature-finance/revenus/hooks/use-recouvrement"
import { usePretList } from "@/feature-finance/revenus/hooks/use-pret-list"

export default function Recouvrement() {
    const { recouvrement: recouvrementsData, handleFilterChange } = useRecouvrementList();
    const { facture: facturesData, handleFilterChange: handlePretFilterChange } = usePretList();
    
    // Gérer les données paginées pour les recouvrements
    const recouvrements = useMemo(() => {
        if (!recouvrementsData) return [];
        if (Array.isArray(recouvrementsData)) return recouvrementsData;
        return recouvrementsData || [];
    }, [recouvrementsData]);
    
    // Gérer les données paginées pour les factures
    const factures = useMemo(() => {
        if (!facturesData) return [];
        if (Array.isArray(facturesData)) return facturesData;
        return facturesData || [];
    }, [facturesData]);
    
    const handleFiltersChange = (filterName: string, value: any) => {
        // Appliquer le filtre aux deux hooks
        handleFilterChange(filterName, value);
        handlePretFilterChange(filterName, value);
    };

    return (
        <div className="w-full px-4 py-6 space-y-6">
            {/* Filtre global
            <div className="flex justify-center">
                <RecouvrementGlobalFilter onFiltersChange={handleFiltersChange} />
            </div> */}
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr] gap-6 justify-center items-stretch">
                {/* Partie gauche - plus étroite */}
                <div className="min-h-[300px] sm:min-h-[350px]">
                    <RepartionPieDonutRecouvrement 
                        recouvrements={recouvrements} 
                        factures={factures} 
                    />
                </div>
                
                {/* Partie droite - plus large */}
                <div className="min-h-[300px] sm:min-h-[350px]">
                    <DetailRecouvrement 
                        recouvrements={recouvrements} 
                        factures={factures} 
                    />
                </div>
            </div>
        </div> 
    )
}