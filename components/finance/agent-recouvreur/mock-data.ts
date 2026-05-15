export type StatutAgentFacture =
  | 'Recouvrement'
  | 'Déposé partenaire'
  | 'Soldé'
  | 'Visé DG'
  | 'Preuve ajoutée';

export interface IFactureAgent {
  id: string;
  numero: string;
  partenaire: string;
  montant: number;
  montantRecouvre: number | null;
  pourcentageRecouvre: number | null;
  cycle: string;
  emission: string;
  depotPartenaire: { date: string; agent: string } | null;
  depotBanque: string | null;
  agent: string;
  statut: StatutAgentFacture;
}

export const MOCK_FACTURES_AGENT: IFactureAgent[] = [
  {
    id: 'a1',
    numero: 'TKT-2026-0212',
    partenaire: 'TURBO EXPRESS SARL',
    montant: 480000,
    montantRecouvre: null,
    pourcentageRecouvre: null,
    cycle: 'Journalier',
    emission: '—',
    depotPartenaire: null,
    depotBanque: null,
    agent: '—',
    statut: 'Recouvrement',
  },
  {
    id: 'a2',
    numero: 'FAC-2026-0142',
    partenaire: 'SOCIÉTÉ ABIDJAN LOGISTICS',
    montant: 1250000,
    montantRecouvre: null,
    pourcentageRecouvre: null,
    cycle: 'Mensuel',
    emission: '2026-04-12',
    depotPartenaire: null,
    depotBanque: null,
    agent: '—',
    statut: 'Recouvrement',
  },
  {
    id: 'a3',
    numero: 'FAC-2026-0143',
    partenaire: 'TURBO EXPRESS SARL',
    montant: 845000,
    montantRecouvre: 400000,
    pourcentageRecouvre: 47,
    cycle: 'Hebdomadaire',
    emission: '2026-04-15',
    depotPartenaire: null,
    depotBanque: null,
    agent: 'Kouamé A.',
    statut: 'Recouvrement',
  },
  {
    id: 'a4',
    numero: 'FAC-2026-0149',
    partenaire: "PORT AUTONOME D'ABIDJAN",
    montant: 6300000,
    montantRecouvre: 2500000,
    pourcentageRecouvre: 40,
    cycle: 'Mensuel',
    emission: '2026-05-04',
    depotPartenaire: { date: '2026-05-08', agent: 'KOUASSI MEDARD' },
    depotBanque: null,
    agent: 'Bamba R.',
    statut: 'Déposé partenaire',
  },
  {
    id: 'a5',
    numero: 'FAC-2026-0144',
    partenaire: 'GROUPE BOLLORÉ CI',
    montant: 3400000,
    montantRecouvre: 3400000,
    pourcentageRecouvre: 100,
    cycle: 'Mensuel',
    emission: '2026-04-18',
    depotPartenaire: { date: '2026-04-22', agent: 'KOUASSI MEDARD' },
    depotBanque: '2026-04-26',
    agent: 'Diabaté F.',
    statut: 'Soldé',
  },
  {
    id: 'a6',
    numero: 'FAC-2026-0078',
    partenaire: 'ORANGE MONEY CI',
    montant: 560000,
    montantRecouvre: 560000,
    pourcentageRecouvre: 100,
    cycle: 'Journalier',
    emission: '2026-03-22',
    depotPartenaire: { date: '2026-03-23', agent: 'KOUASSI MEDARD' },
    depotBanque: '2026-03-24',
    agent: 'Yao M.',
    statut: 'Visé DG',
  },
  {
    id: 'a7',
    numero: 'FAC-2026-0145',
    partenaire: "MTN CÔTE D'IVOIRE",
    montant: 2100000,
    montantRecouvre: 1500000,
    pourcentageRecouvre: 71,
    cycle: 'Bihebdomadaire',
    emission: '2026-04-20',
    depotPartenaire: { date: '2026-04-25', agent: 'KOUASSI MEDARD' },
    depotBanque: '2026-05-01',
    agent: 'Konan E.',
    statut: 'Preuve ajoutée',
  },
];
