import DepensePageContent from '@/feature-finance/depenses/components/depense-page-content';
import { prefetchDepensesListQuery } from '@/feature-finance/depenses/queries/depense-list.query';
import { prefetchCategoriesDepensesListQuery } from '@/feature-finance/depenses/queries/category/categorie-depense.query';

export default async function DepensePage() {
  await Promise.all([
    prefetchDepensesListQuery({
      page: 1,
      limit: 10,
    }),
    prefetchCategoriesDepensesListQuery({
      page: 1,
      limit: 10,
    }),
  ]);

  return <DepensePageContent />;
}
