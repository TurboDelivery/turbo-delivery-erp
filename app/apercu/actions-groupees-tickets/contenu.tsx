'use client';

import React from 'react';

import { TicketTableActions } from '@/components/tickets/table/ticket-table-actions';
import type { Ticket } from '@/types/bon-livraison.model';

/**
 * La barre d'actions groupées de « Tickets & paie / Saisie de tickets », montée seule.
 *
 * <p>Elle ne s'atteint qu'après connexion, sur un tableau chargé, et ses états
 * dépendent de la SÉLECTION et des DROITS du compte : les voir tous demanderait quatre
 * comptes et autant de jeux de données. Ce banc monte le vrai composant et lui pose les
 * états à la main.</p>
 *
 * <p>Ce qu'il sert à vérifier : que le bouton d'authentification compte les lignes
 * AUTHENTIFIABLES et non les lignes sélectionnées, et que chaque grisage nomme la cause
 * qui bloque vraiment. Un bouton éteint sans motif est ce qui fait croire à une panne.</p>
 */

const AUCUN_TICKET: Ticket[] = [];

interface Cas {
  titre: string;
  explication: string;
  selectedRows: string[];
  selectedRowsAAuthentifier: string[];
  permissions: { canDelete: boolean; canAuthentifier: boolean };
  isDeletingBonLivraison: boolean;
  isAuthentifying: boolean;
}

const TOUS_LES_DROITS = { canDelete: true, canAuthentifier: true };

const CAS: Cas[] = [
  {
    titre: 'Rien de sélectionné',
    explication:
      'Les deux boutons sont éteints, et chacun dit lequel des deux motifs le bloque.',
    selectedRows: [],
    selectedRowsAAuthentifier: [],
    permissions: TOUS_LES_DROITS,
    isDeletingBonLivraison: false,
    isAuthentifying: false,
  },
  {
    titre: 'Douze lignes, toutes authentifiables',
    explication: 'Les deux boutons annoncent le même nombre.',
    selectedRows: Array.from({ length: 12 }, (_, i) => `t${i}`),
    selectedRowsAAuthentifier: Array.from({ length: 12 }, (_, i) => `t${i}`),
    permissions: TOUS_LES_DROITS,
    isDeletingBonLivraison: false,
    isAuthentifying: false,
  },
  {
    titre: 'Quarante lignes dont douze authentifiables',
    explication:
      'Le cas qui comptait : vingt-huit lignes sont déjà authentifiées ou rejetées pour fraude. '
      + '« Supprimer 40 » et « Authentifier 12 » ne peuvent pas annoncer le même nombre.',
    selectedRows: Array.from({ length: 40 }, (_, i) => `t${i}`),
    selectedRowsAAuthentifier: Array.from({ length: 12 }, (_, i) => `t${i}`),
    permissions: TOUS_LES_DROITS,
    isDeletingBonLivraison: false,
    isAuthentifying: false,
  },
  {
    titre: 'Sélection sans aucune ligne authentifiable',
    explication:
      'Le plus déroutant : l’opérateur a bien coché des lignes et le bouton reste éteint. '
      + 'L’info-bulle doit dire pourquoi.',
    selectedRows: Array.from({ length: 6 }, (_, i) => `t${i}`),
    selectedRowsAAuthentifier: [],
    permissions: TOUS_LES_DROITS,
    isDeletingBonLivraison: false,
    isAuthentifying: false,
  },
  {
    titre: 'Rôle sans le droit d’authentifier',
    explication: 'Le droit passe avant la sélection dans le motif annoncé.',
    selectedRows: Array.from({ length: 9 }, (_, i) => `t${i}`),
    selectedRowsAAuthentifier: Array.from({ length: 9 }, (_, i) => `t${i}`),
    permissions: { canDelete: true, canAuthentifier: false },
    isDeletingBonLivraison: false,
    isAuthentifying: false,
  },
  {
    titre: 'Authentification en cours',
    explication:
      'Le bouton porte son attente. La suppression reste accessible, les deux opérations '
      + 'ne se gênent pas.',
    selectedRows: Array.from({ length: 9 }, (_, i) => `t${i}`),
    selectedRowsAAuthentifier: Array.from({ length: 9 }, (_, i) => `t${i}`),
    permissions: TOUS_LES_DROITS,
    isDeletingBonLivraison: false,
    isAuthentifying: true,
  },
];

export default function ApercuActionsGroupeesTickets() {
  const [sombre, setSombre] = React.useState(false);

  React.useEffect(() => {
    // ⚠ HeroUI v3 lit le thème sur <html>, pas sur un conteneur : un banc qui pose la
    // classe sur une div ne bascule rien.
    document.documentElement.classList.toggle('dark', sombre);
    return () => document.documentElement.classList.remove('dark');
  }, [sombre]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            Actions groupées — saisie de tickets
          </h1>
          <button
            className="rounded-medium border border-separator px-3 py-1.5 text-sm text-foreground"
            onClick={() => setSombre((v) => !v)}
            type="button"
          >
            {sombre ? 'Thème clair' : 'Thème sombre'}
          </button>
        </div>

        {CAS.map((cas) => (
          <section
            className="flex flex-col gap-1 rounded-large border border-separator bg-surface px-4"
            key={cas.titre}
          >
            <h2 className="pt-3 text-[11px] font-medium uppercase tracking-wide text-muted">
              {cas.titre}
            </h2>
            <p className="text-sm text-muted">{cas.explication}</p>
            <TicketTableActions
              isAuthentifying={cas.isAuthentifying}
              isDeletingBonLivraison={cas.isDeletingBonLivraison}
              onAuthentifierRows={() => {}}
              onDeleteRows={() => {}}
              permissions={cas.permissions}
              selectedRows={cas.selectedRows}
              selectedRowsAAuthentifier={cas.selectedRowsAAuthentifier}
              ticketsData={AUCUN_TICKET}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
