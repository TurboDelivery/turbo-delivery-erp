import { IVisaDgaCreneau } from '../types/visa-dga.type';

export const MOCK_VISA_DGA: IVisaDgaCreneau = {
  id: 'creneau-s16-2026',
  code: 'CRÉNEAU-S16-2026',
  debut: '2026-04-13T00:00:00.000Z',
  fin: '2026-04-19T23:59:59.000Z',
  statut: 'SOUMIS_DGA',
  stats: {
    totalLivreurs: 9,
    totalTickets: 142,
    totalBrut: 2_847_500,
    totalNet: 2_604_300,
  },
  livreurs: [
    { id: 'trb-001', nom: 'Ousmane Bah',    code: 'TRB-001', tickets: 12, numeroWave: '+221 77 412 88 01', netAPayer: 8_872,  bonus: false },
    { id: 'trb-002', nom: 'Aliou Diop',     code: 'TRB-002', tickets: 15, numeroWave: '+221 77 555 12 04', netAPayer: 16_110, bonus: false },
    { id: 'trb-003', nom: 'Cheikh Ndiaye',  code: 'TRB-003', tickets: 18, numeroWave: '+221 79 991 02 33', netAPayer: 20_304, bonus: false },
    { id: 'trb-004', nom: 'Mamadou Sy',     code: 'TRB-004', tickets: 21, numeroWave: '+221 76 220 98 11', netAPayer: 28_132, bonus: true  },
    { id: 'trb-005', nom: 'Lamine Fall',    code: 'TRB-005', tickets: 24, numeroWave: '+221 78 220 41 17', netAPayer: 19_864, bonus: false },
    { id: 'trb-006', nom: 'Ibrahima Sow',   code: 'TRB-006', tickets: 16, numeroWave: '+221 77 305 77 42', netAPayer: 14_520, bonus: false },
    { id: 'trb-007', nom: 'Demba Kane',     code: 'TRB-007', tickets: 30, numeroWave: '+221 77 145 67 88', netAPayer: 45_696, bonus: true  },
    { id: 'trb-008', nom: 'Moustapha Diallo', code: 'TRB-008', tickets: 22, numeroWave: '+221 78 640 33 09', netAPayer: 21_780, bonus: false },
    { id: 'trb-009', nom: 'Abdoulaye Niang', code: 'TRB-009', tickets: 19, numeroWave: '+221 76 812 44 56', netAPayer: 17_220, bonus: false },
  ],
  chaineValidation: [
    { numero: 1, label: 'Saisie ticket',              agent: 'Awa Diallo',      statut: 'done'    },
    { numero: 2, label: 'V1 — Vérification croisée',  agent: 'Moussa Touré',    statut: 'done'    },
    { numero: 3, label: 'V2 — Verrouillage créneau',  agent: 'Kader Samassi',   statut: 'done'    },
    { numero: 4, label: 'Comptabilité — Grille générée', agent: 'Fatou Sow',    statut: 'done'    },
    { numero: 5, label: 'Visa DGA',                   agent: 'Vous',            statut: 'current' },
    { numero: 6, label: 'Approbation PDG',            agent: 'Mariam Cissé',    statut: 'pending' },
  ],
};
