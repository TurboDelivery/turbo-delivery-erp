'use client';

import React from 'react';
import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ImportTicketsView, type IApiImportTickets } from '@/components/tickets/import/import-tickets-view';
import { importTicketsKeys } from '@/features/tickets/import/import-tickets.query';
import type { IVerdictImport } from '@/features/tickets/import/import-tickets.request';
import { ticketsKeyQuery } from '@/features/tickets/queries/index.query';

/**
 * Le banc de l'IMPORT DE TICKETS.
 *
 * <h3>Ce qu'on vient regarder</h3>
 * <ul>
 *   <li>qu'une feuille de terrain réelle — en-tête en ligne 5, montants « 1 000CFA »,
 *       dates au format jour/mois — soit reconnue sans un geste ;</li>
 *   <li>que les décisions se posent par VALEUR et pas par ligne ;</li>
 *   <li>que l'avertissement TARDIF se voie, puisque c'est lui qui engage la paie ;</li>
 *   <li>que les refus soient groupés par motif et nomment leurs lignes.</li>
 * </ul>
 *
 * <h3>⚠ Rien ne part sur le réseau depuis ce banc</h3>
 * <p>L'environnement local de ce projet pointe sur la PRODUCTION. Un banc qui laisserait
 * passer l'enregistrement créerait de vrais tickets, donc de la paie livreur et des
 * factures partenaires, d'un clic. Les deux appels sont donc des doublures locales, et
 * le reste de l'écran est le vrai.</p>
 *
 * <p>Le fichier est chargé par un VRAI événement sur l'entrée de fichier, avec un vrai
 * classeur xlsx fabriqué dans le navigateur : c'est le chemin qu'emprunte l'opérateur,
 * SheetJS compris, et non un raccourci qui sauterait précisément le code qu'on veut voir
 * fonctionner.</p>
 */

/** Trois partenaires, dont un avec deux zones au même prix et un avec des prix distincts. */
const PARTENAIRES = [
  { id: 'r1', nomEtablissement: 'AGHA' },
  { id: 'r2', nomEtablissement: 'CHICKEN NATION ZONE 4' },
  { id: 'r3', nomEtablissement: 'HOT BAYTS' },
];

const LIVREURS = [
  { deleted: false, id: 'l1', nom: 'KRAH', prenoms: 'Éric', status: 1 },
  { deleted: false, id: 'l2', nom: "N'DRI", prenoms: 'JEAN JACQUES', status: 1 },
  { deleted: false, id: 'l3', nom: 'SIDY', prenoms: 'MOHAMED', status: 1 },
  { deleted: false, id: 'l4', nom: 'OBOU', prenoms: 'Melaine', status: 1 },
  // Désactivé : l'écran doit le montrer grisé, pas le cacher.
  { deleted: false, id: 'l5', nom: 'SEKA', prenoms: 'FRANCK', status: 5 },
];

/** Les grilles tarifaires, calquées sur ce qu'on mesure en production. */
const GRILLES: Record<string, { commission: number; id: string; name: string; prix: number }[]> = {
  r1: [
    // Deux zones à 1 000, même commission : le choix ne change pas le montant.
    { commission: 200, id: 'z1', name: 'ZONE 4 | BIÉTRY', prix: 1000 },
    { commission: 200, id: 'z2', name: 'MARCORY RÉSIDENTIEL', prix: 1000 },
    // Deux zones à 2 500, commissions DIFFÉRENTES : ce choix déplace de l'argent.
    { commission: 500, id: 'z3', name: 'AÉROPORT | VRIDI', prix: 2500 },
    { commission: 900, id: 'z4', name: 'KOUMASSI 05/CAMP', prix: 2500 },
  ],
  r2: [{ commission: 300, id: 'z5', name: 'II PLATEAUX | PALMERAIE', prix: 1500 }],
  r3: [{ commission: 200, id: 'z6', name: 'ZONE 4 | BIÉTRY', prix: 1000 }],
};

/** La feuille de suivi du réseau : quatre lignes de décoration avant l'en-tête. */
const FEUILLE_TERRAIN: string[][] = [
  ['DATA TURBO DELIVERY — JUIN 2024'],
  [],
  ['Bon de livraison'],
  [],
  ['ID', 'Référence', 'Livreur', 'Restaurant', 'Coût livraison', 'Coût commande', 'Date', 'Heure', 'Auth'],
  ['1', '993025', 'KRAH Éric', 'AGHA', '1 000CFA', '12 500CFA', '01/06/2024', '21:45:00', ''],
  ['2', '992863', 'KRAH Éric', 'AGHA', '1 000CFA', '14 000CFA', '01/06/2024', '20:17:00', ''],
  ['3', '993129', "N'DRI JEAN JACQUES", 'AGHA', '2 500CFA', '4 500CFA', '01/06/2024', '23:29:00', ''],
  ['4', '992746', "N'DRI JEAN JACQUES", 'AGHA', '1 000CFA', '11 000CFA', '01/06/2024', '19:04:00', ''],
  ['5', '992871', 'SIDY MOHAMED', 'HOT BAYTS', '1 000CFA', '6 500CFA', '02/06/2024', '18:03:00', ''],
  ['6', '992885', 'OBOU Melaine', 'CHICKEN NATION ZONE 4', '1 500CFA', '7 000CFA', '02/06/2024', '20:35:00', ''],
  ['7', '993147', 'SEKA FRANCK', 'AGHA', '2 500CFA', '7 000CFA', '02/06/2024', '22:42:00', ''],
  // Deux fois la même référence : le fichier se contredit lui-même.
  ['8', '993025', 'KRAH Éric', 'AGHA', '1 000CFA', '5 500CFA', '03/06/2024', '12:56:00', ''],
  // Un livreur que la base ne connaît pas.
  ['9', '993300', 'INCONNU Jean', 'AGHA', '1 000CFA', '5 000CFA', '03/06/2024', '13:37:00', ''],
  // Une date illisible et un montant vide.
  ['10', '993301', 'KRAH Éric', 'AGHA', '', '5 000CFA', '31/02/2024', '09:19:00', ''],
];

/** L'export de tickets de l'ERP, rechargé tel quel. Daté de cette semaine. */
function feuilleExportErp(): string[][] {
  const aujourdhui = new Date();
  const jour = (recul: number) => {
    const d = new Date(aujourdhui);
    d.setDate(d.getDate() - recul);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };
  return [
    ['Code Check', 'Livreur', 'Partner', 'Montant de Livraison', 'Montant de Commande', 'Commission', 'Date', 'Heure'],
    ['A-900001', 'KRAH Éric', 'AGHA', '1000', '12500', '1250', jour(0), '19:08'],
    ['A-900002', 'SIDY MOHAMED', 'HOT BAYTS', '1000', '5000', '200', jour(1), '18:12'],
    ['A-900003', 'OBOU Melaine', 'CHICKEN NATION ZONE 4', '1500', '7500', '300', jour(1), '12:40'],
    ['A-900004', "N'DRI JEAN JACQUES", 'AGHA', '2500', '19000', '500', jour(2), '15:25'],
  ];
}

/** Un fichier qui dépasse largement un paquet, pour voir le découpage et la progression. */
function feuilleVolumineuse(): string[][] {
  const noms = ['KRAH Éric', "N'DRI JEAN JACQUES", 'SIDY MOHAMED', 'OBOU Melaine'];
  return [
    ['Code Check', 'Livreur', 'Partner', 'Montant de Livraison', 'Montant de Commande', 'Date', 'Heure'],
    ...Array.from({ length: 320 }, (_, i) => [
      `B-${800000 + i}`,
      noms[i % noms.length],
      'AGHA',
      i % 3 === 0 ? '2500' : '1000',
      String(4000 + (i % 25) * 500),
      `0${1 + (i % 9)}/06/2024`,
      '18:30',
    ]),
  ];
}

function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
  const [sombre, setSombre] = React.useState(false);
  React.useEffect(() => {
    // ⚠ Sur `<html>`, jamais sur une enveloppe : les jetons shadcn sont encore déclarés
    // en triplets HSL bruts dans la portée `.dark`, et sur un div imbriqué c'est le
    // triplet qui gagne — `bg-success` ne peint alors plus rien.
    const html = document.documentElement;
    const avant = html.className;
    html.className = sombre ? 'dark' : 'light';
    return () => {
      html.className = avant;
    };
  }, [sombre]);
  return [sombre, setSombre];
}

/** Des verdicts plausibles, calculés localement : aucun appel ne sort du navigateur. */
function apiDeDemonstration(): IApiImportTickets {
  const verdictPour = (ligne: { date: string; index: number; montantCommande: number }): IVerdictImport => {
    const recent = new Date(ligne.date).getTime() > Date.now() - 7 * 24 * 3600 * 1000;
    return {
      alertes: recent
        ? []
        : ['Hors de la semaine de la date : la ligne partira en TARDIF, dans le créneau courant, et devra passer par la régularisation.'],
      commissionPrevue: Math.round(ligne.montantCommande * 0.1),
      creneauDebut: '2026-11-02',
      creneauFin: '2026-11-08',
      etat: 'PRET',
      index: ligne.index,
      motif: null,
      statutPrevu: recent ? 'PENDING' : 'TARDIF',
      ticketId: null,
    };
  };

  return {
    enregistrer: async (lignes) => {
      const rendus = lignes.map((l) => ({
        ...verdictPour(l),
        etat: 'ENREGISTRE' as const,
        ticketId: `faux-${l.index}`,
      }));
      return {
        lignes: rendus,
        nbEchouees: 0,
        nbEnregistrees: rendus.length,
        nbRecues: lignes.length,
      };
    },
    verifier: async (lignes) => lignes.map(verdictPour),
  };
}

export default function ApercuImportTickets() {
  const [sombre, setSombre] = useThemeSombre();
  const [etroit, setEtroit] = React.useState(false);

  const client = React.useMemo(() => {
    const c = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Infinity,
          refetchOnMount: false,
          refetchOnReconnect: false,
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });
    c.setQueryData(ticketsKeyQuery('livreur-list'), LIVREURS);
    c.setQueryData(importTicketsKeys.parametres(), { lignesMax: 50 });
    for (const [restaurantId, zones] of Object.entries(GRILLES)) {
      c.setQueryData(importTicketsKeys.grille(restaurantId), {
        content: zones,
        number: 0,
        size: 200,
        totalElements: zones.length,
        totalPages: 1,
      });
    }
    return c;
  }, []);

  const api = React.useMemo(apiDeDemonstration, []);

  /**
   * Pose un vrai classeur dans la vraie entrée de fichier.
   *
   * <p>On fabrique le .xlsx avec la même bibliothèque que celle qui le relira, puis on
   * pose le fichier par `DataTransfer` et on déclenche l'événement `change` que React
   * écoute. Tout le chemin de lecture est ainsi exercé : feuilles multiples, lignes
   * vides écartées, cellules rendues en texte.</p>
   */
  const charger = async (feuilles: Record<string, string[][]>, nom: string) => {
    const { utils, write } = await import('xlsx');
    const classeur = utils.book_new();
    for (const [nomFeuille, grille] of Object.entries(feuilles)) {
      utils.book_append_sheet(classeur, utils.aoa_to_sheet(grille), nomFeuille);
    }
    const octets = write(classeur, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const fichier = new File([octets], nom, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const entree = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!entree) return;
    const donnees = new DataTransfer();
    donnees.items.add(fichier);
    entree.files = donnees.files;
    entree.dispatchEvent(new Event('change', { bubbles: true }));
  };

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className={etroit ? 'mx-auto max-w-[420px]' : 'mx-auto max-w-[1400px]'}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            onPress={() =>
              void charger(
                {
                  'Bon de livraison': FEUILLE_TERRAIN,
                  'PAIE SEMAINE DU 23-29 SEPT': [['Rien ici']],
                  'RELEVE DE PAIE INDEPENDANT': [['Ni là']],
                },
                'DATA TURBO DELIVERY JUIN 2024.xlsx',
              )
            }
            variant="primary"
          >
            Feuille de terrain (3 onglets, en-tête à trouver)
          </Button>
          <Button
            onPress={() => void charger({ 'Tickets de Livraison': feuilleExportErp() }, 'export-erp.xlsx')}
            variant="outline"
          >
            Export ERP rechargé
          </Button>
          <Button
            onPress={() => void charger({ Tickets: feuilleVolumineuse() }, 'gros-fichier.xlsx')}
            variant="outline"
          >
            320 lignes (7 paquets)
          </Button>
          <Button onPress={() => setSombre((p) => !p)} variant="ghost">
            {sombre ? 'Thème clair' : 'Thème sombre'}
          </Button>
          <Button onPress={() => setEtroit((p) => !p)} variant="ghost">
            {etroit ? 'Pleine largeur' : 'Largeur téléphone'}
          </Button>
        </div>

        <QueryClientProvider client={client}>
          <ImportTicketsView api={api} restaurants={PARTENAIRES as never} />
        </QueryClientProvider>
      </div>
    </div>
  );
}
