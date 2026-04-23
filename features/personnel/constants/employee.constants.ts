export const DEPARTMENTS = [
  { id: '4', name: 'COMMERCIAL' },
  { id: '2', name: 'COMMUNICATION - MARKETING' },
  { id: '3', name: 'DEVELOPPEMENT' },
  { id: '6', name: 'DIRECTION' },
  { id: '9', name: 'INFORMATIQUE' },
  { id: '8', name: 'LOGISTIQUE' },
  { id: '5', name: 'OPERATIONS' },
  { id: '1', name: 'RESSOURCES HUMAINES' },
  { id: '7', name: 'TECHNIQUE' },
] as const;

export const POSTES = [
  "AGENT DE LA CENTRALE D'APPEL",
  'CHEF AUX OPERATIONS',
  'CM - MARKETING',
  'DEVELOPPEUR',
  'DIRECTEUR GENERAL',
  'DIRECTEUR GENERAL ADJOINT',
  'DISPACTHEUSES',
  'DISPATCHERS',
  'ménagère',
  'RESPONSABLE COMPTABLE',
  'RESPONSABLE DES OPERATIONS',
  'RESPONSABLE DES RECOUVREMENTS',
  'SECRETAIRE DE DIRECTION',
  'SERVICE AUTHENTIFICATION ET VERIFICATION DE COUPONS',
  'STANDARDISTE',
  'SUPERVISEURS',
  'Turboy Journalier',
] as const;

export type Department = (typeof DEPARTMENTS)[number];
export type Poste = (typeof POSTES)[number];
