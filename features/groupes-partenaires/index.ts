// Barrel du module « Groupes de partenaires » (demande owner 2026-08-04).
// Point d'entrée unique pour les consommateurs extérieurs à la feature.

export * from './types/groupes-partenaires.types';
export * from './apis/groupes-partenaires.api';
export * from './queries/groupes-partenaires.query';
export * from './utils/simulation-groupe.utils';
export { GroupesListePanel } from './components/groupes-liste-panel';
export { GroupeDetailPanel } from './components/groupe-detail-panel';
export { ConstituerGroupeModal } from './components/constituer-groupe-modal';
export { ChangerPrincipalModal } from './components/changer-principal-modal';
export { DetacherEtablissementModal } from './components/detacher-etablissement-modal';
export { RecapitulatifAcces } from './components/recapitulatif-acces';
export { EffetChip, PorteeChip, RoleChip } from './components/acces-chips';
