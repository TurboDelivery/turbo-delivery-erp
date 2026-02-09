export const getStatutBadgeVariant = (statut: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (statut?.toUpperCase()) {
    case 'PAID':
      return 'default';
    case 'NOT_PAID':
      return 'secondary';
    case 'DRAFT':
      return 'destructive';
    case 'VALIDER':
      return 'default';
    default:
      return 'outline';
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
    case 'VALIDER':
      return 'Validée';
    default:
      return statut || 'Inconnu';
  }
};
