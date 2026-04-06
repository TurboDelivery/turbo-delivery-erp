import { Suspense } from 'react';
import ChargesDepensesDetailsV2 from '@/feature-finance/charges/components/charges-depenses-details-v2';

export default function ChargesDetailsPage() {
  return (
    <Suspense>
      <ChargesDepensesDetailsV2 />
    </Suspense>
  );
}
