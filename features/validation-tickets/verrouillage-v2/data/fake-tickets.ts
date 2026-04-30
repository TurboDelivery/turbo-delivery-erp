export interface TicketV2 {
  id: string;
  ref: string;
  restaurant: string;
  amount: string;
  status: 'Authentifié' | 'En attente';
}

export const fakeReadyTickets: TicketV2[] = [
  { id: '1', ref: '#0139981', restaurant: 'ATANDA GANIOU · HOT BAYTS', amount: '1 000 CFA', status: 'Authentifié' },
  { id: '2', ref: '#0139146', restaurant: 'ATANDA GANIOU · LE PETIT CAFÉ', amount: '800 CFA', status: 'Authentifié' },
  { id: '3', ref: '#0139143', restaurant: 'ATANDA GANIOU · LE PETIT CAFÉ', amount: '500 CFA', status: 'Authentifié' },
  { id: '4', ref: '#1375694', restaurant: 'MAGIJI CONSETANT · AGHA', amount: '800 CFA', status: 'Authentifié' },
  { id: '5', ref: '#1375816', restaurant: 'MAGIJI CONSETANT · AGHA', amount: '2 500 CFA', status: 'Authentifié' },
  { id: '6', ref: '#0813942', restaurant: 'AKA Jean · TAYBÀ ZONE 4', amount: '500 CFA', status: 'Authentifié' },
  { id: '7', ref: '#YAN0001', restaurant: "YANO FRANCK · BRO'S BURGER", amount: '1 500 CFA', status: 'Authentifié' },
];
