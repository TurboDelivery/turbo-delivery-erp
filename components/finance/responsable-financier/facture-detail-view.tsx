'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Leaf } from 'lucide-react';
import type { IFactureRFDetail } from './mock-data';
import ProformaModal from './proforma-modal';

type StatutFacture = IFactureRFDetail['statut'];

const statutConfig: Record<StatutFacture, { label: string; className: string }> = {
  'Soldé': { label: 'Soldé', className: 'bg-green-100 text-green-700 border-green-200' },
  'Acompte': { label: 'Acompte', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'Déposé partenaire': { label: 'Déposé partenaire', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Recouvrement': { label: 'Recouvrement', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Validé': { label: 'Validé', className: 'bg-green-100 text-green-700 border-green-200' },
  'Preuve ajoutée': { label: 'Preuve ajoutée', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  'Visé DG': { label: 'Visé DG', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'À valider': { label: 'À valider', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

interface Props {
  facture: IFactureRFDetail;
}

export default function FactureDetailView({ facture }: Props) {
  const [proformaOpen, setProformaOpen] = useState(false);
  const recouvre = facture.montantRecouvre ?? 0;
  const restant = facture.montant - recouvre;
  const pct = facture.pourcentageRecouvre ?? 0;
  const config = statutConfig[facture.statut];

  return (
    <div className="p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/finance/comptabilite/responsable-financier"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux paiements
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-red-500">{facture.numero}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {facture.partenaire} · Cycle {facture.cycle}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Montant total</p>
          <p className="text-2xl font-bold text-red-500">{formatMontant(facture.montant)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Recouvré</p>
          <p className="text-2xl font-bold text-gray-900">{formatMontant(recouvre)}</p>
          <div className="mt-3 space-y-1">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{pct}% du montant</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Reste à recouvrer</p>
          <p className="text-2xl font-bold text-gray-900">{formatMontant(restant)}</p>
        </div>
      </div>

      {/* Body: timeline + infos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800">Historique des statuts</h2>
            <button className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Exporter PDF
            </button>
          </div>
          <ol className="relative border-l-2 border-green-200 ml-3 space-y-6">
            {facture.historique.map((item, i) => (
              <li key={i} className="relative pl-6">
                {/* Dot */}
                <span
                  className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                    item.isCurrent ? 'bg-green-500' : 'bg-green-400'
                  }`}
                >
                  <span className="w-2 h-2 bg-white rounded-full" />
                </span>
                <div>
                  <p className={`text-sm font-medium ${item.isCurrent ? 'text-gray-900' : 'text-gray-700'}`}>
                    {item.label}
                    {item.isCurrent && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">
                        ACTUEL
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[item.date, item.agent ? `par ${item.agent}` : undefined, item.montant ? formatMontant(item.montant) : undefined]
                      .filter(Boolean)
                      .join(' · ')}
                    {!item.date && !item.agent && !item.montant ? '—' : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Infos */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">Informations</h2>
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
                <dt className="text-gray-400 flex-shrink-0">{label}</dt>
                <dd className="text-gray-900 font-medium text-right">{value}</dd>
              </div>
            ))}
          </dl>
          <button
            onClick={() => setProformaOpen(true)}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors">
            <Leaf className="w-4 h-4" />
            Voir la preuve de dépôt
          </button>
        </div>
      </div>
      <ProformaModal
        open={proformaOpen}
        onClose={() => setProformaOpen(false)}
        facture={facture}
      />
    </div>
  );
}
