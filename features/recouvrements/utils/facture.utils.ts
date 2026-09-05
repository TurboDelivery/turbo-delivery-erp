/**
 * Le ton d'un statut de facture, sur l'echelle semantique du theme.
 *
 * <p>Les deux fonctions precedentes rendaient d'un cote une variante shadcn
 * (`default` / `secondary` / `destructive`) et de l'autre HUIT classes de palette
 * Tailwind — `bg-green-50 text-green-700 dark:bg-green-950 …` — recopiees pour le mode
 * sombre parce qu'aucune ne suivait le theme. Une seule fonction rend desormais le
 * couple (`color`, `variant`) du `Chip` de la bibliotheque, qui suit le theme seul.</p>
 *
 * <p>« Brouillon » etait peint en ROUGE, la couleur du danger : une facture non encore
 * validee n'est pas une alerte, c'est une etape. Elle passe au ton neutre.</p>
 */
export const getStatutChip = (
  statut: string,
): { color: 'danger' | 'default' | 'success' | 'warning'; variant: 'primary' | 'soft' } => {
  switch (statut?.toUpperCase()) {
    case 'DRAFT':
      return { color: 'default', variant: 'soft' };
    case 'PAID':
      return { color: 'success', variant: 'primary' };
    case 'PARTIAL':
      return { color: 'warning', variant: 'soft' };
    case 'VALIDATED':
      return { color: 'default', variant: 'primary' };
    default:
      return { color: 'default', variant: 'soft' };
  }
};

export const getStatutLabel = (statut: string) => {
  switch (statut?.toUpperCase()) {
    case 'PAID':
      return 'Payée';
    case 'PARTIAL':
      return 'Partiellement payée';
    case 'DRAFT':
      return 'Brouillon';
    case 'VALIDATED':
      return 'Validée - non payée';
    default:
      return statut || 'Inconnu';
  }
};
