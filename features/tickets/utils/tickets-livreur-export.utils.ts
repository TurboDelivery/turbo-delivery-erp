import { ILivreurTicket } from '@/features/tickets/types/tickets.type';

type IReleveDePaieTicket = {
  id: string;
  codeCheck: string;
  coutLivraison: number;
  dateLivraison: string;
  restaurant: string;
};

type IReleveDePaieRestaurant = {
  restaurant: string;
  tickets: IReleveDePaieTicket[];
  totalCoutLivraison: number;
};

type IReleveDePaieJour = {
  date: string;
  restaurants: IReleveDePaieRestaurant[];
  totalJour: number;
};

export interface IReleveDePaie {
  livreur: string;
  ticketsParJour: IReleveDePaieJour[];
  totalGeneral: number;
  nombreJoursTravailles: number;
  pourcentageApplicable: number;
  gain: number;
  deduction: number;
  netAPayer: number;
}

/**
 * Regroupe les tickets par jour et par restaurant
 * @param {Object} livreurData - Les données du livreur avec ses tickets
 * @returns {Array} Tickets regroupés par jour et restaurant
 */
function regrouperTicketsParJourEtRestaurant(livreurData: ILivreurTicket): IReleveDePaieJour[] {
  return livreurData.tickets.map((journee) => {
    // Regrouper par restaurant pour chaque jour
    const ticketsParRestaurant: { [key: string]: IReleveDePaieRestaurant } = {};

    journee.tickets.forEach((ticket) => {
      const restaurant = ticket.restaurant;

      if (!ticketsParRestaurant[restaurant]) {
        ticketsParRestaurant[restaurant] = {
          restaurant: restaurant,
          tickets: [],
          totalCoutLivraison: 0,
        };
      }

      ticketsParRestaurant[restaurant].tickets.push({
        restaurant: ticket.restaurant,
        dateLivraison: '',
        id: ticket.id || '',
        codeCheck: ticket.reference || '',
        coutLivraison: parseFloat(ticket.coutLivraison ?? 0),
      });
      ticketsParRestaurant[restaurant].totalCoutLivraison += parseFloat(ticket.coutLivraison ?? 0);
    });

    // Convertir l'objet en tableau
    const restaurantsArray = Object.values(ticketsParRestaurant);

    // Calculer le total du jour
    const totalJour = restaurantsArray.reduce((sum, resto) => sum + resto.totalCoutLivraison, 0);

    return {
      date: journee.jour,
      restaurants: restaurantsArray,
      totalJour: totalJour,
    };
  });
}

/**
 * Calcule le total général et le nombre de jours travaillés
 * @param {Array} ticketsParJour - Tickets regroupés par jour
 * @returns {Object} Statistiques globales
 */
function calculerStatistiques(ticketsParJour: IReleveDePaieJour[]) {
  const totalGeneral = ticketsParJour.reduce((sum, jour) => sum + jour.totalJour, 0);

  const nombreJoursTravailles = ticketsParJour.length;

  return {
    totalGeneral,
    nombreJoursTravailles,
  };
}

/**
 * Formate les données pour l'affichage (style PDF)
 * @param {Object} livreurData - Les données du livreur
 * @param {Number} pourcentageApplicable - Pourcentage à appliquer (ex: 0.6 pour 60%)
 * @param {Number} deduction - Montant de la déduction
 * @returns {Object} Données formatées pour le relevé de paie
 */
export function genererReleveDePaie(livreurData: ILivreurTicket, pourcentageApplicable = 0.6, deduction = 10000): IReleveDePaie {
  const ticketsParJour = regrouperTicketsParJourEtRestaurant(livreurData);
  const stats = calculerStatistiques(ticketsParJour);

  const gain = stats.totalGeneral * pourcentageApplicable;
  const netAPayer = gain - deduction;

  return {
    livreur: livreurData.livreur,
    ticketsParJour: ticketsParJour,
    totalGeneral: stats.totalGeneral,
    nombreJoursTravailles: stats.nombreJoursTravailles,
    pourcentageApplicable: pourcentageApplicable,
    gain: gain,
    deduction: deduction,
    netAPayer: netAPayer,
  };
}
