'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Ticket } from '@/types/bon-livraison.model';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import Select from 'react-select';
import PriceListSelect from '@/components/tickets/price-list-select';
import { CheckSquare, Loader2, Pen, X } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { Checkbox } from '@/components/ui/checkbox';

export interface TicketColumnMeta {
  livreurOptions: { value: string; label: string }[];
  restaurantOptions: { value: string; label: string }[];
  editingIds: Set<string>;
  editedTickets: Map<string, Ticket>;
  newTicketIds: Set<string>;
  permissions: { canCreate: boolean; canUpdate: boolean; canDelete: boolean };
  onTicketChange: (id: string, field: keyof Ticket, value: string) => void;
  onTicketPatch: (id: string, patch: Partial<Ticket>) => void;
  onSaveNew: (id: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelNew: (id: string) => void;
  onCancelEdit: (id: string) => void;
  onEditRow: (id: string) => void;
  isSavingNew: boolean;
  isSavingEdit: boolean;
  getDisplayTicket: (ticket: Ticket) => Ticket;
}

const isEditing = (ticket: Ticket, meta: TicketColumnMeta): boolean => {
  return ticket.isNew === true || meta.editingIds.has(ticket.id);
};

const isNew = (ticket: Ticket, meta: TicketColumnMeta): boolean => {
  return meta.newTicketIds.has(ticket.id);
};

export const createTicketColumns = (): ColumnDef<Ticket>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'code',
    header: 'Code Check',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <input
            type="text"
            value={ticket.code ?? ''}
            onChange={(e) => meta.onTicketChange(ticket.id, 'code', e.target.value)}
            className="w-full min-w-xs h-9 border border-gray-300 rounded px-2 py-1 text-xs"
            placeholder="Code CHECK"
          />
        );
      }
      return <span className="text-xs">{ticket.code}</span>;
    },
  },
  {
    accessorKey: 'livreur',
    header: 'Livreur',
    size: 260,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <Select
            options={meta.livreurOptions}
            value={meta.livreurOptions.find((o) => o.value === ticket.livreurId) ?? null}
            onChange={(option) => meta.onTicketChange(ticket.id, 'livreurId', option?.value ?? '')}
            placeholder="Sélectionner un livreur"
            isClearable
            className="text-xs min-w-52"
            classNamePrefix="react-select"
          />
        );
      }
      return <span className="text-xs">{ticket.livreur}</span>;
    },
  },
  {
    accessorKey: 'restaurant',
    header: 'Partner',
    size: 320,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <Select
            options={meta.restaurantOptions}
            value={meta.restaurantOptions.find((o) => o.value === ticket.restaurantId) ?? null}
            onChange={(option) => meta.onTicketChange(ticket.id, 'restaurantId', option?.value ?? '')}
            placeholder="Sélectionner un restaurant"
            isClearable
            className="text-xs min-w-52"
            classNamePrefix="react-select"
          />
        );
      }
      return <span className="text-xs">{ticket.restaurant}</span>;
    },
  },
  {
    accessorKey: 'nomZone',
    header: 'Zone',
    size: 260,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return <PriceListSelect ticketId={ticket.id} restaurantID={ticket.restaurantId} handleChange={meta.onTicketPatch} />;
      }
      return (
        <Tooltip className="text-xs" content={ticket.nomZone}>
          <span className="text-xs text-wrap line-clamp-2 max-w-56">{ticket.nomZone ?? 'Inconnue'}</span>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'montantLivraison',
    header: 'Montant de Livraison',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
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
        );
      }
      return <span className="text-xs">{formatCFA(ticket.montantLivraison)}</span>;
    },
  },
  {
    accessorKey: 'montantCommande',
    header: 'Montant de Commande',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <input
            value={ticket.montantCommande}
            onChange={(e) => meta.onTicketChange(ticket.id, 'montantCommande', e.target.value)}
            className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
            placeholder="0 CFA"
          />
        );
      }
      return <span className="text-xs">{formatCFA(ticket.montantCommande)}</span>;
    },
  },
  {
    accessorKey: 'coutLivraison',
    header: 'Commission',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return <input type="number" value={ticket.commission} readOnly placeholder="0 CFA" className="w-full h-9 px-2 py-1 text-xs text-right border border-gray-300 rounded bg-gray-50" />;
      }
      return <span className="text-xs">{formatCFA(ticket?.commission ?? 0)}</span>;
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <input type="date" value={ticket.date} onChange={(e) => meta.onTicketChange(ticket.id, 'date', e.target.value)} className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs" />
        );
      }
      return <span className="text-xs">{formatDateFR(ticket.date)}</span>;
    },
  },
  {
    accessorKey: 'heure',
    header: 'Heure',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <input type="time" value={ticket.heure} onChange={(e) => meta.onTicketChange(ticket.id, 'heure', e.target.value)} className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs" />
        );
      }
      return <span className="text-xs">{formatHoursMinutes(ticket.heure)}</span>;
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);

      // Nouveau ticket non encore sauvegardé
      if (isNew(ticket, meta)) {
        return (
          <div className="flex gap-2">
            <button
              onClick={() => meta.onSaveNew(ticket.id)}
              disabled={meta.isSavingNew}
              className="px-2 py-1 h-9 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center"
            >
              {meta.isSavingNew ? <Loader2 className="size-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
            </button>
            <button onClick={() => meta.onCancelNew(ticket.id)} className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      }

      // Ticket existant en mode édition
      if (meta.editingIds.has(ticket.id)) {
        return (
          <div className="flex gap-2">
            <button
              onClick={() => meta.onSaveEdit(ticket.id)}
              disabled={!meta.permissions.canUpdate || meta.isSavingEdit}
              className={`px-2 py-1 h-9 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center ${!meta.permissions.canUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {meta.isSavingEdit ? <Loader2 className="size-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
            </button>
            <button onClick={() => meta.onCancelEdit(ticket.id)} className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      }

      // Ticket existant en mode lecture
      if (meta.permissions.canUpdate) {
        return (
          <button onClick={() => meta.onEditRow(ticket.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center">
            <Pen className="w-4 h-4" />
          </button>
        );
      }

      return null;
    },
  },
];
