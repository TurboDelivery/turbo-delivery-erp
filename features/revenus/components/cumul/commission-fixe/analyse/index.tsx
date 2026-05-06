"use client"

import { ICommission } from "@/features/revenus/types/commission.types"
import commissionFixe from "../commission-list/commission-fixe"
import CommissionFixeAnalyseChart from "./graph"
import LastCommissionFixe from "./last-commission-fixe/last-commission-fixe"
import { useCommissionFixeList } from "@/features/revenus/hooks/use-commissionfixe-list"


export default function CommissionFixeAnalyse() {
    const { commissionsfixe } = useCommissionFixeList({ initialData: [] })
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
            <div className="lg:col-span-2 mt-4">
                <CommissionFixeAnalyseChart commissionFixe={commissionsfixe} />
            </div>
            <div className="lg:col-span-1">
                <LastCommissionFixe />
            </div>
        </div>
    )
}