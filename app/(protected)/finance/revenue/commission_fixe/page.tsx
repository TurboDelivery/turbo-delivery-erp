import { prefetchCommissionFixeListQuery } from "@/feature-finance/revenus/queries/commission/commissionfixe-list.query";
import CommissionFixeClient from "@/feature-finance/revenus/components/cumul/commission-fixe/commissison-fixe-client";
export default function RevenueCommissionFixePage() {
    prefetchCommissionFixeListQuery({
        page: 1,
        limit: 10,
    })
    return (
       <CommissionFixeClient/>
    );
}