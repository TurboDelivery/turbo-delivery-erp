import React from 'react';
import Select from 'react-select';
import { useLivreurTicket } from '@/features/tickets/hooks/use-livreur-ticket';
import LivreurCard from '@/components/tickets/livreur/livreur-card';

type TicketTabLivreurProps = {
  livreurOptions: { value: string; label: string }[];
};

function TicketTabLivreur({ livreurOptions }: TicketTabLivreurProps) {
  const { filters, setFilter, livreurTickets } = useLivreurTicket();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <label className="block text-xs font-medium mb-2">Sélectionner un livreur</label>
        <Select
          options={livreurOptions}
          value={livreurOptions.find((o) => o.value === filters.livreurId) ?? null}
          onChange={(opt) => setFilter('livreurId', opt?.value ?? '')}
          placeholder="Tous les livreurs"
          isClearable
          className="text-xsbg-amber-400"
          classNamePrefix="react-select"
        />
      </div>

      <div className="space-y-4">
        {livreurTickets.map((livreur) => (
          <LivreurCard key={livreur.id} livreur={livreur} />
        ))}
      </div>
    </div>
  );
}

export default TicketTabLivreur;
