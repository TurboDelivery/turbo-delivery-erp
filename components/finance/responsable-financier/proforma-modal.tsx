'use client';

import { X, Download } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: {
    numero: string;
    partenaire: string;
    montant: number;
    cycle: string;
    emission: string;
    depotPartenaire?: { date: string; agent: string } | null;
  };
}

function toWords(n: number): string {
  // Simple French number-to-words for common amounts
  const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF',
    'DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
  const tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE', 'QUATRE-VINGT', 'QUATRE-VINGT'];

  if (n === 0) return 'ZÉRO';

  function belowThousand(num: number): string {
    if (num === 0) return '';
    if (num < 20) return units[num];
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (t === 7) return 'SOIXANTE-' + (u === 0 ? 'DIX' : u === 1 ? 'ET ONZE' : units[10 + u]);
    if (t === 9) return 'QUATRE-VINGT-' + (u === 0 ? 'DIX' : units[10 + u]);
    const sep = (t === 8 && u === 0) ? '' : u === 0 ? '' : u === 1 && t !== 8 ? '-ET-' : '-';
    return tens[t] + (u === 0 ? '' : sep + units[u]);
  }

  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;
  const hundreds = Math.floor(remainder / 100);
  const below100 = remainder % 100;

  let result = '';
  if (millions > 0) result += (millions === 1 ? 'UN MILLION' : belowThousand(millions) + ' MILLIONS') + ' ';
  if (thousands > 0) result += (thousands === 1 ? 'MILLE' : belowThousand(thousands) + ' MILLE') + ' ';
  if (hundreds > 0) result += (hundreds === 1 ? 'CENT' : belowThousand(hundreds) + ' CENT') + ' ';
  if (below100 > 0) result += belowThousand(below100);

  return result.trim() + ' FRANCS CFA';
}

export default function ProformaModal({ open, onClose, facture }: Props) {
  if (!open) return null;

  const commission = 200;
  const nbLivraisons = Math.round(facture.montant / commission);
  const montantFormate = new Intl.NumberFormat('fr-FR').format(facture.montant);
  const montantEnLettres = toWords(facture.montant);

  // Derive period from emission date for display
  const periode = facture.emission !== '—'
    ? `Du ${facture.emission.replace(/-/g, '/')} - ${facture.depotPartenaire?.date?.replace(/-/g, '/') ?? '—'}`
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal body — scrollable */}
        <div className="max-h-[80vh] overflow-y-auto p-6">
          {/* PROFORMA doc */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white font-sans text-xs text-gray-800">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-red-600 font-extrabold text-2xl tracking-wide">PROFORMA</p>
                <p className="text-gray-500 text-[11px] mt-0.5">{periode}</p>
              </div>
              <div className="w-10 h-10 bg-red-600 rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">TD</span>
              </div>
            </div>

            {/* Partenaire */}
            <div className="text-center my-4">
              <p className="font-semibold text-sm text-red-600 underline underline-offset-2">Partenaire</p>
              <p className="font-bold text-sm mt-0.5">{facture.partenaire}</p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-[11px] mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Désignation</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold">Nombre de livraison</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold">Commission</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right font-semibold">Montant livraison</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 align-top">
                    Frais de service de la 1ère quinzaine<br />
                    {facture.emission !== '—' ? `de ${new Date(facture.emission.split('-').reverse().join('-')).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` : ''}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center align-top">
                    {new Intl.NumberFormat('fr-FR').format(nbLivraisons)}<br />
                    <span className="text-gray-400">courses</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center align-top">{commission}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right align-top font-medium">{montantFormate} FCFA</td>
                </tr>
                {/* Empty rows for spacing */}
                <tr><td className="border border-gray-300 h-8" colSpan={4}></td></tr>
                <tr><td className="border border-gray-300 h-8" colSpan={4}></td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="border border-gray-300 px-2 py-1.5 text-right font-bold bg-red-600 text-white">TOTAL</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right font-bold bg-red-600 text-white">{montantFormate} FCFA</td>
                </tr>
              </tfoot>
            </table>

            {/* Amount in words */}
            <div className="border border-gray-300 rounded px-3 py-2 text-center text-[11px] font-medium text-gray-700 mb-6">
              {montantEnLettres}
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-blue-600 space-y-0.5 mt-4">
              <p className="font-bold">TURBO-DELIVERY</p>
              <p>Tél: +225/24-35-59-82</p>
              <p>Cap: +225 08 22 79 44</p>
              <p>28 BP 1465 Abidjan 28</p>
              <p>Mail: info@turbo-delivery.net</p>
            </div>

            {/* Legal footer */}
            <div className="mt-4 pt-3 border-t border-red-600">
              <p className="text-center text-[9px] font-bold text-red-600 mb-1">TURBO DELIVERY SARL</p>
              <p className="text-[8.5px] text-gray-500 text-center leading-4">
                Société à Responsabilité Limitée Unipersonnelle au capital de 1 000 000 FCFA dont le siège social est situé à Abidjan Marcory – Zone 4
                Rue Paul Langevin, Parcelle 208 18 BP 831 Abidjan 18, numéro de compte contributeur 1840325, N° RCCM CI-ABJ-2019-B-18925.
                Représentée par son Gérant Monsieur ZEID RAWAD.
              </p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Fermer
          </button>
          <button className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}
