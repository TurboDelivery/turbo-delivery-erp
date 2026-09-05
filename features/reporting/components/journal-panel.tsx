'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { exporterJournalCsv, IJournalFiltre, useJournalQuery } from '@/features/reporting';
import { VueJournal } from '@/features/reporting/refonte/vue-journal';

/**
 * Le journal transverse (RG-11).
 *
 * <p>La conception et ses raisons sont documentées dans
 * `features/reporting/refonte/vue-journal.tsx`, qui porte le rendu. Ce fichier ne fait
 * plus que la lecture et l'export.</p>
 */
export function JournalPanel() {
  const [filtre, setFiltre] = useState<IJournalFiltre>({
    debut: null,
    fin: null,
    keysearch: '',
    module: [],
    page: 0,
  });

  const { data, isFetching, isLoading } = useJournalQuery(filtre);

  // RG-11 — export CSV de TOUT le jeu filtré (pas seulement la page affichée).
  const [exportEnCours, setExportEnCours] = useState(false);
  const handleExport = async () => {
    setExportEnCours(true);
    try {
      const n = await exporterJournalCsv(filtre);
      if (n === 0) toast.info('Aucune activité à exporter.');
      else toast.success(`${n} ligne${n > 1 ? 's' : ''} exportée${n > 1 ? 's' : ''}.`);
    } catch {
      toast.error("Échec de l'export du journal.");
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <VueJournal
      exportEnCours={exportEnCours}
      filtre={filtre}
      isFetching={isFetching}
      isLoading={isLoading}
      lignes={data?.content ?? []}
      onExporter={() => void handleExport()}
      setFiltre={setFiltre}
      totalPages={data?.totalPages ?? 0}
    />
  );
}
