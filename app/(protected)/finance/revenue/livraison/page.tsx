
import LivraisonClient from "@/feature-finance/revenus/components/cumul/livraison/livraison-client";
import { prefetchLivraisonListQuery } from "@/feature-finance/revenus/queries/livraison/livraison-list.query";

export default function RevenueLivraisonPage() {
    prefetchLivraisonListQuery({
        page: 1,
        limit: 50,
    })
    return (
        <div>
            <LivraisonClient />
        </div>
    );
}