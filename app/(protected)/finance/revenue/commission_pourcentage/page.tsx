"use client";


import Statistics from "@/features/revenus/components/cumul/commission-pourcentage/statistics";
// import FilterRestaurant from "@/feature/revenus/components/filtres/restaurant/filter-restaurant";
import CommissionPourcentageList from "@/features/revenus/components/cumul/commission-pourcentage/commission-list/commission-pourcentage-list";
import { prefetchCommissionPourcentageListQuery } from "@/features/revenus/queries/commission/commissionpourcentage-list.query";
import { useCommissionPourcentageList } from "@/features/revenus/hooks/use-commissionpourcentage-list";
import CommissionPourcentageAnalyse from "@/features/revenus/components/cumul/commission-pourcentage/analyse";
import RevenusHeader from "@/components/components-finance/revenus/header";

export default function RevenueCommissionPourcentagePage() {
    const { 
        commissionspourcentage, 
    } =  useCommissionPourcentageList();
    prefetchCommissionPourcentageListQuery({
        page: 1,
        limit: 10,
    })
    return (
        <div>
            <RevenusHeader title="Gestion des revenus sur les commission pourcentage" />
            {/* <FilterRestaurant /> */}
            <Statistics commissionvariable={commissionspourcentage} />
            <CommissionPourcentageAnalyse commission={commissionspourcentage} />
            <CommissionPourcentageList commissionvariable={commissionspourcentage} />
        </div>
    );
}