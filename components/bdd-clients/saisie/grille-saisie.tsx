'use client';

import { Check, CircleAlert, RotateCcw } from 'lucide-react';
import React from 'react';

import {
  COLONNES_GRILLE,
  appliquerCollage,
  type ColonneGrille,
  type IVerdictLigne,
  type LigneGrille,
} from '@/features/bdd-clients';

/**
 * La grille de saisie d'un lot de tickets.
 *
 * <h3>Pourquoi ce n'est PAS un Table HeroUI, contrairement à la règle du dépôt</h3>
 * <p>Le `Table` v3 rend un `<table role="grid">` de react-aria : une grille de NAVIGATION,
 * qui capte les flèches et la tabulation pour déplacer le focus de cellule en cellule.
 * C'est exactement ce dont un champ de saisie a besoin pour lui-même, et les deux se
 * disputent la touche. Des cellules éditables dans un `Table` v3 ont déjà été tentées dans
 * ce dépôt : la branche est morte, alimentée par une liste vide.</p>
 *
 * <p>Le cahier des charges demande une cadence de quinze secondes par ligne, une
 * navigation Tab/Entrée et un collage multi-lignes depuis Excel. Ces trois exigences
 * portent sur le CLAVIER : elles passent avant le choix du composant. C'est la même
 * exception que l'état financier, documentée pour la même raison — un document qui n'est
 * pas une grille de données interactive n'a rien à faire dans un `Table`.</p>
 *
 * <h3>Ce que la couleur dit</h3>
 * <p>Une seule : le rouge d'une ligne refusée, qui appelle une correction. « Contact déjà
 * capturé » n'est pas un problème, c'est le cas NORMAL d'un client fidèle : il se marque
 * d'une flèche et d'un compte, jamais d'une couleur. Peindre les deux reviendrait à ne
 * rien dire.</p>
 */

const ENTETES: Record<ColonneGrille, string> = {
  nom: 'Nom',
  contact: 'Contact',
  prenom: 'Prénom',
  zoneSaisie: 'Zone',
  numCheck: 'N° check',
  montant: 'Montant',
  articles: 'Commentaire',
};

/** Le contact est le seul champ bloquant : il est le plus large et vient en second. */
const LARGEURS: Record<ColonneGrille, string> = {
  nom: 'w-[18%]',
  contact: 'w-[16%]',
  prenom: 'w-[12%]',
  zoneSaisie: 'w-[14%]',
  numCheck: 'w-[11%]',
  montant: 'w-[11%]',
  articles: 'w-[18%]',
};

function Etat({ verdict }: { verdict?: IVerdictLigne }) {
  if (!verdict) {
    return <span className="text-xs text-muted">·</span>;
  }
  if (verdict.etat === 'BLOQUE') {
    return (
      <span
        className="flex items-center gap-1 text-xs text-danger-soft-foreground"
        title={verdict.motif ?? undefined}
      >
        <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
      </span>
    );
  }
  if (verdict.etat === 'CONNU') {
    return (
      <span
        className="flex items-center gap-1 whitespace-nowrap text-xs text-muted"
        title={
          verdict.dejaChezCePartenaire
            ? `Déjà ${verdict.nbCaptures} captures, dont chez ce partenaire`
            : `Déjà ${verdict.nbCaptures} captures, chez d'autres partenaires`
        }
      >
        <RotateCcw aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="tabular-nums">{verdict.nbCaptures}</span>
      </span>
    );
  }
  return (
    <span className="text-success-soft-foreground" title="Nouveau client">
      <Check aria-hidden="true" className="size-3.5" />
    </span>
  );
}

export function GrilleSaisie({
  grille,
  maximum,
  onChange,
  onTronque,
  verdicts,
}: {
  grille: LigneGrille[];
  /** Le serveur refuse le lot entier au-delà : la grille s'arrête avant. */
  maximum: number;
  onChange: (grille: LigneGrille[]) => void;
  onTronque: (nb: number) => void;
  verdicts: Map<number, IVerdictLigne>;
}) {
  const modifier = (ligne: number, colonne: ColonneGrille, valeur: string) => {
    const suivante = grille.map((l, i) => (i === ligne ? { ...l, [colonne]: valeur } : l));
    onChange(suivante);
  };

  /**
   * Entrée descend d'une ligne dans la même colonne.
   *
   * <p>C'est le geste du tableur, et c'est celui qu'attend quelqu'un qui recopie une pile
   * de tickets : on remplit une colonne, pas une ligne. La tabulation, elle, garde son
   * comportement natif et traverse la ligne.</p>
   */
  const surTouche = (e: React.KeyboardEvent, ligne: number, colonne: ColonneGrille) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const cible = document.querySelector<HTMLInputElement>(
      `[data-cellule="${ligne + 1}-${colonne}"]`,
    );
    cible?.focus();
    cible?.select();
  };

  const surCollage = (
    e: React.ClipboardEvent,
    ligne: number,
    colonne: ColonneGrille,
  ) => {
    const texte = e.clipboardData.getData('text/plain');
    // Un collage d'une seule cellule est une saisie ordinaire : on laisse faire le
    // navigateur, sans quoi coller un numéro copié ailleurs deviendrait un événement.
    if (!texte || (!texte.includes('\t') && !texte.includes('\n'))) return;

    e.preventDefault();
    const { grille: suivante, tronque } = appliquerCollage(
      grille,
      texte,
      { colonne: COLONNES_GRILLE.indexOf(colonne), ligne },
      maximum,
    );
    onChange(suivante);
    onTronque(tronque);
  };

  return (
    <div className="overflow-auto rounded-xl border border-separator">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface-secondary">
          <tr>
            <th className="w-10 px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted" scope="col">
              <span className="sr-only">État</span>
            </th>
            <th className="w-10 px-1 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted" scope="col">
              N°
            </th>
            {COLONNES_GRILLE.map((colonne) => (
              <th
                className={`${LARGEURS[colonne]} px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted`}
                key={colonne}
                scope="col"
              >
                {ENTETES[colonne]}
                {colonne === 'contact' ? (
                  <span className="text-danger-soft-foreground" title="Seul champ obligatoire">
                    {' '}
                    *
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grille.map((ligne, index) => {
            const verdict = verdicts.get(index + 1);
            const bloquee = verdict?.etat === 'BLOQUE';
            return (
              <tr
                className={bloquee ? 'bg-danger-soft/30' : undefined}
                key={index}
              >
                <td className="px-2 py-1 align-middle">
                  <Etat verdict={verdict} />
                </td>
                <td className="px-1 py-1 text-right align-middle text-xs tabular-nums text-muted">
                  {index + 1}
                </td>
                {COLONNES_GRILLE.map((colonne) => (
                  <td className="px-1 py-1" key={colonne}>
                    <input
                      aria-label={`${ENTETES[colonne]} ligne ${index + 1}`}
                      className={[
                        'w-full rounded-medium border bg-surface px-2 py-1.5 text-sm outline-none',
                        'focus:border-accent focus:ring-1 focus:ring-accent',
                        colonne === 'montant' ? 'text-right tabular-nums' : '',
                        bloquee && colonne === 'contact'
                          ? 'border-danger'
                          : 'border-separator',
                      ].join(' ')}
                      data-cellule={`${index}-${colonne}`}
                      inputMode={
                        colonne === 'montant' || colonne === 'contact' ? 'numeric' : undefined
                      }
                      onChange={(e) => modifier(index, colonne, e.target.value)}
                      onKeyDown={(e) => surTouche(e, index, colonne)}
                      onPaste={(e) => surCollage(e, index, colonne)}
                      value={ligne[colonne]}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/*
        Le motif du refus s'affiche SOUS la grille et non dans une infobulle seule : un
        message qui n'apparaît qu'au survol n'existe pas pour quelqu'un qui saisit au
        clavier, et c'est précisément lui qu'il faut renseigner.
      */}
      {[...verdicts.values()].some((v) => v.etat === 'BLOQUE') ? (
        <ul className="flex flex-col gap-1 border-t border-separator bg-danger-soft/20 px-3 py-2">
          {[...verdicts.values()]
            .filter((v) => v.etat === 'BLOQUE')
            .map((v) => (
              <li className="text-xs text-danger-soft-foreground" key={v.index}>
                <span className="font-medium tabular-nums">Ligne {v.index}</span> · {v.motif}
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
