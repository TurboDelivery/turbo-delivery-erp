'use client';

import { useState } from 'react';
import { IDepense } from '@/features/depenses/types/depense.type';

export function ModifierForm({
  depense,
  onSave,
  onCancel,
}: {
  depense: IDepense;
  onSave: (updates: Partial<IDepense>) => void;
  onCancel: () => void;
}) {
  const [libelle, setLibelle]           = useState(depense.libelle);
  const [montant, setMontant]           = useState(String(depense.montant));
  const [description, setDescription]   = useState(depense.description ?? '');
  const [dateDepense, setDateDepense]   = useState(depense.dateDepense);

  const handleSave = () => {
    const montantNum = parseFloat(montant.replace(/[^0-9.]/g, ''));
    if (!libelle.trim() || isNaN(montantNum)) return;
    onSave({ libelle: libelle.trim(), montant: montantNum, description, dateDepense });
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-gray-700">Modifier la dépense</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Désignation</label>
          <input
            type="text"
            value={libelle}
            onChange={e => setLibelle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Montant (FCFA)</label>
          <input
            type="number"
            value={montant}
            onChange={e => setMontant(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Date</label>
          <input
            type="date"
            value={dateDepense}
            onChange={e => setDateDepense(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
