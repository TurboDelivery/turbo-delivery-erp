'use client';

import { useMemo, useState } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { colonnesVirements } from '@/components/finance/virements/virements-table-columns';
import { IVirementRecu } from '../types/virements.types';
import { usePayeursQuery, useVirementsQuery } from '../queries/virements.query';

/**
 * Le journal des virements, pour la sélection de payeurs en cours.
 *
 * <p>Le hook porte l'instance de table ; le composant ne fait que la rendre, comme
 * partout ailleurs dans l'ERP.</p>
 */
export function useVirementsTable(
  payeurIds: string[],
  onAnnuler: (virement: IVirementRecu) => void,
  peutAnnuler: boolean,
) {
  const payeurs = usePayeursQuery();
  const virements = useVirementsQuery(payeurIds);

  const [virementAAnnuler, setVirementAAnnuler] = useState<IVirementRecu | null>(null);

  const columns = useMemo(
    () => colonnesVirements(onAnnuler, peutAnnuler),
    [onAnnuler, peutAnnuler],
  );

  const data = useMemo(() => virements.data ?? [], [virements.data]);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  const total = useMemo(
    () => data.filter((v) => !v.annule).reduce((somme, v) => somme + (v.montant ?? 0), 0),
    [data],
  );

  return {
    table,
    colonnes: columns.length,
    payeurs: payeurs.data ?? [],
    chargement: payeurs.isLoading || virements.isLoading,
    enEchec: payeurs.isError || virements.isError,
    total,
    nombre: data.filter((v) => !v.annule).length,
    virementAAnnuler,
    setVirementAAnnuler,
  };
}
