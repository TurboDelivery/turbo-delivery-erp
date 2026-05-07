'use client';

import { useMemo } from 'react';
import { CheckCircle2, Phone, Star, XCircle } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Divider,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { getCoreRowModel, useReactTable, flexRender, type ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { IGrillePaiementLigne, IGrillePaiementTicketDetail } from '../types/grille-paiement.type';

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function TicketDetailsTable({ data, creneauCode }: { data: IGrillePaiementTicketDetail[]; creneauCode: string }) {
  const columns = useMemo<ColumnDef<IGrillePaiementTicketDetail>[]>(
    () => [
      {
        accessorKey: 'ref',
        header: 'Ticket',
        cell: ({ getValue }) => (
          <span className="font-medium text-blue-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'partenaire',
        header: 'Partenaire',
        cell: ({ getValue }) => <span className="text-gray-700">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ getValue }) => (
          <span className="text-gray-500">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'commission',
        header: 'Commission',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-800">{formatNumber(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-800">
          Détail des {data.length} ticket{data.length > 1 ? 's' : ''}
        </p>
        <Chip
          size="sm"
          variant="flat"
          color="default"
          classNames={{ base: 'bg-gray-100', content: 'text-gray-400 text-xs' }}
        >
          {creneauCode.replace('CRÉNEAU-', '')}
        </Chip>
      </div>
      <Card shadow="none" className="border border-gray-100 overflow-hidden">
        <CardBody className="p-0">
          <Table
            removeWrapper
            isStriped
            classNames={{ th: 'bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 font-semibold', td: 'text-xs py-2.5' }}
          >
            <TableHeader>
              {table.getFlatHeaders().map((header) => (
                <TableColumn key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody emptyContent="Aucun ticket trouvé pour ce créneau.">
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

interface Props {
  ligne: IGrillePaiementLigne | null;
  creneauCode: string;
  open: boolean;
  onClose: () => void;
}

export default function GrillePaiementDetailModal({ ligne, creneauCode, open, onClose }: Props) {
  if (!ligne) return null;

  const { turboy, tickets, brut, taux, deductions, netAPayer, numeroWave, bonusEligibilite, ticketDetails } = ligne;

  return (
    <Drawer isOpen={open} onOpenChange={(v) => !v && onClose()} placement="right" size="lg">
      <DrawerContent>
        {/* Header */}
        <DrawerHeader className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <Avatar
            name={turboy.nom}
            classNames={{ base: 'bg-orange-500 shrink-0', name: 'text-white font-bold text-xl' }}
            size="lg"
            radius="lg"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{turboy.nom}</h2>
            <p className="text-xs text-gray-400">{turboy.code}</p>
            <p className="text-xs text-gray-500 mt-1">
              Détail du paiement — {tickets} tickets pour le créneau{' '}
              {creneauCode.replace('CRÉNEAU-', '')}
            </p>
          </div>
        </DrawerHeader>

        <DrawerBody className="flex flex-col overflow-hidden p-0">
          {/* Scrollable zone */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'BRUT', value: formatNumber(brut), sub: 'FCFA' },
              { label: 'TAUX', value: `${taux}`, sub: '%', highlight: true },
              {
                label: 'DÉDUCTIONS',
                value: deductions !== 0 ? `−${formatNumber(Math.abs(deductions))}` : '—',
                sub: deductions !== 0 ? 'FCFA' : '',
              },
              { label: 'NET À PAYER', value: formatNumber(netAPayer), sub: 'FCFA', bold: true },
            ].map(({ label, value, sub, highlight, bold }) => (
              <Card key={label} shadow="none" className="border border-gray-100 bg-gray-50">
                <CardBody className="px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    {label}
                  </p>
                  <p
                    className={cn(
                      'text-xl font-bold leading-tight',
                      highlight ? 'text-amber-500' : bold ? 'text-gray-900' : 'text-gray-700',
                    )}
                  >
                    {value}
                    {sub && (
                      <span className="ml-1 text-sm font-medium text-gray-400">{sub}</span>
                    )}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Bonus eligibility */}
          <Card shadow="none" className="border border-gray-100">
            <CardHeader className="flex items-center gap-2 bg-red-50 px-4 py-2.5 rounded-t-xl">
              <Avatar
                icon={<Star className="h-3.5 w-3.5 text-red-500" />}
                classNames={{ base: 'bg-red-100 w-6 h-6 min-w-6', icon: 'text-red-500' }}
                radius="sm"
                size="sm"
              />
              <span className="text-sm font-semibold text-gray-800">
                Calculateur de commission — Éligibilité bonus
              </span>
            </CardHeader>
            <Divider />
            <CardBody className="p-0">
            <div className="divide-y divide-gray-50 max-h-[256px] overflow-y-auto">
              {bonusEligibilite.criteres.map((critere) => (
                <div key={critere.label} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      icon={<Star className="h-4 w-4" />}
                      classNames={{ base: 'bg-gray-100 w-8 h-8 min-w-8 shrink-0', icon: 'text-gray-500' }}
                      radius="md"
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{critere.label}</p>
                      <p className="text-xs text-gray-400">{critere.detail}</p>
                    </div>
                  </div>
                  {critere.valide ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-400 shrink-0" />
                  )}
                </div>
              ))}

              {/* Taux final */}
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar
                  icon={<Star className="h-4 w-4" />}
                  classNames={{ base: 'bg-gray-100 w-8 h-8 min-w-8 shrink-0', icon: 'text-gray-400' }}
                  radius="md"
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {bonusEligibilite.tauxFinalLabel}
                  </p>
                  <p className="text-xs text-gray-400">{bonusEligibilite.tauxFinalDetail}</p>
                </div>
              </div>
            </div>
            </CardBody>
          </Card>

          {/* Ticket details */}
          <TicketDetailsTable data={ticketDetails} creneauCode={creneauCode} />
          </div>

          {/* Wave — toujours visible en bas */}
          <div className="shrink-0 px-6 pb-5 pt-3 border-t border-gray-100">
            <Card
              shadow="none"
              className={cn(
                'border',
                numeroWave ? 'bg-gray-50 border-gray-100' : 'bg-red-50 border-red-100',
              )}
            >
              <CardBody className="flex flex-row items-center gap-3 px-4 py-3">
                <Avatar
                  icon={<Phone className="h-4 w-4" />}
                  classNames={{
                    base: cn('shrink-0', numeroWave ? 'bg-gray-200' : 'bg-red-100'),
                    icon: cn(numeroWave ? 'text-gray-500' : 'text-red-500'),
                  }}
                  radius="full"
                  size="md"
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Numéro Wave de paiement
                  </p>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      numeroWave ? 'text-gray-800' : 'italic text-red-500',
                    )}
                  >
                    {numeroWave ?? 'Non renseigné'}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
