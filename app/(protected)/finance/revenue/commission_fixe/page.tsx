import { prefetchCommissionFixeListQuery } from "@/features/revenus/queries/commission/commissionfixe-list.query";
import CommissionFixeClient from "@/features/revenus/components/cumul/commission-fixe/commissison-fixe-client";
export default function RevenueCommissionFixePage() {
    prefetchCommissionFixeListQuery({
        page: 1,
        limit: 10,
    })
    return (
       <CommissionFixeClient/>
    );
}