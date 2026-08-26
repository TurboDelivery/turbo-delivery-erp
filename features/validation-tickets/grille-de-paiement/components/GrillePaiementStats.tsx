import { AlertTriangle, Phone, Ticket, TrendingUp, Users, Wallet } from 'lucide-react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { formatMontant } from '@/utils/format.utils';

import { IGrillePaiementCreneau } from '../types/grille-paiement.type';

interface Props {
  stats: IGrillePaiementCreneau['stats'];
}

/**
 * V54 (M3 — 2026-05) — Grille paiement avec décomposition par type de
 * collaborateur. Distingue le "Total Net vérifié" (toutes lignes) du
 * "Total à payer" (Indépendants inclus uniquement) avec sous-lignes
 * détaillant journaliers, superviseurs et "à catégoriser".
 *
 * <p>Métier : "Le « Total Net » affiché surévalue le montant réellement
 * dû puisqu'il englobe journaliers et superviseurs. Cela crée trois
 * risques : financier (surpaiement), lisibilité (aucune distinction),
 * contrôle (aucune traçabilité)."</p>
 *
 * <p>Les six cartes passaient par TROIS variantes du meme bloc dans ce seul
 * fichier (un StatCard local, puis deux copies ecrites a la main pour changer
 * de couleur). Elles passent par `CarteStat` : les couleurs deviennent des
 * tons, donc le retour du mode sombre ne demandera aucune retouche ici.</p>
 */
export default function GrillePaiementStats({ stats }: Props) {
  // V54 — Si le backend n'envoie pas encore la décomposition (rétrocompat
  // soft pendant le rollout M1), on retombe sur totalNet pour les 2 totaux
  // — ce qui évite d'afficher 0 partout en attendant.
  const totalNetVerifie = stats.totalNetVerifie ?? stats.totalNet;
  const totalAPayer = stats.totalAPayer ?? stats.totalNet;
  const dontJourn = stats.dontJournaliers ?? 0;
  const dontSup = stats.dontSuperviseurs ?? 0;
  const dontAcat = stats.dontACategoriser ?? 0;
  const nbJourn = stats.nbJournaliers ?? 0;
  const nbSup = stats.nbSuperviseurs ?? 0;
  const nbAcat = stats.nbACategoriser ?? 0;
  const nbInd = stats.nbIndependants ?? 0;
  // Drapeau "à catégoriser" : si > 0, on le surface en alerte car ces lignes
  // sont silencieusement exclues du totalAPayer et requièrent action RH.
  const hasACategoriser = nbAcat > 0;

  return (
    <div className="space-y-3">
      <GrilleStats colonnes={3}>
        <CarteStat libelle="Livreurs" valeur={stats.totalLivreurs} icone={Users} />
        <CarteStat libelle="Tickets" valeur={stats.totalTickets} icone={Ticket} />
        {/* L'anneau rouge portait a lui seul l'alerte : elle passe dans le ton. */}
        <CarteStat
          libelle="Wave manquants"
          valeur={stats.waveManquants}
          icone={Phone}
          ton="danger"
        />
      </GrilleStats>

      {/* V54 — 2 totaux distincts côte à côte avec décomposition. */}
      {/* Une carte par ligne sous `lg`, comme avant : ces montants sont
          insecables (separateurs et espace avant FCFA) et deborderaient
          une demi-colonne sur mobile. */}
      <GrilleStats colonnes={3} className="grid-cols-1">
        <CarteStat
          libelle="Total Brut"
          valeur={formatMontant(stats.totalBrut ?? 0)}
          icone={Wallet}
        />

        <CarteStat
          libelle="Total Net vérifié (tous)"
          valeur={formatMontant(totalNetVerifie)}
          note="Contrôle de la fiabilité — toutes lignes confondues"
          icone={TrendingUp}
          ton="primaire"
        />

        {/* Total À payer — seul montant qui part au paiement Wave */}
        <CarteStat
          libelle="Total à payer (Indépendants)"
          valeur={formatMontant(totalAPayer)}
          note={`${nbInd} Indépendant${nbInd > 1 ? 's' : ''} — montant validé pour le paiement hebdomadaire`}
          icone={Wallet}
          ton="succes"
          accent
        />
      </GrilleStats>

      {/* V54 — Sous-lignes "dont…" détaillant ce qui est exclu et pourquoi. */}
      {(nbJourn > 0 || nbSup > 0 || hasACategoriser) && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">Détail des exclusions</p>
          {nbJourn > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                <span className="font-semibold">{nbJourn}</span> Journalier{nbJourn > 1 ? 's' : ''} —
                <span className="ml-1 text-gray-400">hors paie hebdo (autre circuit)</span>
              </span>
              <span className="font-medium text-gray-700">{formatMontant(dontJourn)}</span>
            </div>
          )}
          {nbSup > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                <span className="font-semibold">{nbSup}</span> Superviseur{nbSup > 1 ? 's' : ''} —
                <span className="ml-1 text-gray-400">salariés, jamais inclus</span>
              </span>
              <span className="font-medium text-gray-700">{formatMontant(dontSup)}</span>
            </div>
          )}
          {hasACategoriser && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700">
                <AlertTriangle className="inline-block w-3 h-3 mr-1" />
                <span className="font-semibold">{nbAcat}</span> à catégoriser —
                <span className="ml-1">RH doit assigner un type</span>
              </span>
              <span className="font-medium text-amber-800">{formatMontant(dontAcat)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
