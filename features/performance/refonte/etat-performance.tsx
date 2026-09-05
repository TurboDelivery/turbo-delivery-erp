'use client';

import { Button, Card, SearchField, Table, Tooltip } from '@heroui-v3/react';
import type { SortDescriptor } from '@heroui-v3/react';
import React from 'react';

import { cn } from '@/lib/utils';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * L'état de performance hebdomadaire, refondu.
 *
 * <h3>Ce que l'écran était</h3>
 * <p>Une bande par livreur, chacune dans son propre conteneur à défilement horizontal, la
 * barre de défilement masquée. Deux conséquences : on ne peut pas comparer deux personnes,
 * puisque leurs colonnes ne sont jamais alignées, et une valeur peut se trouver hors du
 * cadre sans que rien ne l'indique.</p>
 *
 * <p>La commission et la prime — les deux chiffres pour lesquels on ouvre cet écran —
 * étaient rendues BRUTES : ni séparateur de milliers, ni devise. « 12500 » là où il faut
 * lire « 12 500 FCFA ». Un montant qu'on ne peut pas lire d'un coup d'oeil ne se vérifie
 * pas.</p>
 *
 * <p>Et la pagination était CLIENTE, cinq lignes par page, calculée sur des données déjà
 * toutes reçues : le serveur envoyait la semaine entière, l'écran en montrait cinq.</p>
 *
 * <h3>Les trois questions</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : ce que la semaine coûte. Le total de
 *       commission et de prime ouvre l'écran — c'est la seule chose qu'un responsable
 *       vérifie avant de valider une paie, et elle n'existait nulle part.</li>
 *   <li><b>Ce qui appelle une action</b> : rien ici, c'est un état en LECTURE. Ce qui
 *       appelle donc, c'est la capacité de CHERCHER : trier sur les montants, trouver
 *       quelqu'un par son nom. Aucun des deux n'existait.</li>
 *   <li><b>La forme de la donnée</b> : un état financier se lit en colonnes alignées et
 *       comparables, chasse tabulaire, montants à droite, avec une ligne de totaux. Pas en
 *       bandes qui défilent chacune pour soi.</li>
 * </ul>
 */

export interface EtatJour {
    date: string;
    jour: string;
    statut: string;
}

export interface LignePerformance {
    id: string;
    nomComplet: string;
    avatarUrl?: string;
    etats: EtatJour[];
    performance: number;
    commission: number;
    prime: number;
}

type Colonne = 'nom' | 'performance' | 'commission' | 'prime';

interface EtatPerformanceProps {
    lignes: LignePerformance[];
    libelleSemaine: string;
    /** Les semaines disponibles, pour changer de période. */
    semaines: { cle: string; libelle: string }[];
    semaineActive: string;
    onSemaine: (cle: string) => void;
    /** Menu d'actions d'une ligne : voir sur la carte, ouvrir les créneaux. */
    rendreActions?: (ligne: LignePerformance) => React.ReactNode;
    isLoading?: boolean;
    isError?: boolean;
    onReessayer?: () => void;
}

/** Largeurs des barres du squelette, colonne par colonne. */
const COLONNES_SQUELETTE = ['w-40', 'w-32', 'w-16', 'w-20', 'w-20', 'w-8'];

/*
 * Des JETONS du theme, pas des couleurs de la palette Tailwind : `bg-green-500` ne suit
 * ni le mode sombre ni un changement de theme, `bg-success` si.
 */
const TEINTE_STATUT: Record<string, string> = {
    VALIDE: 'bg-success',
    EN_COURS: 'bg-warning',
    MANQUE: 'bg-danger',
};

/** Faible, Moyenne, Forte : les seuils d'origine, conservés. */
function libellePerformance(v: number): string {
    if (v <= 20) return 'Faible';
    if (v <= 50) return 'Moyenne';
    if (v < 100) return 'Forte';
    return 'Très forte';
}

function tonPerformance(v: number): string {
    if (v <= 35) return 'text-danger-soft-foreground';
    if (v <= 70) return 'text-warning-soft-foreground';
    return 'text-success-soft-foreground';
}

export function EtatPerformance({
    lignes,
    libelleSemaine,
    semaines,
    semaineActive,
    onSemaine,
    rendreActions,
    isLoading = false,
    isError = false,
    onReessayer,
}: EtatPerformanceProps) {
    const [recherche, setRecherche] = React.useState('');
    /*
     * Le tri est celui du composant, pas le mien. `Table.Content` prend un
     * `sortDescriptor` et le rend par `Table.SortableColumnHeader` : l'indicateur, le role
     * ARIA `aria-sort` et la navigation au clavier viennent avec. Je les avais reecrits a
     * la main sur des `<button>` dans des `<th>` bruts, ce que la regle du projet interdit
     * explicitement — et ma version n'annoncait rien aux lecteurs d'ecran.
     */
    const [tri, setTri] = React.useState<SortDescriptor>({
        column: 'nom',
        direction: 'ascending',
    });

    const visibles = React.useMemo(() => {
        const q = recherche.trim().toLowerCase();
        const filtrees = q ? lignes.filter((l) => l.nomComplet.toLowerCase().includes(q)) : lignes;
        const signe = tri.direction === 'ascending' ? 1 : -1;
        const colonne = tri.column as Colonne;
        return [...filtrees].sort((a, b) => {
            if (colonne === 'nom') return signe * a.nomComplet.localeCompare(b.nomComplet, 'fr');
            return signe * ((a[colonne] ?? 0) - (b[colonne] ?? 0));
        });
    }, [lignes, recherche, tri]);

    /*
     * CE QUE LA SEMAINE COUTE. Un etat de paie sans total n'est pas un etat de paie : il
     * fallait additionner de tete, ligne par ligne, en faisant defiler chaque bande.
     * Les totaux portent sur ce qui est AFFICHE : si une recherche filtre, ils suivent, et
     * le libelle le dit.
     */
    const totaux = React.useMemo(
        () =>
            visibles.reduce(
                (t, l) => ({
                    commission: t.commission + (l.commission ?? 0),
                    prime: t.prime + (l.prime ?? 0),
                }),
                { commission: 0, prime: 0 },
            ),
        [visibles],
    );

    return (
        <div className="flex flex-col gap-4">
            {/*
             * CE QUE LA SEMAINE COUTE, EN PREMIER. Ni la commission ni la prime totales
             * n'existaient a l'ecran : c'est pourtant ce qu'on verifie avant de valider une
             * paie.
             */}
            <Card>
                <Card.Content className="gap-3">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex flex-wrap items-end gap-8">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                                    Commission de la semaine
                                </p>
                                <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                                    {isError ? '—' : formatCFA(totaux.commission)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                                    Prime de la semaine
                                </p>
                                <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                                    {isError ? '—' : formatCFA(totaux.prime)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                                    Livreurs
                                </p>
                                <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                                    {isError ? '—' : visibles.length}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-muted">{libelleSemaine}</p>
                    </div>

                    {recherche.trim() && (
                        <p className="text-xs text-muted">
                            Ces totaux portent sur les {visibles.length} livreur
                            {visibles.length > 1 ? 's' : ''} affiché{visibles.length > 1 ? 's' : ''}, pas sur
                            la semaine entière.
                        </p>
                    )}
                </Card.Content>
            </Card>

            {/*
             * Les semaines : une barre de boutons qui defilait horizontalement, sans dire
             * laquelle etait active autrement que par sa couleur. Elles restent des boutons,
             * mais la semaine choisie est nommee dans le bandeau ci-dessus.
             */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {semaines.map((s) => (
                        <Button
                            key={s.cle}
                            onPress={() => onSemaine(s.cle)}
                            size="sm"
                            variant={s.cle === semaineActive ? 'primary' : 'ghost'}
                        >
                            {s.libelle}
                        </Button>
                    ))}
                </div>

                <SearchField className="w-full sm:w-72" onChange={setRecherche} value={recherche}>
                    <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Rechercher un livreur…" />
                        <SearchField.ClearButton />
                    </SearchField.Group>
                </SearchField>
            </div>

            {/* ── L'ETAT, avec le Table de la bibliotheque ───────────────────────────── */}
            <Card className="hidden md:block">
                <Card.Content className="p-0">
                    <Table>
                        <Table.ScrollContainer>
                            <Table.Content
                                aria-label={`Performance, commission et prime de chaque livreur pour ${libelleSemaine}`}
                                className="min-w-[44rem]"
                                onSortChange={setTri}
                                sortDescriptor={tri}
                            >
                                <Table.Header>
                                    <Table.Column allowsSorting id="nom" isRowHeader>
                                        {({ sortDirection }) => (
                                            <Table.SortableColumnHeader sortDirection={sortDirection}>
                                                Livreur
                                            </Table.SortableColumnHeader>
                                        )}
                                    </Table.Column>
                                    <Table.Column id="jours">Jours pointés</Table.Column>
                                    <Table.Column allowsSorting id="performance">
                                        {({ sortDirection }) => (
                                            <Table.SortableColumnHeader sortDirection={sortDirection}>
                                                Performance
                                            </Table.SortableColumnHeader>
                                        )}
                                    </Table.Column>
                                    <Table.Column allowsSorting id="commission">
                                        {({ sortDirection }) => (
                                            <Table.SortableColumnHeader sortDirection={sortDirection}>
                                                Commission
                                            </Table.SortableColumnHeader>
                                        )}
                                    </Table.Column>
                                    <Table.Column allowsSorting id="prime">
                                        {({ sortDirection }) => (
                                            <Table.SortableColumnHeader sortDirection={sortDirection}>
                                                Prime
                                            </Table.SortableColumnHeader>
                                        )}
                                    </Table.Column>
                                    <Table.Column id="actions">{''}</Table.Column>
                                </Table.Header>

                                <Table.Body
                                    renderEmptyState={() => (
                                        <div className="flex flex-col items-center gap-3 py-10 text-center">
                                            {isError ? (
                                                <>
                                                    <p className="text-sm text-foreground">
                                                        La performance n’a pas pu être lue.
                                                    </p>
                                                    {onReessayer && (
                                                        <Button onPress={onReessayer} size="sm" variant="outline">
                                                            Réessayer
                                                        </Button>
                                                    )}
                                                </>
                                            ) : isLoading ? null : (
                                                <p className="text-sm text-muted">
                                                    {recherche.trim()
                                                        ? 'Aucun livreur ne porte ce nom sur cette semaine.'
                                                        : 'Aucun livreur sur cette semaine.'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                >
                                    {/*
                                     * Pendant le chargement, des lignes de la MEME forme que
                                     * les vraies : la hauteur du tableau ne saute pas quand la
                                     * reponse arrive, et l'oeil sait ou regarder d'avance.
                                     */}
                                    {isLoading
                                        ? Array.from({ length: 6 }).map((_, i) => (
                                              <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                                                  {COLONNES_SQUELETTE.map((largeur, c) => (
                                                      <Table.Cell key={`sq-${i}-${c}`}>
                                                          <div
                                                              className={cn(
                                                                  'h-4 animate-pulse rounded bg-surface-secondary',
                                                                  largeur,
                                                              )}
                                                          />
                                                      </Table.Cell>
                                                  ))}
                                              </Table.Row>
                                          ))
                                        : null}
                                    {(isError || isLoading ? [] : visibles).map((l) => (
                                        <Table.Row id={l.id} key={l.id}>
                                            <Table.Cell>
                                                <span className="block max-w-[16rem] truncate">{l.nomComplet}</span>
                                            </Table.Cell>

                                            <Table.Cell>
                                                {/*
                                                 * `etats[].date` etait recu et jete : seule la
                                                 * PREMIERE LETTRE du jour s'affichait, donc deux
                                                 * jours sur trois portaient la meme — M pour mardi
                                                 * et mercredi. La date revient dans l'info-bulle.
                                                 */}
                                                <div className="flex gap-1">
                                                    {l.etats.map((e) => (
                                                        <Tooltip key={`${l.id}-${e.date}`}>
                                                            <span
                                                                className={cn(
                                                                    'flex size-6 items-center justify-center rounded text-[10px] font-semibold text-white',
                                                                    TEINTE_STATUT[e.statut] ?? 'bg-surface-tertiary',
                                                                )}
                                                            >
                                                                {e.jour.slice(0, 1)}
                                                            </span>
                                                            <Tooltip.Content>
                                                                {e.jour} {e.date} · {e.statut}
                                                            </Tooltip.Content>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                            </Table.Cell>

                                            <Table.Cell>
                                                <span className="block text-right">
                                                    <span className={cn('font-semibold tabular-nums', tonPerformance(l.performance))}>
                                                        {l.performance}%
                                                    </span>
                                                    <span className="ms-2 text-xs text-muted">
                                                        {libellePerformance(l.performance)}
                                                    </span>
                                                </span>
                                            </Table.Cell>

                                            {/* Les montants a DROITE, en chasse tabulaire : c'est ce
                                                qui rend deux lignes comparables d'un coup d'oeil. */}
                                            <Table.Cell>
                                                <span className="block text-right font-medium tabular-nums">
                                                    {formatCFA(l.commission)}
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span className="block text-right font-medium tabular-nums">
                                                    {formatCFA(l.prime)}
                                                </span>
                                            </Table.Cell>

                                            <Table.Cell>
                                                <span className="block text-right">
                                                    {rendreActions ? rendreActions(l) : null}
                                                </span>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>

                            </Table.Content>
                        </Table.ScrollContainer>

                        {/*
                         * `Table.Footer` est une barre posee SOUS le tableau, pas une ligne :
                         * la bibliotheque le rend hors du `<table>`, et il ne s'aligne donc
                         * pas sur les colonnes. Il porte ce qui compte quand on arrive au bas
                         * d'une longue liste — le total de ce qui est affiche — pendant que le
                         * bandeau du haut porte les memes chiffres en grand.
                         */}
                        {!isError && !isLoading && visibles.length > 0 && (
                            <Table.Footer className="justify-between gap-4 text-sm">
                                <span className="text-muted">
                                    {visibles.length} livreur{visibles.length > 1 ? 's' : ''}
                                </span>
                                <span className="flex flex-wrap items-center gap-x-6 gap-y-1">
                                    <span className="text-muted">
                                        Commission{' '}
                                        <span className="font-semibold tabular-nums text-foreground">
                                            {formatCFA(totaux.commission)}
                                        </span>
                                    </span>
                                    <span className="text-muted">
                                        Prime{' '}
                                        <span className="font-semibold tabular-nums text-foreground">
                                            {formatCFA(totaux.prime)}
                                        </span>
                                    </span>
                                </span>
                            </Table.Footer>
                        )}
                    </Table>
                </Card.Content>
            </Card>

            {/* ── Au telephone : une carte par livreur, mêmes valeurs, mêmes gestes ───── */}
            <div className="flex flex-col gap-3 md:hidden">
                {isError ? (
                    <Card>
                        <Card.Content className="items-center gap-3 py-8 text-center">
                            <p className="text-sm text-foreground">La performance n’a pas pu être lue.</p>
                            {onReessayer && (
                                <Button onPress={onReessayer} size="sm" variant="outline">
                                    Réessayer
                                </Button>
                            )}
                        </Card.Content>
                    </Card>
                ) : isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" key={`sqm-${i}`} />
                    ))
                ) : visibles.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted">
                        {recherche.trim() ? 'Aucun livreur ne porte ce nom.' : 'Aucun livreur sur cette semaine.'}
                    </p>
                ) : (
                    visibles.map((l) => (
                        <Card key={l.id}>
                            <Card.Content className="gap-2">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="truncate text-sm font-semibold text-foreground">{l.nomComplet}</span>
                                    <span className={cn('shrink-0 text-sm font-semibold tabular-nums', tonPerformance(l.performance))}>
                                        {l.performance}%
                                    </span>
                                </div>

                                <div className="flex gap-1">
                                    {l.etats.map((e) => (
                                        <span
                                            className={cn(
                                                'flex size-6 items-center justify-center rounded text-[10px] font-semibold text-white',
                                                TEINTE_STATUT[e.statut] ?? 'bg-surface-tertiary',
                                            )}
                                            key={`${l.id}-${e.date}`}
                                            title={`${e.jour} ${e.date} · ${e.statut}`}
                                        >
                                            {e.jour.slice(0, 1)}
                                        </span>
                                    ))}
                                </div>

                                <dl className="flex items-center justify-between gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <dt className="text-muted">Commission</dt>
                                        <dd className="font-medium tabular-nums text-foreground">
                                            {formatCFA(l.commission)}
                                        </dd>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <dt className="text-muted">Prime</dt>
                                        <dd className="font-medium tabular-nums text-foreground">
                                            {formatCFA(l.prime)}
                                        </dd>
                                    </div>
                                </dl>

                                {rendreActions && <div className="pt-1">{rendreActions(l)}</div>}
                            </Card.Content>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
