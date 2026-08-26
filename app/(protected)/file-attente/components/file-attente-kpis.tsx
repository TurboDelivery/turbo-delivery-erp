'use client';

import { AlertTriangle, PackageSearch, Store, Users } from 'lucide-react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';

import type { FileAttenteKpis as Kpis } from '../hooks/use-file-attente-vue';
import { pluriel } from '../utils/file-attente.utils';

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
    <GrilleStats colonnes={4}>
      <CarteStat
        libelle="Postes pourvus"
        valeur={String(kpis.postesPourvus)}
        note={`${pluriel(kpis.postesPourvus, 'partenaire')} avec au moins un livreur en file`}
        icone={Store}
        // A zero il n'y a rien a saluer : le vert ne recompense qu'un poste reellement pourvu.
        ton={kpis.postesPourvus > 0 ? 'succes' : 'neutre'}
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Livreurs en file"
        valeur={String(kpis.livreursEnFile)}
        note="ont pointé leur montée et attendent une course"
        icone={Users}
        // Volontairement neutre : sur cet ecran le rouge est reserve a l'alerte
        // « poste sans livreur ». Un total ne s'alarme pas.
        ton="neutre"
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Postes sans livreur"
        valeur={String(kpis.postesDeserts)}
        note={
          alerte
            ? 'aucune commande ne peut y être servie — à traiter'
            : 'tous les postes connus sont couverts'
        }
        icone={AlertTriangle}
        ton={alerte ? 'danger' : 'neutre'}
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Commandes en attente"
        valeur={kpis.commandesEnAttente == null ? '—' : String(kpis.commandesEnAttente)}
        note="courses du jour pas encore prises en charge"
        icone={PackageSearch}
        // Zero commande en attente est un bon etat, pas une alerte : pas d'ambre dans ce cas.
        ton={kpis.commandesEnAttente ? 'attention' : 'neutre'}
        isLoading={isLoading}
      />
    </GrilleStats>
  );
}
