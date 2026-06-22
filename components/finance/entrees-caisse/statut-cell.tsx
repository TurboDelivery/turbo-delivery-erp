'use client';

import { cn } from '@/lib/utils';
import { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';
import { useModifierEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';

/**
 * Pastille de statut « Payée / Non payée » cliquable : bascule le statut d'une entrée de caisse
 * directement depuis le tableau. Renvoie la ligne complète (le PUT backend écrase tous les champs).
 */
export function EntreeCaisseStatutCell({ entree }: { entree: IEntreeCaisse }) {
  const modifier = useModifierEntreeCaisseMutation();
  const paye = entree.paye;

  const toggle = () => {
    modifier.mutate({
      id: entree.id,
      data: {
        libelle: entree.libelle,
        montant: entree.montant,
        dateEntree: entree.dateEntree,
        commentaire: entree.commentaire ?? '',
        paye: !paye,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={modifier.isPending}
      aria-label={paye ? 'Marquer comme non payée' : 'Marquer comme payée'}
      title="Cliquer pour basculer le statut"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
        paye
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      )}
    >
      <span className={cn('size-1.5 rounded-full', paye ? 'bg-green-600' : 'bg-gray-400')} />
      {paye ? 'Payée' : 'Non payée'}
    </button>
  );
}
