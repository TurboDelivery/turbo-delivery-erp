import React, { useMemo } from 'react';
import { useLivreurTicket } from '@/features/tickets/hooks/use-livreur-ticket';
import LivreurCard from '@/components/tickets/livreur/livreur-card';
import { Button, Select as HeroSelect, SelectItem } from '@heroui/react';
import { genererListeSemaines, obtenirKeySemaine } from '@/features/tickets/utils/date.utils';
import { livreursToOptions, useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import Select from 'react-select';
import useRecapPaieLivreurs from '@/features/tickets/hooks/use-recap-paie-livreurs';

function TicketTabLivreur() {
  const { filters, livreurTickets, setLivreurWeekFilter, setLivreurSearch, livreurTicketsMeta, handlePageChange, isLoadingLivreurTickets } = useLivreurTicket();
  const { livreurs, isLoadingLivreurs } = useLivreurs();
  const { exportLivreurRecapPaieToExcel, isLoadingLivreurRecapPaie } = useRecapPaieLivreurs();
  const livreurOptions = useMemo(() => livreursToOptions(livreurs), [livreurs]);

  const weeks = genererListeSemaines();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="sm:w-2/3">
          <Select
            options={livreurOptions}
            value={livreurOptions.find((o) => o.value == filters.idLivreur) ?? null}
            onChange={(opt) => setLivreurSearch(opt?.value)}
            placeholder="Choisir un livreur..."
            isClearable
            className="text-xs"
            classNamePrefix="react-select"
            isLoading={isLoadingLivreurs}
          />
        </div>
        <HeroSelect
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
        </HeroSelect>
        <Button onPress={() => exportLivreurRecapPaieToExcel()} isLoading={isLoadingLivreurRecapPaie} color="success" variant="ghost">
          Exporter récap. paie
        </Button>
      </div>
      <div className="space-y-4">
        {!isLoadingLivreurTickets && livreurTickets.map((livreur) => <LivreurCard key={livreur.id} livreur={livreur} meta={livreurTicketsMeta} onPageChange={handlePageChange} />)}
        {filters.idLivreur &&
          isLoadingLivreurTickets &&
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="w-full border border-gray-200 rounded-lg p-4 bg-white animate-pulse">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="h-4 bg-gray-300 rounded w-3/4 sm:w-1/2"></div>
                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs sm:text-sm">
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        {!filters.idLivreur && <div className="p-4 border border-yellow-300 bg-yellow-50 text-yellow-800 rounded">Veuillez sélectionner un livreur pour afficher ses tickets.</div>}
        {filters.idLivreur && !isLoadingLivreurTickets && livreurTickets.length === 0 && (
          <div className="p-4 border border-gray-200 bg-gray-50 text-gray-800 rounded">Aucun ticket trouvé pour le livreur sélectionné sur la période choisie.</div>
        )}
      </div>
    </div>
  );
}

export default TicketTabLivreur;
