'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEntreeCaisseListQuery } from '@/features/entrees-caisse/queries/entree-caisse-list.query';

export function EntreeCaisseMiniTable() {
  const router = useRouter();
  const { data: entries, isLoading } = useEntreeCaisseListQuery();
  const derniers5 = (entries || []).slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          5 dernières entrées caisse
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-primary"
          onClick={() => router.push('/finance/entrees-caisse')}
        >
          Voir tout
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
      <Table isStriped>
        <TableHeader>
          <TableColumn>Libellé</TableColumn>
          <TableColumn>Montant</TableColumn>
          <TableColumn>Date</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="Aucune entrée"
          isLoading={isLoading}
          loadingContent={
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          }
        >
          {derniers5.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-sm">{entry.libelle}</TableCell>
              <TableCell className="text-sm font-semibold">
                {entry.montant.toLocaleString('fr-FR')} FCFA
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {format(new Date(entry.dateEntree), 'dd/MM/yyyy', { locale: fr })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
