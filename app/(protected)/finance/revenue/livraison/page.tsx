
import LivraisonClient from "@/features/revenus/components/cumul/livraison/livraison-client";
import { prefetchLivraisonListQuery } from "@/features/revenus/queries/livraison/livraison-list.query";

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