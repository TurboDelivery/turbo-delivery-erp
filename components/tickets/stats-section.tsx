'use client';
import React from 'react';
import { Coins, Percent, Ticket, Bike, Store } from 'lucide-react';

import { useTicketsStats } from '@/features/tickets/hooks/use-tickets-stats';
import { formatMontant, formatNombre } from '@/utils/format.utils';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';

/**
 * Bandeau de statistiques de l'ecran Tickets.
 *
 * <p>Premier bandeau migre vers `CarteStat`, la carte unique. Il portait sa propre
 * implementation (`TicketStatsCard`), l'une des 17 que comptait l'ERP.</p>
 *
 * <p>Trois defauts corriges au passage :</p>
 * <ul>
 *   <li>l'echec de chargement s'affichait sur une ligne de texte rouge, sans moyen de
 *       reessayer ; il passe par `EtatErreur`, comme partout ailleurs desormais ;</li>
 *   <li>`formatCFA` rendait « 0 » NU sur une valeur nulle, donc un chiffre d'affaires a
 *       zero perdait sa devise pendant que ses voisins l'affichaient ;</li>
 *   <li>la premiere carte etait un degrade orange ecrit en dur, seule de son espece dans
 *       tout l'ERP. Elle prend la couleur primaire de la marque, par jeton.</li>
 * </ul>
 */
function StatsSection() {
  const { ticketsStats, isError, isLoading, refetch } = useTicketsStats();

  if (isError) {
    return (
      <div className="mb-6 lg:mb-4">
        <EtatErreur quoi="les statistiques des tickets" onReessayer={refetch} />
      </div>
    );
  }

  return (
    <GrilleStats colonnes={5} className="mb-6 lg:mb-4">
      <CarteStat
        libelle="Frais de livraison totaux"
        valeur={formatMontant(ticketsStats?.totalRevenus ?? 0)}
        icone={Coins}
        ton="primaire"
        accent
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Total des commissions"
        valeur={formatMontant(ticketsStats?.totalCommissions ?? 0)}
        icone={Percent}
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Total tickets"
        valeur={formatNombre(ticketsStats?.totalTickets ?? 0)}
        icone={Ticket}
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Livreurs"
        valeur={formatNombre(ticketsStats?.totalLivreurs ?? 0)}
        icone={Bike}
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Partenaires"
        valeur={formatNombre(ticketsStats?.totalPartenaires ?? 0)}
        icone={Store}
        isLoading={isLoading}
      />
    </GrilleStats>
  );
}

export default StatsSection;
