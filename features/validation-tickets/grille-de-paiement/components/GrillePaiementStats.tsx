import { AlertTriangle, Phone, Ticket, TrendingUp, Users, Wallet } from 'lucide-react';
import { IGrillePaiementCreneau } from '../types/grille-paiement.type';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  className?: string;
}

function StatCard({ label, value, sub, icon: Icon, className }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white px-4 py-3 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase text-gray-500 leading-tight">{label}</span>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
          <Icon className="h-3.5 w-3.5 text-red-500" />
        </div>
      </div>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight break-words">
        {value}
        {sub && <span className="ml-1 text-xs sm:text-sm font-medium text-black">{sub}</span>}
      </p>
    </div>
  );
}

function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0';
  return n.toLocaleString('fr-FR');
}

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
      {/* Bandeau compteurs + indicateurs techniques (inchangé) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        <StatCard label="Livreurs" value={stats.totalLivreurs} icon={Users} />
        <StatCard label="Tickets" value={stats.totalTickets} icon={Ticket} />
        <StatCard label="Wave manquants" value={stats.waveManquants} icon={Phone} className="ring-1 ring-red-600" />
      </div>

      {/* V54 — 2 totaux distincts côte à côte avec décomposition. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Total Brut (inchangé) */}
        <StatCard
          label="Total Brut"
          value={fmt(stats.totalBrut)}
          sub="FCFA"
          icon={Wallet}
        />

        {/* Total Net vérifié — fiabilité des données (toutes populations) */}
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-gray-500 leading-tight">
              Total Net vérifié <span className="text-gray-400 normal-case">(tous)</span>
            </span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight break-words">
            {fmt(totalNetVerifie)}
            <span className="ml-1 text-xs sm:text-sm font-medium text-black">FCFA</span>
          </p>
          <p className="mt-1 text-[10px] text-gray-500 leading-tight">
            Contrôle de la fiabilité — toutes lignes confondues.
          </p>
        </div>

        {/* Total À payer — seul montant qui part au paiement Wave */}
        <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50/50 px-4 py-3 ring-1 ring-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-emerald-700 leading-tight">
              Total à payer <span className="text-emerald-600 normal-case">(Indépendants)</span>
            </span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200">
              <Wallet className="h-3.5 w-3.5 text-emerald-700" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-emerald-900 leading-tight break-words">
            {fmt(totalAPayer)}
            <span className="ml-1 text-xs sm:text-sm font-medium text-emerald-800">FCFA</span>
          </p>
          <p className="mt-1 text-[10px] text-emerald-700 leading-tight">
            {nbInd} Indépendant{nbInd > 1 ? 's' : ''} — montant validé pour le paiement hebdomadaire.
          </p>
        </div>
      </div>

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
              <span className="font-medium text-gray-700">{fmt(dontJourn)} FCFA</span>
            </div>
          )}
          {nbSup > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                <span className="font-semibold">{nbSup}</span> Superviseur{nbSup > 1 ? 's' : ''} —
                <span className="ml-1 text-gray-400">salariés, jamais inclus</span>
              </span>
              <span className="font-medium text-gray-700">{fmt(dontSup)} FCFA</span>
            </div>
          )}
          {hasACategoriser && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700">
                <AlertTriangle className="inline-block w-3 h-3 mr-1" />
                <span className="font-semibold">{nbAcat}</span> à catégoriser —
                <span className="ml-1">RH doit assigner un type</span>
              </span>
              <span className="font-medium text-amber-800">{fmt(dontAcat)} FCFA</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
