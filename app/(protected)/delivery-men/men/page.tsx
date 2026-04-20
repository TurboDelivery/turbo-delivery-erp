import { Metadata } from 'next';
import { getAllDemandeAssignations, getToutLivreurStatus, getTurboyCount } from '@/src/actions/delivery-men.actions';
import { allRestaurants } from '@/src/restaurants/restaurants.actions';
import Content from './content';

export const metadata: Metadata = {
  title: 'Coursiers',
};

export default async function MenPage() {
  const [totalData, journalierCount, independantCount, demandes, restaurants] = await Promise.all([
    getToutLivreurStatus(0, 1),
    getTurboyCount('JOURNALIER'),
    getTurboyCount('INDEPENDANT'),
    getAllDemandeAssignations(),
    allRestaurants(),
  ]);

  return (
    <Content
      totalCount={totalData?.totalElements ?? 0}
      journalierCount={journalierCount}
      independantCount={independantCount}
      demandesCount={demandes?.length ?? 0}
      demandes={demandes ?? []}
      restaurants={restaurants ?? []}
    />
  );
}
