import React from 'react';
import { useLivreurTicket } from '@/features/tickets/hooks/use-livreur-ticket';
import LivreurCard from '@/components/tickets/livreur/livreur-card';
import { Input, Select, SelectItem } from '@heroui/react';
import { Search } from 'lucide-react';
import { genererListeSemaines, obtenirKeySemaine } from '@/features/tickets/utils/date.utils';

function TicketTabLivreur() {
  const { filters, livreurTickets, setLivreurWeekFilter, setLivreurSearch } = useLivreurTicket();
  const weeks = genererListeSemaines();
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center space-x-4 mb-4">
        <Input className="sm:w-2/3" startContent={<Search />} value={filters.livreur} onChange={(e) => setLivreurSearch(e.target.value)} placeholder="Code check" />
        <Select
          className="w-full sm:w-1/3"
          items={weeks}
          selectedKeys={new Set([obtenirKeySemaine(filters.creneauDebut, filters.creneauFin)])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            setLivreurWeekFilter(value);
          }}
          placeholder="Sélectionner une semaine"
        >
          {weeks.map((week) => (
            <SelectItem key={week.value} value={week.value}>
              {week.label}
            </SelectItem>
          ))}
        </Select>
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
