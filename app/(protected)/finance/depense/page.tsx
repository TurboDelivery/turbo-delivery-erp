import DepensePageContent from '@/features/depenses/components/depense-page-content';
import { prefetchDepensesListQuery } from '@/features/depenses/queries/depense-list.query';
import { prefetchCategoriesDepensesListQuery } from '@/features/depenses/queries/category/categorie-depense.query';

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

