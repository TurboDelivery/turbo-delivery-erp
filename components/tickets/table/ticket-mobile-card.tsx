'use client';

import React from 'react';
import Select from 'react-select';
import { CheckSquare, Loader2, Pen, ShieldCheck, Trash2, X } from 'lucide-react';
import { Tooltip } from '@/components/heroui';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import PriceListSelect from '@/components/tickets/price-list-select';
import { Ticket } from '@/types/bon-livraison.model';
import { StatutControle } from '@/types/statut-controle.enum';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import type { TicketColumnMeta } from './ticket-table-columns';

const MODIFIABLE_STATUTS = new Set<string>([StatutControle.PENDING, StatutControle.TARDIF, StatutControle.REJETE_FRAUDE]);

const STATUT_CONFIG: Record<StatutControle, { label: string; className: string }> = {
  [StatutControle.PENDING]:        { label: 'EN ATTENTE',      className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  [StatutControle.TARDIF]:         { label: 'TARDIF',          className: 'bg-orange-100 text-orange-700 border-orange-300' },
  [StatutControle.AUTHENTIFIE]:    { label: 'AUTHENTIFIÉ',     className: 'bg-blue-100 text-blue-700 border-blue-300' },
  [StatutControle.V1_VALIDE]:      { label: 'V1 Validé',       className: 'bg-teal-100 text-teal-700 border-teal-300' },
  [StatutControle.V2_VALIDE]:      { label: 'V2 Validé',       className: 'bg-green-100 text-green-700 border-green-300' },
  [StatutControle.REJETE_FRAUDE]:  { label: 'REJETÉ (Fraude)', className: 'bg-red-100 text-red-700 border-red-300' },
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right truncate">{children}</span>
    </div>
  );
}

/**
 * Carte mobile d'un ticket (tableau "Tous les Tickets").
 *
 * Pilotée par le MÊME `TicketColumnMeta` que les colonnes du tableau desktop :
 * mêmes handlers (édition, sauvegarde, suppression, authentification), même
 * gestion des états (nouveau / édition / lecture). Aucune divergence de logique
 * avec `ticket-table-columns.tsx`. Affichage tactile en remplacement du tableau
 * dense < md.
 */
export function TicketMobileCard({ ticket: rowTicket, meta, isSelected, onToggleSelect }: {
  ticket: Ticket;
  meta: TicketColumnMeta;
  isSelected: boolean;
  onToggleSelect: (value: boolean) => void;
}) {
  const ticket = meta.getDisplayTicket(rowTicket);
  const isNew = meta.newTicketIds.has(ticket.id);
  const isEditing = isNew || meta.editingIds.has(ticket.id);

  const optimisticAuthentifie = meta.authenticatedIds.has(ticket.id);
  const effectiveStatut = optimisticAuthentifie ? 'AUTHENTIFIE' : (ticket.statutControle ?? 'PENDING');
  const canAuthentifier = !isNew && meta.permissions.canAuthentifier && (effectiveStatut === 'PENDING' || effectiveStatut === 'TARDIF');
  const statutCfg = STATUT_CONFIG[effectiveStatut as StatutControle] ?? { label: String(effectiveStatut), className: 'bg-gray-100 text-gray-700 border-gray-300' };

  const originalStatut = rowTicket.statutControle;
  const canMutate = !originalStatut || MODIFIABLE_STATUTS.has(originalStatut);
  // L'admin/direction peut modifier ET supprimer un ticket quel que soit son statut (V2 inclus).
  const canEdit = meta.permissions.isAdmin || canMutate;
  const canDelete = meta.permissions.isAdmin || canMutate;

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-xs space-y-2 ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-400">Code Check</p>
          {isEditing ? (
            <input
              type="text"
              value={ticket.code ?? ''}
              onChange={(e) => meta.onTicketChange(ticket.id, 'code', e.target.value)}
              className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
              placeholder="Code CHECK"
            />
          ) : (
            <p className="text-sm font-semibold text-gray-900 truncate">{ticket.code}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing && <Badge className={statutCfg.className}>{statutCfg.label}</Badge>}
          <Checkbox checked={isSelected} onCheckedChange={(v) => onToggleSelect(!!v)} aria-label="Sélectionner la ligne" disabled={isNew} />
        </div>
      </div>

      {/* Livreur */}
      {isEditing ? (
        <div>
          <span className="block text-xs text-gray-400 mb-1">Livreur</span>
          <Select
            options={meta.livreurOptions}
            value={meta.livreurOptions.find((o) => o.value === ticket.livreurId) ?? null}
            onChange={(option) => meta.onTicketChange(ticket.id, 'livreurId', option?.value ?? '')}
            placeholder="Sélectionner un livreur"
            isClearable
            className="text-xs"
            classNamePrefix="react-select"
          />
        </div>
      ) : (
        <Field label="Livreur">{ticket.livreur}</Field>
      )}

      {/* Restaurant */}
      {isEditing ? (
        <div>
          <span className="block text-xs text-gray-400 mb-1">Partner</span>
          <Select
            options={meta.restaurantOptions}
            value={meta.restaurantOptions.find((o) => o.value === ticket.restaurantId) ?? null}
            onChange={(option) => meta.onTicketChange(ticket.id, 'restaurantId', option?.value ?? '')}
            placeholder="Sélectionner un restaurant"
            isClearable
            className="text-xs"
            classNamePrefix="react-select"
          />
        </div>
      ) : (
        <Field label="Partner">{ticket.restaurant}</Field>
      )}

      {/* Zone */}
      {isEditing ? (
        <div>
          <span className="block text-xs text-gray-400 mb-1">Zone</span>
          <PriceListSelect ticketId={ticket.id} restaurantID={ticket.restaurantId} handleChange={meta.onTicketPatch} />
        </div>
      ) : (
        <Field label="Zone">{ticket.nomZone ?? 'Inconnue'}</Field>
      )}

      {/* Montant de Livraison */}
      {isEditing ? (
        <div>
          <span className="block text-xs text-gray-400 mb-1">Montant de Livraison</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={ticket.montantLivraison}
            onChange={(e) => meta.onTicketChange(ticket.id, 'montantLivraison', e.target.value)}
            placeholder="0 CFA"
            disabled={!ticket.restaurantId}
            className={`w-full h-9 px-2 py-1 text-xs border rounded ${!ticket.restaurantId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
          />
        </div>
      ) : (
        <Field label="Montant de Livraison">{formatCFA(ticket.montantLivraison)}</Field>
      )}

      {/* Montant de Commande */}
      {isEditing ? (
        <div>
          <span className="block text-xs text-gray-400 mb-1">Montant de Commande</span>
          <input
            value={ticket.montantCommande}
            onChange={(e) => meta.onTicketChange(ticket.id, 'montantCommande', e.target.value)}
            className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
            placeholder="0 CFA"
          />
        </div>
      ) : (
        <Field label="Montant de Commande">{formatCFA(ticket.montantCommande)}</Field>
      )}

      {/* Commission */}
      {isEditing ? (
        <div>
          <span className="block text-xs text-gray-400 mb-1">Commission</span>
          <input type="number" value={ticket.commission} readOnly placeholder="0 CFA" className="w-full h-9 px-2 py-1 text-xs text-right border border-gray-300 rounded bg-gray-50" />
        </div>
      ) : (
        <Field label="Commission">{formatCFA(ticket?.commission ?? 0)}</Field>
      )}

      {/* Date */}
      {isEditing ? (
        <div>
          <span className="block text-xs text-gray-400 mb-1">Date</span>
          <input type="date" value={ticket.date} onChange={(e) => meta.onTicketChange(ticket.id, 'date', e.target.value)} className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs" />
        </div>
      ) : (
        <Field label="Date">{formatDateFR(ticket.date)}</Field>
      )}

      {/* Heure */}
      {isEditing ? (
        <div>
          <span className="block text-xs text-gray-400 mb-1">Heure</span>
          <input type="time" value={ticket.heure} onChange={(e) => meta.onTicketChange(ticket.id, 'heure', e.target.value)} className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs" />
        </div>
      ) : (
        <Field label="Heure">{formatHoursMinutes(ticket.heure)}</Field>
      )}

      {!isEditing && (
        <Field label="Créé par">{rowTicket.createdByUser ? `${rowTicket.createdByUser.prenoms} ${rowTicket.createdByUser.nom}` : '—'}</Field>
      )}

      {/* Actions — même logique conditionnelle que la colonne "actions" */}
      <div className="pt-1 flex items-center gap-2">
        {isNew ? (
          <>
            <button
              onClick={() => meta.onSaveNew(ticket.id)}
              disabled={meta.isSavingNew}
              className="flex-1 h-9 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1"
            >
              {meta.isSavingNew ? <Loader2 className="size-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />} Enregistrer
            </button>
            <button onClick={() => meta.onCancelNew(ticket.id)} className="flex-1 h-9 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center justify-center gap-1">
              <X className="w-4 h-4" /> Annuler
            </button>
          </>
        ) : meta.editingIds.has(ticket.id) ? (
          <>
            {/* Meme enveloppe span que Modifier et Supprimer : un bouton desactive n'emet pas de survol. */}
            <Tooltip content="Votre rôle ne permet pas d'enregistrer les modifications d'un ticket" isDisabled={meta.permissions.canUpdate} size="sm">
              <span className="flex-1">
                <button
                  onClick={() => meta.onSaveEdit(ticket.id)}
                  disabled={!meta.permissions.canUpdate || meta.isSavingEdit}
                  className={`w-full h-9 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1 ${!meta.permissions.canUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {meta.isSavingEdit ? <Loader2 className="size-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />} Enregistrer
                </button>
              </span>
            </Tooltip>
            <button onClick={() => meta.onCancelEdit(ticket.id)} className="flex-1 h-9 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center justify-center gap-1">
              <X className="w-4 h-4" /> Annuler
            </button>
          </>
        ) : (
          <>
            {canAuthentifier && (
              <button
                onClick={() => meta.onAuthentifier(ticket.id)}
                className="flex-1 h-9 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-4 h-4" /> Authentifier
              </button>
            )}
            {meta.permissions.canUpdate && (
              <Tooltip content="Ce ticket n'est pas modifiable" isDisabled={canEdit} size="sm">
                <span className="flex-1">
                  <button
                    onClick={() => (canEdit ? meta.onEditRow(ticket.id) : undefined)}
                    disabled={!canEdit}
                    className={`w-full h-9 bg-blue-500 text-white rounded text-sm flex items-center justify-center gap-1 ${canEdit ? 'hover:bg-blue-600' : 'opacity-40 cursor-not-allowed'}`}
                  >
                    <Pen className="w-4 h-4" /> Modifier
                  </button>
                </span>
              </Tooltip>
            )}
            {meta.permissions.canUpdate && (
              <Tooltip content="Ce ticket n'est pas supprimable" isDisabled={canDelete} size="sm">
                <span className="flex-1">
                  <button
                    onClick={() => (canDelete ? meta.onDeleteRow(ticket.id) : undefined)}
                    disabled={!canDelete}
                    className={`w-full h-9 bg-red-500 text-white rounded text-sm flex items-center justify-center gap-1 ${canDelete ? 'hover:bg-red-600' : 'opacity-40 cursor-not-allowed'}`}
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                </span>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </div>
  );
}
