'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEntreeCaisseListQuery } from '@/features/entrees-caisse/queries/entree-caisse-list.query';
import { EntreeCaisseStatutCell } from '@/components/finance/entrees-caisse/statut-cell';
import EtatErreur from '@/components/commons/EtatErreur';

export function EntreeCaisseMiniTable() {
  const router = useRouter();
  const { data: entries, isLoading, isError, isFetching, refetch } = useEntreeCaisseListQuery();
  const derniers5 = (entries || []).slice(0, 5);

  // meme bloc pour les deux rendus (tableau desktop, cartes mobiles) : un seul est visible a la fois
  const zoneErreur = <EtatErreur quoi="les entrées caisse" onReessayer={() => refetch()} enCours={isFetching} />;

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
      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block">
        <Table isStriped>
          <TableHeader>
            <TableColumn>Libellé</TableColumn>
            <TableColumn>Montant</TableColumn>
            <TableColumn>Statut</TableColumn>
            <TableColumn>Date</TableColumn>
          </TableHeader>
          {/* sur echec, l'erreur prend la place du message vide qui se lirait comme "il n'y a rien" */}
          <TableBody
            emptyContent={isError ? zoneErreur : 'Aucune entrée caisse'}
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
                <TableCell>
                  <EntreeCaisseStatutCell entree={entry} />
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(entry.dateEntree), 'dd/MM/yyyy', { locale: fr })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`m-skel-${i}`} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : isError ? (
          zoneErreur
        ) : derniers5.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aucune entrée caisse</p>
        ) : (
          derniers5.map((entry) => (
            <div key={entry.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 min-w-0 break-words">{entry.libelle}</p>
                <span className="text-sm font-semibold text-gray-900 shrink-0">{entry.montant.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">Date</span>
                <span className="text-sm text-gray-500">{format(new Date(entry.dateEntree), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">Statut</span>
                <EntreeCaisseStatutCell entree={entry} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
