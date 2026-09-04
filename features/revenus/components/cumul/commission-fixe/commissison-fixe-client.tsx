"use client";

import CommissionFixeAnalyse from "./analyse";
import Statistics from "./statistics";
import CommissionFixe from "./commission-list/commission-fixe";
import RevenusHeader from "@/components/components-finance/revenus/header";
import { useCommissionFixeList } from "@/features/revenus/hooks/use-commissionfixe-list";

export default function CommissionFixeClient() {
    const { 
        commissionsfixe,
        isLoading,
        isError,
    } =  useCommissionFixeList();
    return (
        <div>
            <RevenusHeader title="Gestion des revenus sur les commission fixe" />
            {/* <FilterRestaurant/> */}
            <Statistics commissionFixe={commissionsfixe} isError={isError} isLoading={isLoading} />
            <CommissionFixeAnalyse />
            <CommissionFixe />

        </div>
    );
}