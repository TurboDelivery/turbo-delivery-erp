import { parseAsIsoDate, parseAsInteger, parseAsString } from 'nuqs';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { CycleFiltre } from '../types/responsable-financier.types';

export const cycleOptions: { key: CycleFiltre; label: string }[] = [
  { key: 'TOUT', label: 'Tout' },
  { key: 'QUOTIDIEN', label: 'Quotidien' },
  { key: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
  { key: 'QUINZAINE', label: 'Quinzaine' },
  { key: 'MENSUEL', label: 'Mensuel' },
];

export const responsableFinancierFilters = {
  filter: {
    cycle: parseAsString.withDefault('TOUT'),
    dateDebut: parseAsIsoDate.withDefault(startOfMonth(new Date())),
    dateFin: parseAsIsoDate.withDefault(endOfMonth(new Date())),
    statut: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(20),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
    urlKeys: {
      cycle: 'rfCycle',
      dateDebut: 'rfDebut',
      dateFin: 'rfFin',
      statut: 'rfStatut',
      page: 'rfPage',
      size: 'rfSize',
    },
  },
};
