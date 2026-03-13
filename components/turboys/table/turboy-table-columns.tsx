'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ITurboy } from '@/features/turboys/types/turboys.types';
import { Avatar, Chip } from '@heroui/react';
import { Mail, Phone } from 'lucide-react';

const getTypeColor = (type: string) => {
  switch (type) {
    case 'INDEPENDANT':
      return 'warning';
    case 'JOURNALIER':
      return 'secondary';
    default:
      return 'default';
  }
};

const getStatusColor = (status: number) => {
  if (status === 1) return 'success';
  if (status === 0) return 'danger';
  return 'warning';
};

const getStatusLabel = (status: number) => {
  if (status === 1) return 'Actif';
  if (status === 0) return 'Inactif';
  return 'Inconnu';
};

export const turboyColumns: ColumnDef<ITurboy>[] = [
  {
    accessorKey: 'prenoms',
    header: 'Nom',
    cell: ({ row }) => {
      const turboy = row.original;
      const email = row.original.email || '-';
      const tel = row.original.telephone || '-';
      return (
        <div className="flex items-center gap-3">
          <Avatar isBordered as="button" className="transition-transform" color="secondary" name={`${turboy.prenoms} ${turboy.nom}`} size="sm" src={turboy.avatarUrl ?? undefined} />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {turboy.prenoms} {turboy.nom}
            </span>
            <span className="text-xs text-gray-500 flex gap-1">
              <Phone className="w-4 h-4 text-gray-400" /> {tel}
            </span>
            <span className="text-xs text-gray-500 flex gap-1">
              <Mail className="w-4 h-4 text-gray-400" /> {email}
            </span>
          </div>
        </div>
      );
    },
  },
  // {
  //   accessorKey: 'type',
  //   header: 'Type',
  //   cell: ({ row }) => {
  //     const type = row.original.type;
  //     return (
  //       <Chip
  //         size="sm"
  //         variant="flat"
  //         color={getTypeColor(type)}
  //         className="capitalize"
  //       >
  //         {type}
  //       </Chip>
  //     );
  //   },
  // },
  // {
  //   accessorKey: 'telephone',
  //   header: 'Téléphone',
  //   cell: ({ row }) => {
  //     const telephone = row.original.telephone;
  //     return (
  //       <div className="flex items-center gap-2">
  //         <Phone className="w-4 h-4 text-gray-400" />
  //         <span className="text-sm">{telephone || '-'}</span>
  //       </div>
  //     );
  //   },
  // },
  // {
  //   accessorKey: 'email',
  //   header: 'Email',
  //   cell: ({ row }) => {
  //     const email = row.original.email;
  //     return (
  //       <div className="flex items-center gap-2">
  //         <Mail className="w-4 h-4 text-gray-400" />
  //         <span className="text-sm">{email || '-'}</span>
  //       </div>
  //     );
  //   },
  // },
  {
    accessorKey: 'gender',
    header: 'Genre',
    cell: ({ row }) => {
      const gender = row.original.gender;
      return (
        <span className="text-sm">
          {gender === 'HOMME' ? '🧑' : '👩'} {gender}
        </span>
      );
    },
  },
  {
    accessorKey: 'immatriculation',
    header: 'Immatriculation',
    cell: ({ row }) => {
      const immatriculation = row.original.immatriculation;
      return <span className="text-sm font-mono">{immatriculation || '-'}</span>;
    },
  },
  {
    accessorKey: 'matricule',
    header: 'Matricule',
    cell: ({ row }) => {
      const matricule = row.original.matricule;
      return <span className="text-sm font-mono">{matricule || '-'}</span>;
    },
  },
  // {
  //   accessorKey: 'status',
  //   header: 'Statut',
  //   cell: ({ row }) => {
  //     const status = row.original.status;
  //     return (
  //       <Chip
  //         size="sm"
  //         variant="flat"
  //         color={getStatusColor(status)}
  //       >
  //         {getStatusLabel(status)}
  //       </Chip>
  //     );
  //   },
  // },
  {
    accessorKey: 'deleted',
    header: 'Supprimé',
    cell: ({ row }) => {
      const deleted = row.original.deleted;
      return (
        <Chip
          size="sm"
          variant="flat"
          color={deleted ? 'danger' : 'success'}
        >
          {deleted ? 'Oui' : 'Non'}
        </Chip>
      );
    },
  },
];

