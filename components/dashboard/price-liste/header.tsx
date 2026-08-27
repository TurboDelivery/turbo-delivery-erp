'use client';
import { title } from '@/components/primitives';
import { ArrowDownToLine, Plus } from 'lucide-react';
import { Button } from '@/components/heroui';
import { useState } from 'react';
import { Restaurant } from '@/types/models';
import TextInputToUrl from './searchDelivery';
import PriceListFormModal from './price-list-form-modal';

export default function Header({ initialData }: { initialData: Restaurant[] | null }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className={title({ size: 'h3', class: 'text-primary' })}>Gestions des frais de livraison</h1>
      </div>

      <div className="py-6 flex items-center justify-between">
        <div className="relative">
          <TextInputToUrl />
        </div>

        <div className="flex pt-0 flex-wrap gap-2 sm:pt-4 lg:pt-0 md:pt-0 xl:pt-0">
          <Button variant="bordered" endContent={<ArrowDownToLine />}>
            Exporter
          </Button>
          <Button color="danger" endContent={<Plus />} onPress={() => setCreateOpen(true)}>
            Ajouter
          </Button>
        </div>
      </div>

      <PriceListFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
