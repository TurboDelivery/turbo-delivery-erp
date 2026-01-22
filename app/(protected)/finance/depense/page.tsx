import DepenseClient from "@/feature-finance/depenses/components/depense-client";
import { prefetchDepensesListQuery } from "@/feature-finance/depenses/queries/depense-list.query";
import { prefetchCategoriesDepensesListQuery } from "@/feature-finance/depenses/queries/category/categorie-depense.query";

export default async function DepensePage() {
    // Précharger les données
    await Promise.all([
        // prefetchDepenseStatsQuery(),
        prefetchDepensesListQuery({
            page: 1,
            limit: 10,
        }),
        prefetchCategoriesDepensesListQuery({
            params: {
                page: 1,
                limit: 10,
            },
        }),         
    ]);

    return <DepenseClient />;
}