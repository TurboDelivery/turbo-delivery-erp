"use client"
import { useMemo } from "react";
import { useRecouvrementList } from "./use-recouvrement";

export function useRestaurants() {
    const { recouvrement } = useRecouvrementList();

    // Extraire les noms de restaurants uniques à partir des données de recouvrement
    const restaurants = useMemo(() => {
        if (!recouvrement || recouvrement.length === 0) {
            return [];
        }
        
        const uniqueRestaurants = Array.from(
            new Set(recouvrement.map(rec => rec.nomRestaurant).filter(Boolean))
        ).sort();
        
        return uniqueRestaurants;
    }, [recouvrement]);

    return {
        restaurants,
        isLoading: false, // Pas de chargement supplémentaire
        error: null
    };
}
