
"use client";

import Statistics from "./statistques/statistics";
import RevenusQuotidien from "./repartition/graph_mansuel";
import { useLivraisonList } from "../hooks/use-livraison-list";
import { useCommissionPourcentageList } from "../hooks/use-commissionpourcentage-list";
import RevenusHeader from "@/components/components-finance/revenus/header";

export default function RevenueGeneralClient() {
    const { livraisons } = useLivraisonList({ initialData: [] });
    const { commissionspourcentage } = useCommissionPourcentageList({ initialData: [] });
    return (
        <div>
            <RevenusHeader title="Gestion des revenus"/>
            {/* <FilterRestaurant/> */}
            <Statistics />   
            <RevenusQuotidien />
        </div>
    );
}



