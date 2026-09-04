import Link from 'next/link';

import { Ecart, type SensHausse } from '@/components/commons/ecart';
import { cn } from '@/lib/utils';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * L'etat financier, lu comme un etat financier.
 *
 * <h3>Pourquoi une table, et pas des tuiles</h3>
 * <p>Ces grandeurs formaient un compte de resultat eparpille : le chiffre d'affaires
 * dans une carte verte, les depenses dans une tuile rouge, la marge dans une tuile
 * orange, separees par une tuile bleue sans rapport. Trois nombres dont le troisieme
 * est la difference des deux autres, poses a des tailles differentes, dans des couleurs
 * differentes, sans alignement commun. La forme EMPECHAIT de voir la soustraction.</p>
 *
 * <p>Deuxieme constat, celui qui supprime une section entiere : les « indicateurs de la
 * periode » et le « cumul tout l'historique » sont LES MEMES GRANDEURS sur deux periodes.
 * Ce sont deux COLONNES, pas deux sections de tuiles.</p>
 *
 * <h3>Pourquoi un `<table>` et non le `Table` de HeroUI v3</h3>
 * <p>La regle du projet impose HeroUI pour les TABLEAUX DE DONNEES — tries, pagines,
 * pilotes par un `ColumnDef` (reference : `facture-table.tsx`). Un compte de resultat
 * n'en est pas un : lignes fixes, aucun tri, aucune pagination, aucune selection.</p>
 *
 * <p>Verifie a l'ecran, pas suppose : le `Table` v3 rend un `<table role="grid">`. Le
 * role `grid` annonce une grille INTERACTIVE, ou l'on navigue cellule par cellule aux
 * fleches — faux pour un document qui se lit. Il n'expose pas non plus de `colSpan`,
 * indispensable pour les intitules de section, et son `Footer` est un simple `div`, donc
 * rien ne se range sous une colonne. Un `<table>` avec `scope="col"` et `scope="row"`
 * donne au lecteur d'ecran l'association ligne/colonne exacte, ce que le role `grid`
 * ne donne pas.</p>
 *
 * <h3>La cellule vide</h3>
 * <p>Le service ne fournit pas les decompositions sur le cumul : ni les frais de
 * livraison, ni les commissions, ni les charges fixes et variables depuis 2024. On
 * ecrit alors « — », jamais « 0 FCFA » : un zero se lit comme une mesure, un tiret se
 * lit comme une absence. La note sous la table dit ce que le tiret veut dire.</p>
 */

/** Une valeur dans une colonne. `null` = le service ne la fournit pas sur cette periode. */
export interface CelluleEtat {
    valeur: number | null;
    /** Page de detail, avec la periode deja appliquee. */
    href?: string;
    /** Libelle du lien pour les lecteurs d'ecran, quand « voir le detail » ne suffit pas. */
    intitule?: string;
}

export interface LigneEtat {
    cle: string;
    libelle: string;
    /** 0 = poste, 1 = sous-poste, 2 = detail de sous-poste. Porte le retrait. */
    niveau: 0 | 1 | 2;
    periode: CelluleEtat;
    cumul: CelluleEtat;
    /** Valeur de la periode precedente, pour l'ecart. Absente = pas de comparaison. */
    reference?: number;
    sens?: SensHausse;
    /** Ligne de total : filet au-dessus, graisse appuyee. */
    total?: boolean;
}

export interface SectionEtat {
    titre: string;
    lignes: LigneEtat[];
}

interface EtatFinancierProps {
    sections: SectionEtat[];
    libellePeriode: string;
    libelleCumul: string;
    /** Rappel de ce a quoi l'ecart compare, par ex. « vs periode precedente ». */
    libelleReference?: string;
    className?: string;
}

/** Retraits par niveau. Le retrait dit l'appartenance : ce poste fait partie du precedent. */
const RETRAIT: Record<0 | 1 | 2, string> = {
    0: 'ps-0',
    1: 'ps-4',
    2: 'ps-9',
};

function Cellule({ cellule, appuyee }: { cellule: CelluleEtat; appuyee?: boolean }) {
    if (cellule.valeur === null) {
        return (
            <span className="block text-right tabular-nums text-muted" title="non fourni sur cette période">
                —
            </span>
        );
    }

    const nul = cellule.valeur === 0;
    const negatif = cellule.valeur < 0;

    // `Intl` rend le signe avec un TRAIT D'UNION, etroit et facile a manquer au milieu
    // de chiffres a chasse fixe. Sur un etat financier, rater un signe change le sens de
    // la ligne : on pose le vrai signe moins, qui a la largeur d'un chiffre.
    const texte = formatCFA(cellule.valeur).replace(/^[-\u2212]/, '\u2212');

    const contenu = (
        <span
            className={cn(
                'block text-right tabular-nums',
                appuyee ? 'text-base font-bold' : 'text-sm font-medium',
                nul && 'font-normal text-muted',
                // Un resultat negatif se lit d'abord a sa couleur, ensuite a son signe.
                negatif && 'text-red-800 dark:text-red-400',
            )}
        >
            {texte}
        </span>
    );

    if (!cellule.href) return contenu;

    return (
        <Link
            aria-label={cellule.intitule}
            className="block rounded-sm hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            href={cellule.href}
        >
            {contenu}
        </Link>
    );
}

export function EtatFinancier({
    sections,
    libellePeriode,
    libelleCumul,
    libelleReference,
    className,
}: EtatFinancierProps) {
    return (
        <div className={cn('w-full', className)}>
            <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                    État financier : chaque poste sur la période choisie et sur le cumul depuis
                    l&apos;origine.
                </caption>
                {/*
                 * Pas de `<thead>` ici, volontairement. Le gabarit d'administration pose
                 * globalement `table thead tr { background-color: gray-200 !important }` dans
                 * `@layer components`. On ne peut pas le neutraliser depuis une classe
                 * utilitaire : avec les couches CSS, l'ordre des declarations `!important` est
                 * INVERSE, donc `@layer components` bat `@layer utilities`. Verifie a l'ecran —
                 * `bg-transparent!` s'appliquait bien a l'element et perdait quand meme.
                 * La regle ne vise que `thead` et `tfoot` : une rangee d'en-tete posee dans le
                 * `<tbody>`, avec ses `scope="col"`, donne la meme association ligne/colonne aux
                 * lecteurs d'ecran sans heriter du bandeau gris.
                 */}
                <tbody>
                    <tr className="border-b border-separator">
                        <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted" scope="col">
                            Poste
                        </th>
                        <th className="py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted" scope="col">
                            {libellePeriode}
                        </th>
                        <th
                            className="hidden py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted sm:table-cell"
                            scope="col"
                        >
                            {libelleCumul}
                        </th>
                    </tr>
                </tbody>

                {sections.map((section) => (
                    <tbody key={section.titre}>
                        <tr>
                            <th
                                className="pb-0.5 pt-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
                                colSpan={3}
                                scope="colgroup"
                            >
                                {section.titre}
                            </th>
                        </tr>
                        {section.lignes.map((ligne) => (
                            <tr
                                className={cn('group', 'border-b-0!')}
                                key={ligne.cle}
                            >
                                <th
                                    className={cn(
                                        'py-1 text-left font-normal',
                                        // Le filet du total est porte par les CELLULES : la regle globale
                                        // `table tbody tr { border-b ... !important }` gagnerait sur le `tr`.
                                        ligne.total && 'border-t border-foreground/25',
                                        RETRAIT[ligne.niveau],
                                        ligne.total ? 'font-semibold text-foreground' : 'text-foreground/90',
                                        ligne.niveau > 0 && 'text-[13px] text-muted',
                                    )}
                                    scope="row"
                                >
                                    <span className="flex flex-wrap items-baseline gap-x-2">
                                        {ligne.libelle}
                                        {ligne.reference !== undefined && ligne.periode.valeur !== null && (
                                            <Ecart
                                                libelleReference={libelleReference}
                                                reference={ligne.reference}
                                                sens={ligne.sens}
                                                valeur={ligne.periode.valeur}
                                            />
                                        )}
                                    </span>
                                </th>
                                <td className={cn('py-1 ps-4', ligne.total && 'border-t border-foreground/25')}>
                                    <Cellule appuyee={ligne.total} cellule={ligne.periode} />
                                </td>
                                <td className={cn('hidden py-1 ps-4 sm:table-cell', ligne.total && 'border-t border-foreground/25')}>
                                    <Cellule appuyee={ligne.total} cellule={ligne.cumul} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                ))}
            </table>

            <p className="mt-3 text-xs text-muted">
                <span aria-hidden="true">— </span>
                <span>
                    Un tiret signale une valeur que le service ne fournit pas sur cette période, et non
                    un montant nul.
                </span>
            </p>
        </div>
    );
}
