'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Leaf } from 'lucide-react';
import type { IFactureRFDetail } from '@/features/responsable-financier';
import {
  useValiderFactureRFMutation,
  useLancerRecouvrementMutation,
  useDepotBanqueMutation,
} from '@/features/responsable-financier';
import PreuveModal from './preuve-modal';
import ValiderFactureModal from './valider-facture-modal';
import DemarrerRecouvrementDrawer from './demarrer-recouvrement-modal';
import DepotBanqueModal from './depot-banque-modal';
import type { IFactureRF } from './responsable-financier-columns';
import { formatMontant } from '@/utils/format.utils';

type StatutFacture = IFactureRFDetail['statut'];

const statutConfigMap: Record<string, { label: string; className: string }> = {
  'DRAFT':               { label: 'À valider',           className: 'bg-surface-secondary text-muted border-separator' },
  'À valider':           { label: 'À valider',           className: 'bg-surface-secondary text-muted border-separator' },
  'Validé':              { label: 'Validé',              className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Recouvrement':        { label: 'Recouvrement',        className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'En cours':            { label: 'En cours',            className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Déposé partenaire':   { label: 'Déposé partenaire',   className: 'bg-sky-100 text-sky-700 border-sky-200' },
  'Preuve ajoutée':      { label: 'Preuve ajoutée',      className: 'bg-purple-100 text-purple-700 border-purple-200' },
  'Soldé':               { label: 'Soldé',               className: 'bg-green-100 text-green-700 border-green-200' },
  'Versé au caissier':   { label: 'Versé au caissier',   className: 'bg-slate-100 text-slate-700 border-slate-200' },
  'En attente visa DGA': { label: 'En attente visa DGA', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  'Visé DGA':            { label: 'Visé DGA',            className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'Rejeté DGA':          { label: 'Rejeté DGA',          className: 'bg-red-100 text-red-700 border-red-200' },
  'Clôturé':             { label: 'Clôturé',             className: 'bg-green-200 text-green-800 border-green-300' },
};

function getStatutConfig(statut: string) {
  if (statut in statutConfigMap) return statutConfigMap[statut];
  if (statut.startsWith('Acompte')) return { label: statut, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: statut, className: 'bg-surface-secondary text-muted border-separator' };
}


interface Props {
  facture: IFactureRFDetail;
}

export default function FactureDetailView({ facture }: Props) {
  const [preuveOpen, setPreuveOpen] = useState(false);
  // V52 (2026-05) — 2 modals supplémentaires pour preuves d'encaissement
  // et de versement caissier (Bug C complet).
  const [preuveEncaissementOpen, setPreuveEncaissementOpen] = useState(false);
  const [preuveVersementOpen, setPreuveVersementOpen] = useState(false);
  const [validerOpen, setValiderOpen] = useState(false);
  const [recouvrementOpen, setRecouvrementOpen] = useState(false);
  const [depotBanqueOpen, setDepotBanqueOpen] = useState(false);

  const recouvre = facture.montantRecouvre ?? 0;
  const restant = facture.montant - recouvre;
  const pct = facture.pourcentageRecouvre ?? 0;
  const config = getStatutConfig(facture.statut);

  const validerMutation = useValiderFactureRFMutation();
  const lancerRecouvrementMutation = useLancerRecouvrementMutation();
  const depotBanqueMutation = useDepotBanqueMutation();

  // Adapte IFactureRFDetail → IFactureRF pour les modals
  const factureForModal = useMemo<IFactureRF>(() => ({
    id: facture.id,
    numero: facture.numero,
    partenaire: facture.partenaire,
    montant: facture.montant,
    montantRecouvre: facture.montantRecouvre,
    pourcentageRecouvre: facture.pourcentageRecouvre,
    cycle: facture.cycle,
    emission: facture.emission,
    depotPartenaire: facture.depotPartenaire,
    depotBanque: facture.depotBanque,
    agent: facture.agent,
    statut: facture.statut as IFactureRF['statut'],
  }), [facture]);

  return (
    <div className="p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/finance/comptabilite/responsable-financier"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux paiements
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted mb-0.5">Facture</p>
          <h1 className="text-2xl font-bold text-primary">{facture.numero}</h1>
          <p className="text-sm text-muted mt-0.5">
            {facture.partenaire} · Cycle {facture.cycle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}>
            {config.label}
          </span>
          {(facture.statut === 'DRAFT' || facture.statut === 'À valider') && (
            <button
              onClick={() => setValiderOpen(true)}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ✓ Valider la facture
            </button>
          )}
          {facture.statut === 'Validé' && (
            <button
              onClick={() => setRecouvrementOpen(true)}
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/85 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Lancer recouvrement →
            </button>
          )}
          {facture.statut === 'Orienté banque' && (
            <button
              onClick={() => setDepotBanqueOpen(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              🏦 Dépôt en banque
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-separator p-5 shadow-xs">
          <p className="text-xs text-muted mb-1">Montant total</p>
          <p className="text-2xl font-bold text-red-500">{formatMontant(facture.montant)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-separator p-5 shadow-xs">
          <p className="text-xs text-muted mb-1">Recouvré</p>
          <p className="text-2xl font-bold text-foreground">{formatMontant(recouvre)}</p>
          <div className="mt-3 space-y-1">
            <div className="w-full bg-surface-secondary rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted">{pct}% du montant</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-separator p-5 shadow-xs">
          <p className="text-xs text-muted mb-1">Reste à recouvrer</p>
          <p className={`text-2xl font-bold ${restant > 0 ? 'text-red-500' : 'text-foreground'}`}>{formatMontant(restant)}</p>
        </div>
      </div>

      {/* Body: timeline + infos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-separator p-5 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">Historique des statuts</h2>
            <button className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground border border-separator rounded-lg px-3 py-1.5 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Exporter PDF
            </button>
          </div>
          <ol className="relative border-l-2 border-green-200 ml-3 space-y-6">
            {facture.historique.map((item, i) => (
              <li key={i} className="relative pl-6">
                {/* Dot */}
                <span
                  className={`absolute left-[-13px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-separator shadow-xs ${
                    item.isPending ? 'bg-surface-tertiary' : item.isCurrent ? 'bg-green-500' : 'bg-green-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${item.isPending ? 'bg-surface-tertiary' : 'bg-surface'}`} />
                </span>
                <div>
                  <p className={`text-sm font-medium ${item.isPending ? 'text-muted' : item.isCurrent ? 'text-foreground' : 'text-foreground'}`}>
                    {item.label}
                    {item.isCurrent && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">
                        ACTUEL
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {item.isPending
                      ? [item.agent ? `par ${item.agent}` : undefined, item.montant ? new Intl.NumberFormat('fr-FR').format(item.montant) + ' CFA' : undefined, 'En attente']
                          .filter(Boolean).join(' · ')
                      : [item.date, item.agent ? `par ${item.agent}` : undefined, item.montant ? formatMontant(item.montant) : undefined]
                          .filter(Boolean).join(' · ') || '—'
                    }
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Infos */}
        <div className="bg-surface rounded-xl border border-separator p-5 shadow-xs space-y-4">
          <h2 className="font-semibold text-foreground">Informations</h2>
          <dl className="space-y-3 text-sm">
            {[
              ['Partenaire', facture.partenaire],
              ['Cycle', facture.cycle],
              ['Émission', facture.emission],
              ['Dépôt partenaire', facture.depotPartenaire?.date ?? '—'],
              ['Déposant', facture.depotPartenaire?.agent ?? '—'],
              ['Dépôt banque', facture.depotBanque ?? '—'],
              ['Agent recouvreur', facture.agent],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted shrink-0">{label}</dt>
                <dd className="text-foreground font-medium text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 2026-05 — Section dédiée "Preuves & Documents" pour rendre visibles
            toutes les preuves du workflow facture. User demande : "lors du dépôt
            de la Facture y'a upload de la preuve / lors de l'encaissement y'a
            une preuve uploadé / lors du versement au caissier y'a upload aussi /
            A aucun moment on voit les trois types de preuve pour chaque facture.
            Peux-tu rendre ça visible ici" → Section dédiée + indicateurs clairs
            des preuves disponibles vs en attente de migration backend. */}
        <div className="bg-surface rounded-xl border border-separator p-5 shadow-xs space-y-4 md:col-span-2 lg:col-span-1">
          <h2 className="font-semibold text-foreground">Preuves &amp; Documents</h2>
          <div className="space-y-3 text-sm">
            {/* Preuve 1 : Dépôt partenaire — actuellement date + agent seuls
                (la preuve fichier physique sera ajoutée dans un commit suivant
                car nécessite migration backend). */}
            <div className="border border-separator rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">Dépôt chez partenaire</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${facture.depotPartenaire ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-secondary text-muted'}`}>
                  {facture.depotPartenaire ? 'Effectué' : 'En attente'}
                </span>
              </div>
              {facture.depotPartenaire ? (
                <div className="text-xs text-muted">
                  Le {facture.depotPartenaire.date} par <strong>{facture.depotPartenaire.agent}</strong>
                </div>
              ) : (
                <div className="text-xs text-muted italic">Pas encore déposé.</div>
              )}
            </div>

            {/* Preuve 2 : Fiche de paiement (financeProofReference) — preuve
                de réception physique des fonds. C'est la preuve principale qui
                est aujourd'hui persistée en DB (ajouterPreuve / confirmer
                réception). */}
            <div className="border border-separator rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">Fiche de paiement (réception fonds)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${facture.preuve ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-secondary text-muted'}`}>
                  {facture.preuve ? 'Disponible' : 'Non fournie'}
                </span>
              </div>
              {facture.preuve ? (
                <button
                  onClick={() => setPreuveOpen(true)}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
                  <Leaf className="w-3.5 h-3.5" />
                  Voir la fiche
                </button>
              ) : (
                <div className="text-xs text-muted italic">Le Comptable peut l'ajouter après confirmation de réception.</div>
              )}
            </div>

            {/* V52 (2026-05) — Preuve d'encaissement chez partenaire :
                fichier uploadé par l'agent recouvreur dans le modal
                "Ajouter un paiement" (encaissement-drawer). Persistée via
                colonne factures.preuve_encaissement (migration V52). */}
            <div className="border border-separator rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">Preuve d&apos;encaissement (partenaire)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${facture.preuveEncaissement ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-secondary text-muted'}`}>
                  {facture.preuveEncaissement ? 'Disponible' : 'Non fournie'}
                </span>
              </div>
              {facture.preuveEncaissement ? (
                <button
                  onClick={() => setPreuveEncaissementOpen(true)}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
                  <Leaf className="w-3.5 h-3.5" />
                  Voir la preuve d&apos;encaissement
                </button>
              ) : (
                <div className="text-xs text-muted italic">Uploadée par l&apos;agent recouvreur lors de l&apos;encaissement chez le partenaire.</div>
              )}
            </div>

            {/* V52 (2026-05) — Preuve de versement au caissier : fichier
                uploadé par l'agent dans le modal "Verser au caissier".
                Persistée via factures.preuve_versement_caissier. */}
            <div className="border border-separator rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">Preuve de versement au caissier</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${facture.preuveVersementCaissier ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-secondary text-muted'}`}>
                  {facture.preuveVersementCaissier ? 'Disponible' : 'Non fournie'}
                </span>
              </div>
              {facture.preuveVersementCaissier ? (
                <button
                  onClick={() => setPreuveVersementOpen(true)}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
                  <Leaf className="w-3.5 h-3.5" />
                  Voir la preuve de versement
                </button>
              ) : (
                <div className="text-xs text-muted italic">Uploadée par l&apos;agent lors du transfert au caissier.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <PreuveModal
        open={preuveOpen}
        onClose={() => setPreuveOpen(false)}
        preuve={facture.preuve}
        factureNumero={facture.numero}
        titre="Fiche de paiement"
      />

      {/* V52 (2026-05) — Modals pour les 2 nouvelles preuves persistées. */}
      <PreuveModal
        open={preuveEncaissementOpen}
        onClose={() => setPreuveEncaissementOpen(false)}
        preuve={facture.preuveEncaissement}
        factureNumero={facture.numero}
        titre="Preuve d'encaissement (chez partenaire)"
      />

      <PreuveModal
        open={preuveVersementOpen}
        onClose={() => setPreuveVersementOpen(false)}
        preuve={facture.preuveVersementCaissier}
        factureNumero={facture.numero}
        titre="Preuve de versement au caissier"
      />

      <ValiderFactureModal
        open={validerOpen}
        onClose={() => setValiderOpen(false)}
        facture={factureForModal}
        onConfirm={(f, cycle) => {
          validerMutation.mutate({ id: f.id, data: { cycle } });
          setValiderOpen(false);
        }}
      />

      <DemarrerRecouvrementDrawer
        open={recouvrementOpen}
        onClose={() => setRecouvrementOpen(false)}
        facture={factureForModal}
        onConfirm={(f, agent) => {
          lancerRecouvrementMutation.mutate({ id: f.id, data: { agentId: agent.id } });
          setRecouvrementOpen(false);
        }}
      />

      <DepotBanqueModal
        open={depotBanqueOpen}
        onClose={() => setDepotBanqueOpen(false)}
        facture={factureForModal}
        onConfirm={(f, data) => {
          depotBanqueMutation.mutate({ id: f.id, data });
          setDepotBanqueOpen(false);
        }}
      />
    </div>
  );
}
