import { Suspense } from 'react';

import { FacturationPlageView } from '@/components/finance/facturation-plage/facturation-plage-view';

export default function FacturationPlagePage() {
  // useSearchParams impose une frontière de Suspense en app router.
  return (
    <Suspense>
      <FacturationPlageView />
    </Suspense>
  );
}
