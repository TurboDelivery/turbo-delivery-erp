'use client';

/*
 * ⚠ COMPOSANT CLIENT, ET CE N'EST PAS UN DETAIL DE PERFORMANCE.
 *
 * `CarteStat` est un composant CLIENT, et ce bandeau lui passe ses icones sous la forme
 * `icone={Users}` - c'est-a-dire l'objet `forwardRef` de lucide, `{$$typeof, render,
 * displayName}`. Une fonction ne TRAVERSE PAS la frontiere serveur/client : React leve
 * « Functions cannot be passed directly to Client Components » et la PAGE ENTIERE tombe sur
 * son ecran d'erreur.
 *
 * Constate le 15/09/2026 en production : l'ecran « Performance flotte » affichait « Les
 * livreurs n'a pas pu s'afficher », avec exactement cinq erreurs au journal du serveur -
 * une par carte. Les deux pages du module etaient touchees, celle-ci etant importee par
 * deux composants SERVEUR.
 *
 * ⚠ `tsc` et `pnpm build` passent au VERT sur ce defaut : il n'apparait qu'au rendu. Les
 * vingt autres appelants de `CarteStat` dans l'ERP sont tous des composants client ; ces
 * deux bandeaux etaient les seuls a ne pas l'etre.
 */
import { AlertTriangle, Package, Receipt, Users, Wallet } from 'lucide-react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import type { CreneauPaie, StatsCreneau } from '@/src/performance/creneau-paie.action';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';

/**
 * La synthèse de la flotte sur la semaine lue, exigence 3.1.
 *
 * <h3>D'où viennent ces chiffres, et pourquoi pas d'ailleurs</h3>
 * <p>Ils viennent de la GRILLE DE PAIE du créneau, pas d'un recalcul. Le cahier des charges
 * le demande explicitement au §4.1 : le récapitulatif de la grille « doit servir de base au
 * bandeau de statistiques globales, en le rendant dynamique et filtrable au lieu d'un export
 * figé par créneau ». C'est aussi l'arbitrage de l'owner du 14/09 : la paie fait référence.</p>
 *
 * <p>Conséquence assumée : ces totaux peuvent différer de la somme des lignes affichées
 * plus bas. Les deux ne comptent pas la même chose — la paie compte les tickets validés
 * d'un créneau, la liste compte les courses par date. L'écart mesuré le 14/09 était de dix
 * livraisons sur sept cent cinquante. Le bandeau dit donc d'où il tient ses chiffres,
 * plutôt que de laisser croire à une incohérence.</p>
 *
 * <h3>Quand il ne s'affiche pas</h3>
 * <p>Aucun créneau de paie ne commence ce lundi-là : le bandeau se tait. Afficher les
 * totaux d'une autre semaine serait pire que de ne rien afficher.</p>
 */
export function BandeauFlotte({
  creneau,
  stats,
}: {
  creneau: CreneauPaie | null;
  stats: StatsCreneau | null;
}) {
  if (!creneau || !stats) {
    return (
      <p className="rounded-lg bg-surface-secondary px-4 py-3 text-xs text-muted">
        Aucun créneau de paie ne couvre cette semaine : la synthèse de la flotte n&apos;est pas
        disponible. Les lignes ci-dessous restent lisibles.
      </p>
    );
  }

  const enAttente = stats.waveManquants > 0;

  return (
    <section aria-label="Synthèse de la flotte" className="space-y-2">
      <GrilleStats className="xl:grid-cols-5" colonnes={2}>
        <CarteStat
          icone={Users}
          libelle="Livreurs payés"
          note={`${formatNumber(stats.nbJournaliers)} journaliers · ${formatNumber(stats.nbIndependants)} indépendants · ${formatNumber(stats.nbSuperviseurs)} superviseurs`}
          ton="neutre"
          valeur={formatNumber(stats.totalLivreurs)}
        />

        <CarteStat
          icone={Package}
          libelle="Livraisons"
          note="Tickets retenus par la grille de paie"
          ton="danger"
          valeur={formatNumber(stats.totalTickets)}
        />

        <CarteStat
          icone={Receipt}
          libelle="Montant brut"
          note="Avant taux, bonus et déductions"
          ton="neutre"
          valeur={formatMontant(stats.totalBrut)}
        />

        {/*
         * ⚠ `totalAPayer`, et NON `totalNet`.
         *
         * Le backend distingue les deux sans ambiguite : `totalNet` est « toutes lignes
         * confondues, incluant Independants, Journaliers et Superviseurs », destine au
         * controle de fiabilite ; `totalAPayer` est « le seul montant qui doit partir au
         * paiement Wave ». Mesure du 14/09 sur la semaine 37 : 848 150 F contre 689 150 F,
         * soit 159 000 F d'ecart, et 869 350 F sur la semaine 36.
         *
         * Afficher le premier sous le libelle « Net a payer » annoncait donc, a la Direction
         * et sur l'ecran meme dont la premisse est « la paie fait reference », un montant
         * superieur au virement reel. Le reste de l'ERP lit `totalAPayer ?? totalNet` et
         * etiquette `totalNet` « Total Net verifie - tous ».
         */}
        <CarteStat
          icone={Wallet}
          libelle="Net à payer"
          note={`Sur ${formatMontant(stats.totalNet)} de net total, journaliers et superviseurs compris`}
          ton="attention"
          valeur={formatMontant(stats.totalAPayer ?? stats.totalNet)}
        />

        {/*
         * Deux lacunes de paie sur une seule carte, et elles n'ont pas le meme poids.
         * `nbACategoriser` designe un livreur que la RH n'a pas qualifie : il echappe au
         * circuit de paie. `waveManquants` designe un numero de paiement absent : le
         * virement ne peut pas partir. Les deux appellent un geste, d'ou la teinte quand
         * il y en a — et le ton neutre quand il n'y en a pas, parce qu'une alerte
         * permanente cesse d'etre lue.
         */}
        <CarteStat
          icone={AlertTriangle}
          libelle="À traiter"
          note={
            stats.nbACategoriser > 0
              ? `${formatNumber(stats.nbACategoriser)} livreur${stats.nbACategoriser > 1 ? 's' : ''} sans contrat qualifié`
              : enAttente
                ? 'Numéro de paiement manquant'
                : 'Aucun blocage de paiement'
          }
          ton={enAttente || stats.nbACategoriser > 0 ? 'danger' : 'succes'}
          valeur={formatNumber(stats.waveManquants + stats.nbACategoriser)}
        />
      </GrilleStats>

      <p className="text-xs text-muted">
        Chiffres de la grille de paie du créneau «&nbsp;{creneau.label}&nbsp;»
        {creneau.statut ? ` · ${creneau.statut.toLowerCase().replace(/_/g, ' ')}` : ''}. Ils
        peuvent différer de la somme des lignes ci-dessous, qui compte les courses par date
        et non les tickets validés du créneau.
      </p>
    </section>
  );
}
