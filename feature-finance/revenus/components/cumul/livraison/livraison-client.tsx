"use client";

import LivraisonList from "./livraison-list/livraison";
import Statistics from "./statistics";
import LivraisonAnalyse from "./analyse";

import FilterRestaurant from "@/feature-finance/revenus/components/filtres/restaurant/filter-restaurant";
import { useLivraisonList } from "@/feature-finance/revenus/hooks/use-livraison-list";
import RevenusHeader from "@/components/components-finance/revenus/header";

export default function LivraisonClient() {
       const { 
            livraisons, 
            isLoading, 
            isError, 
            error,
            handlePageChange,
            handleLimitChange
        } =  useLivraisonList();
        
    // Afficher l'état de chargement
    if (isLoading) {
        return (
            <div>
                <RevenusHeader title="Gestion des revenus sur les livraisons"/>
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement des livraisons...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Afficher l'état d'erreur
    if (isError) {
        return (
            <div>
                <RevenusHeader title="Gestion des revenus sur les livraisons"/>
                <div className="flex justify-center items-center h-64">
                    <div className="text-center max-w-md">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-red-600 mb-2">Erreur de chargement</h3>
                        <p className="text-gray-600 mb-4">Impossible de charger les livraisons: {error instanceof Error ? error.message : "Erreur inconnue"}</p>
                        <p className="text-sm text-gray-500">Vérifiez la console pour plus de détails</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <RevenusHeader title="Gestion des revenus sur les livraisons"/>
            <FilterRestaurant livraisons={livraisons} />
            <Statistics livraisons={livraisons} />   
            <LivraisonAnalyse livraison={livraisons}/>
            <LivraisonList />
        </div>
    );
}