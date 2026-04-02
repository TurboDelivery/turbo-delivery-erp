import {
  S_APPROUVE, S_EN_ATTENTE_DGA, S_EN_ATTENTE_DG,
  S_VUE_DGA, S_VERIFIE_DGA, S_DECAISSE, S_REJETE_DGA, S_REJETE_DG,
} from './validation.constants';

export function TypeBadge({ type }: { type: string }) {
  const t = (type ?? '').toUpperCase();
  const cls =
    t === 'VARIABLE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : t === 'PAIE'   ? 'bg-blue-100   text-blue-700   border-blue-200'
                     : 'bg-gray-100   text-gray-700   border-gray-200';
  return (
    <span className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {t || 'N/A'}
    </span>
  );
}

export function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    [S_APPROUVE]:       'bg-green-100  text-green-600',
    [S_EN_ATTENTE_DGA]: 'bg-yellow-100 text-yellow-600',
    [S_EN_ATTENTE_DG]:  'bg-yellow-100 text-yellow-600',
    [S_VUE_DGA]:        'bg-blue-100   text-blue-600',
    [S_VERIFIE_DGA]:    'bg-blue-100   text-blue-600',
    [S_DECAISSE]:       'bg-gray-100   text-gray-600',
    [S_REJETE_DGA]:     'bg-red-100    text-red-600',
    [S_REJETE_DG]:      'bg-red-100    text-red-600',
    PAID:               'bg-green-100  text-green-600',
    PENDING:            'bg-gray-100   text-gray-600',
  };
  const cls = map[statut] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{statut}</span>
  );
}
