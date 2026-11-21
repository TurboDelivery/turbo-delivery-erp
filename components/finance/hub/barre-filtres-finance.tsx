'use client';

import { Button } from '@heroui-v3/react';
import { ListFilter, RotateCcw } from 'lucide-react';
import React from 'react';

import { ChampListe, ChampTexte } from '@/components/commons/champs-formulaire';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import { ETAPES } from '@/features/finances-hub';

/**
 * LA BARRE DE FILTRES DU TABLEAU FINANCE.
 *
 * <h3>Pourquoi elle est encadrée et titrée</h3>
 * <p>Il y avait déjà un filtre sur cet écran : le sélecteur de catégories. Il était posé
 * nu, sur la même ligne que les six onglets. L'opérateur a demandé « on ne peut pas
 * filtrer ? » en le regardant. Un contrôle seul, sans cadre, au même niveau que des
 * onglets, ne se lit pas comme un filtre ; et son libellé, « Catégories », a la forme
 * d'un titre de section, ce qui achève de le faire passer pour tel.</p>
 *
 * <p>Les onglets disent QUELLE population on regarde, les filtres COMMENT on la réduit.
 * Ce sont deux gestes différents, ils occupent donc deux rangées différentes, et
 * celle-ci porte un cadre, une étiquette, et le compte de ce qu'elle a retenu.</p>
 *
 * <h3>⚠ `items-end`, jamais `items-center`</h3>
 * <p>Chaque champ porte son libellé AU-DESSUS, le bouton « Réinitialiser » n'en a pas.
 * Centrés, le bouton et l'étiquette flotteraient au milieu du bloc libellé + champ, et
 * les champs descendraient sous eux. Alignés par le bas, ce qu'on lit et ce qu'on clique
 * sont sur la même ligne. Le même défaut a déjà été corrigé sur deux autres écrans de
 * ce module.</p>
 */
export function BarreFiltresFinance({
  aDesFiltres,
  categories,
  etape,
  montantRetenu,
  onCategories,
  onEtape,
  onRecherche,
  onReinitialiser,
  recherche,
  retenues,
  total,
  /**
   * La recherche et l'étape ne valent que pour le tableau des charges.
   *
   * <p>Le grand livre est paginé CÔTÉ SERVEUR et porte son propre filtre de statut : une
   * recherche en mémoire n'y verrait que la page courante et mentirait sur le reste.
   * Seule la catégorie lui est commune, puisqu'elle part au serveur.</p>
   */
  surLeTableau = true,
}: {
  aDesFiltres: boolean;
  categories: string[];
  etape: string;
  /** Somme des lignes retenues. Affichée seulement quand un filtre est posé. */
  montantRetenu?: string;
  onCategories: (c: null | string[]) => void;
  onEtape: (v: string) => void;
  onRecherche: (v: string) => void;
  onReinitialiser: () => void;
  recherche: string;
  retenues?: number;
  surLeTableau?: boolean;
  total?: number;
}) {
  return (
    <div className="rounded-xl border border-separator bg-surface-secondary/40 p-3">
      <div className="flex flex-wrap items-end gap-3">
        {/*
          * ⚠ `w-full sm:w-auto` : sur telephone l'etiquette prend SA ligne.
          *
          * <p>Laissee sur la meme ligne que le premier champ, elle lui mangeait la moitie
          * de la largeur : le champ de recherche devenait une fente, et son propre libelle
          * se centrait au-dessus de cette fente au lieu de s'aligner sur son bord gauche.
          * Mesure a 375 px. La marge basse qui l'aligne sur la ligne des champs n'a de
          * sens qu'a partir du moment ou elle PARTAGE cette ligne, d'ou `sm:mb-2.5`.</p>
          */}
        <span className="inline-flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted sm:mb-2.5 sm:w-auto">
          <ListFilter aria-hidden="true" className="size-3.5" />
          Filtres
        </span>

        {surLeTableau && (
          <div className="w-full min-w-[12rem] flex-1 sm:w-auto sm:max-w-xs">
            <ChampTexte
              label="Rechercher"
              onChange={onRecherche}
              placeholder="Désignation ou catégorie…"
              valeur={recherche}
            />
          </div>
        )}

        <div className="w-full sm:w-72">
          <CategoriesSelectFilter onCategoriesChange={onCategories} selectedCategories={categories} />
        </div>

        {surLeTableau && (
          <div className="w-full sm:w-56">
            <ChampListe
              label="Étape"
              onChange={(v) => onEtape(v || 'tous')}
              options={ETAPES}
              valeur={etape}
            />
          </div>
        )}

        {aDesFiltres && (
          <Button className="mb-0.5" onPress={onReinitialiser} size="sm" variant="ghost">
            <RotateCcw aria-hidden="true" className="size-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/*
        * Ce que les filtres ont retenu, ET sur quel ensemble.
        *
        * <p>Sans le « sur N », un compteur réduit se lit comme le total du mois : c'est le
        * défaut qu'on vient de corriger sur les pastilles des onglets, il serait absurde
        * de le réintroduire ici.</p>
        */}
      {surLeTableau && aDesFiltres && retenues !== undefined && (
        <p className="mt-3 border-t border-separator pt-2.5 text-xs text-muted">
          <b className="text-foreground">{retenues}</b> ligne{retenues > 1 ? 's' : ''} retenue
          {retenues > 1 ? 's' : ''}
          {total !== undefined ? ` sur ${total}` : ''}
          {montantRetenu ? ' · ' : ''}
          {montantRetenu && <b className="tabular-nums text-foreground">{montantRetenu}</b>}
        </p>
      )}
    </div>
  );
}
