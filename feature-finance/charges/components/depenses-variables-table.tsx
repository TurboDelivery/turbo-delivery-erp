'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Edit, Trash2, Loader2, Eye } from 'lucide-react';
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import { IChargeVariable, CyclePaiement } from '../types/charge-variable.type';
import { createUrlFile } from '@/utils/createUrlFile';

const CYCLE_LABELS: Record<CyclePaiement, string> = {
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  SEMESTRIEL: 'Semestriel',
  ANNUEL: 'Annuel',
  HEBDOMADAIRE: 'Hebdomadaire',
};

const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  EN_ATTENTE_DGA:  { label: 'En attente DGA',  className: 'bg-yellow-100 text-yellow-700' },
  VALIDE_DGA:      { label: 'Validé DGA',       className: 'bg-blue-100 text-blue-700' },
  REJETE_DGA:      { label: 'Rejeté DGA',       className: 'bg-red-100 text-red-700' },
  APPROUVE_DG:     { label: 'Approuvé DG',      className: 'bg-green-100 text-green-700' },
  REJETE_DG:       { label: 'Rejeté DG',        className: 'bg-red-100 text-red-700' },
  DECAISSE:        { label: 'Décaissé',          className: 'bg-purple-100 text-purple-700' },
};

interface DepensesVariablesTableProps {
  data: IChargeVariable[];
  isLoading?: boolean;
  onEdit?: (charge: IChargeVariable) => void;
  onDelete?: (charge: IChargeVariable) => void;
}

export default function DepensesVariablesTable({ data, isLoading, onEdit, onDelete }: DepensesVariablesTableProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');
  const columns: ColumnDef<IChargeVariable>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-gray-700 text-sm">
          {new Date(row.getValue<string>('createdAt')).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Désignation',
      cell: ({ row }) => (
        <p className="font-semibold text-gray-900 text-sm">{row.getValue('designation')}</p>
      ),
    },
    {
      id: 'categorie',
      header: 'Catégorie',
      cell: ({ row }) => (
        <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
          {row.original.categorie?.nomCategorie ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'cyclePaiement',
      header: 'Cycle',
      cell: ({ row }) => {
        const cycle = row.getValue<CyclePaiement>('cyclePaiement');
        return <span className="text-gray-700 text-sm">{CYCLE_LABELS[cycle] ?? cycle}</span>;
      },
    },
    {
      accessorKey: 'montant',
      header: 'Montant (FCFA)',
      cell: ({ row }) => (
        <span className="text-gray-900 font-semibold text-sm">
          {row.getValue<number>('montant').toLocaleString('fr-FR')} FCFA
        </span>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ row }) => {
        const statut = row.getValue<string>('statut');
        const config = STATUT_CONFIG[statut] ?? { label: statut, className: 'bg-gray-100 text-gray-700' };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'justificatif',
      header: 'Justificatif',
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>('justificatif');
        if (!val) return <span className="text-gray-400 text-sm">—</span>;
        const url = createUrlFile(val, 'backend');
        return (
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            startContent={<Eye size={14} />}
            onPress={() => setPreviewUrl(url)}
          >
            Voir
          </Button>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            className="text-blue-500 hover:text-blue-700 transition-colors"
            onClick={() => onEdit?.(row.original)}
          >
            <Edit size={16} />
          </button>
          <button
            className="text-red-500 hover:text-red-700 transition-colors"
            onClick={() => onDelete?.(row.original)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Aucune dépense variable enregistrée.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de prévisualisation du justificatif */}
      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="text-purple-600">Justificatif</ModalHeader>
          <ModalBody className="pb-6">
            {previewUrl && (
              isPdf(previewUrl) ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg border"
                  title="Justificatif PDF"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Justificatif"
                  className="w-full object-contain max-h-[70vh] rounded-lg"
                />
              )
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
