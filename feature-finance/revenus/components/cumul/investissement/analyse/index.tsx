"use client"

import { RepartitionPret } from "./repartition/repartition-pret"
import LastInvestissement from "./last-invest/last-invest"
import { useInvestissementList } from "@/feature-finance/revenus/hooks/use-investissement-list";


export default function InvestissementAnalyse() {
   
    const { investissements, isLoading, isError, error } = useInvestissementList();
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
            <div className="lg:col-span-2 mt-4">    
                <RepartitionPret />
            </div>
            <div className="lg:col-span-1">
                <LastInvestissement investissements={investissements} />
            </div>
        </div>
    )
}