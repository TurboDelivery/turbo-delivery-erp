export interface RegularisationTicket {
  id: string;
  ref: string;
  livreur: string;
  restaurant: string;
  montantCmd: string;
  montantLivraison: string;
  coutLivraison: string;
  date: string;
  time: string;
  motif: string;
}

export const fakeRegularisationTickets: RegularisationTicket[] = [
  {
    id: '1',
    ref: '0139143',
    livreur: 'MAGIJI CONSETANT',
    restaurant: 'AGHA',
    montantCmd: '1 000 CFA',
    montantLivraison: '1 000 CFA',
    coutLivraison: '500 CFA',
    date: '2026-04-22',
    time: '14:28',
    motif: "Ticket enregistré après l'heure limite. Une approbation manuelle est requise pour intégrer ce ticket au flux de paiement.",
  },
  {
    id: '2',
    ref: '0139142',
    livreur: 'AKA Jean',
    restaurant: 'EBRANDS',
    montantCmd: '500 CFA',
    montantLivraison: '500 CFA',
    coutLivraison: '200 CFA',
    date: '2026-04-22',
    time: '17:49',
    motif: "Ticket saisi hors créneau autorisé. Vérification manuelle obligatoire avant validation.",
  },
  {
    id: '3',
    ref: '0139141',
    livreur: 'YANO FRANCK',
    restaurant: 'HOT BAYTS',
    montantCmd: '1 000 CFA',
    montantLivraison: '1 000 CFA',
    coutLivraison: '400 CFA',
    date: '2026-04-22',
    time: '12:10',
    motif: "Délai de saisie dépassé. Approbation requise pour maintenir la traçabilité du ticket.",
  },
];
