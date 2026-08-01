'use client';

import { Skeleton } from '@heroui/react';
import { AlertTriangle, PackageSearch, Store, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { FileAttenteKpis as Kpis } from '../hooks/use-file-attente-vue';
import { pluriel } from '../utils/file-attente.utils';

interface CarteProps {
  libelle: string;
  valeur: string;
  note: string;
  icone: LucideIcon;
  /** Classes de la pastille d'icône (fond teinté + icône). */
  pastille: string;
  /** Couleur du chiffre. */
  chiffre: string;
  isLoading?: boolean;
}

function Carte({ libelle, valeur, note, icone: Icone, pastille, chiffre, isLoading }: CarteProps) {
  return (
    <div className="rounded-2xl border border-default-200/50 bg-white p-4 dark:bg-content1">
      <span className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${pastille}`}>
        <Icone className="h-5 w-5" />
      </span>
      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-16 rounded-md" />
      ) : (
        <p className={`mt-3 text-3xl font-bold leading-none tabular-nums ${chiffre}`}>{valeur}</p>
      )}
      <p className="mt-2 text-[13px] font-semibold text-default-700">{libelle}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-default-400">{note}</p>
    </div>
  );
}

/**
 * Les quatre chiffres de tête d'écran.
 *
 * <p>Le troisième — les postes sans personne en file — est le seul qui appelle
 * une action. Un poste déserté ne peut servir aucune commande, quel que soit le
 * nombre de livreurs en service ailleurs : il passe au rouge dès qu'il n'est
 * plus à zéro, et remonte en tête de la liste en dessous.</p>
 */
export function FileAttenteKpis({ kpis, isLoading }: { kpis: Kpis; isLoading: boolean }) {
  const alerte = kpis.postesDeserts > 0;

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Carte
        libelle="Postes pourvus"
        valeur={String(kpis.postesPourvus)}
        note={`${pluriel(kpis.postesPourvus, 'partenaire')} avec au moins un livreur en file`}
        icone={Store}
        pastille="bg-[#1AA05A]/10 text-[#1AA05A]"
        chiffre={kpis.postesPourvus > 0 ? 'text-[#1AA05A]' : 'text-default-400'}
        isLoading={isLoading}
      />
      <Carte
        libelle="Livreurs en file"
        valeur={String(kpis.livreursEnFile)}
        note="ont pointé leur montée et attendent une course"
        icone={Users}
        // Volontairement neutre : sur cet écran le rouge est réservé à
        // l'alerte « poste sans livreur ». Un total ne s'alarme pas.
        pastille="bg-default-100 text-default-500"
        chiffre="text-default-700"
        isLoading={isLoading}
      />
      <Carte
        libelle="Postes sans livreur"
        valeur={String(kpis.postesDeserts)}
        note={
          alerte
            ? 'aucune commande ne peut y être servie — à traiter'
            : 'tous les postes connus sont couverts'
        }
        icone={AlertTriangle}
        pastille={alerte ? 'bg-[#E11D48]/10 text-[#E11D48]' : 'bg-default-100 text-default-400'}
        chiffre={alerte ? 'text-[#E11D48]' : 'text-default-400'}
        isLoading={isLoading}
      />
      <Carte
        libelle="Commandes en attente"
        valeur={kpis.commandesEnAttente == null ? '—' : String(kpis.commandesEnAttente)}
        note="courses du jour pas encore prises en charge"
        icone={PackageSearch}
        pastille="bg-[#D97706]/10 text-[#D97706]"
        chiffre={kpis.commandesEnAttente ? 'text-[#D97706]' : 'text-default-400'}
        isLoading={isLoading}
      />
    </div>
  );
}
