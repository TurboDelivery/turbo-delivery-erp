import { StatutVisaDga } from '../types/visa-dga.type';

const map: Record<StatutVisaDga, { label: string; className: string }> = {
  EN_ATTENTE:      { label: 'EN ATTENTE',      className: 'bg-gray-200 text-gray-600' },
  CALCUL_EN_COURS: { label: 'CALCUL EN COURS',  className: 'bg-blue-100 text-blue-700' },
  SOUMIS_DGA:      { label: 'SOUMIS DGA',       className: 'bg-amber-500 text-white' },
  VISE:            { label: 'VISÉ',             className: 'bg-green-500 text-white' },
  REJETE:          { label: 'REJETÉ',           className: 'bg-red-500 text-white' },
};

export default function VisaDgaStatutBadge({ statut }: { statut: StatutVisaDga }) {
  const { label, className } = map[statut];
  return (
    <span className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}
