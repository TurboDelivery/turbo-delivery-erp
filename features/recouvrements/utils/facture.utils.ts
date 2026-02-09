export const getStatutBadgeVariant = (statut: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (statut?.toUpperCase()) {
    case 'PAID':
      return 'default';
    case 'NOT_PAID':
      return 'secondary';
    case 'DRAFT':
      return 'destructive';
    case 'VALIDATED':
      return 'default';
    default:
      return 'outline';
  }
};

export const getStatutColor = (statut: string): string => {
  switch (statut?.toUpperCase()) {
    case 'PAID':
      return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300';
    case 'NOT_PAID':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
    case 'DRAFT':
      return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
    case 'VALIDATED':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    default:
      return '';
  }
};

export const getStatutLabel = (statut: string) => {
  switch (statut?.toUpperCase()) {
    case 'PAID':
      return 'Payée';
    case 'NOT_PAID':
      return 'Non payée';
    case 'DRAFT':
      return 'Brouillon';
    case 'VALIDATED':
      return 'Validée';
    default:
      return statut || 'Inconnu';
  }
};
