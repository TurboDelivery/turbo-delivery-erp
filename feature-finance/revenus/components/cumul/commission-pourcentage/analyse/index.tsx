"use client"

import { ICommission } from "@/feature-finance/revenus/types/commission.types";
import CommissionAnalysePourcentageChart from "./graph"
import LastCommissionPourcentage from "./last-commission/last-commission"

interface CommissionAnalysePourcentageChartProps {
    commission: ICommission[];
}

export default function CommissionPourcentageAnalyse({ commission }: CommissionAnalysePourcentageChartProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
            <div className="lg:col-span-2 mt-4">    
                <CommissionAnalysePourcentageChart commission={commission} />
            </div>
            <div className="lg:col-span-1">
                <LastCommissionPourcentage commission={commission} />
            </div>
        </div>
    )
}