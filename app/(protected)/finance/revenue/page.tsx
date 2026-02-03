import RevenueGeneralClient from "@/feature-finance/revenus/components/revenu-general-client";
import { prefetchLivraisonListQuery } from "@/feature-finance/revenus/queries/livraison/livraison-list.query";
import { prefetchCommissionPourcentageListQuery } from "@/feature-finance/revenus/queries/commission/commissionpourcentage-list.query";

export default function RevenuePage() {
  return(
    prefetchLivraisonListQuery({
        page: 1,
        limit: 50
    }), 
    prefetchCommissionPourcentageListQuery({
        page: 1,
        limit: 50
    }),
    
    <div>
      <RevenueGeneralClient/>   
    </div>
  )
}