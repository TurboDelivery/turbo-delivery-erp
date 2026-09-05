'use client';

import { Button, Card, SearchField, Tooltip } from '@heroui-v3/react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
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

const TEINTE_STATUT: Record<string, string> = {
    VALIDE: 'bg-green-500',
    EN_COURS: 'bg-orange-500',
    MANQUE: 'bg-red-500',
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
    const [tri, setTri] = React.useState<{ colonne: Colonne; sens: 'asc' | 'desc' }>({
        colonne: 'nom',
        sens: 'asc',
    });

    const visibles = React.useMemo(() => {
        const q = recherche.trim().toLowerCase();
        const filtrees = q ? lignes.filter((l) => l.nomComplet.toLowerCase().includes(q)) : lignes;
        const signe = tri.sens === 'asc' ? 1 : -1;
        return [...filtrees].sort((a, b) => {
            if (tri.colonne === 'nom') return signe * a.nomComplet.localeCompare(b.nomComplet, 'fr');
            return signe * ((a[tri.colonne] ?? 0) - (b[tri.colonne] ?? 0));
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

    const basculerTri = (colonne: Colonne) =>
        setTri((t) =>
            t.colonne === colonne
                ? { colonne, sens: t.sens === 'asc' ? 'desc' : 'asc' }
                : { colonne, sens: colonne === 'nom' ? 'asc' : 'desc' },
        );

    const EnTete = ({ colonne, children, aDroite }: { colonne: Colonne; children: React.ReactNode; aDroite?: boolean }) => {
        const actif = tri.colonne === colonne;
        const Fleche = !actif ? ArrowUpDown : tri.sens === 'asc' ? ArrowUp : ArrowDown;
        return (
            <th className="px-3 py-2" scope="col">
                <button
                    aria-label={`Trier par ${String(children)}`}
                    className={cn(
                        'flex min-h-9 w-full items-center gap-1 rounded-md px-1 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-surface-secondary',
                        aDroite ? 'justify-end' : 'justify-start',
                        actif ? 'text-foreground' : 'text-muted',
                    )}
                    onClick={() => basculerTri(colonne)}
                    type="button"
                >
                    {children}
                    <Fleche aria-hidden="true" className="size-3 shrink-0" />
                </button>
            </th>
        );
    };

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

            {/* ── L'ETAT, en colonnes alignees et comparables ─────────────────────────── */}
            <Card className="hidden md:block">
                <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[44rem] border-collapse text-sm">
                            <caption className="sr-only">
                                Performance, commission et prime de chaque livreur pour {libelleSemaine}.
                            </caption>
                            <thead className="border-b border-separator">
                                <tr>
                                    <EnTete colonne="nom">Livreur</EnTete>
                                    <th
                                        className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted"
                                        scope="col"
                                    >
                                        Jours pointés
                                    </th>
                                    <EnTete aDroite colonne="performance">
                                        Performance
                                    </EnTete>
                                    <EnTete aDroite colonne="commission">
                                        Commission
                                    </EnTete>
                                    <EnTete aDroite colonne="prime">
                                        Prime
                                    </EnTete>
                                    {rendreActions && <th className="w-12 px-3 py-2" scope="col" />}
                                </tr>
                            </thead>

                            <tbody>
                                {isError ? (
                                    <tr>
                                        <td className="px-4 py-10 text-center" colSpan={rendreActions ? 6 : 5}>
                                            <p className="text-sm text-foreground">
                                                La performance n’a pas pu être lue.
                                            </p>
                                            {onReessayer && (
                                                <Button className="mt-3" onPress={onReessayer} size="sm" variant="outline">
                                                    Réessayer
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ) : isLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={`sq-${i}`}>
                                            <td className="px-3 py-3" colSpan={rendreActions ? 6 : 5}>
                                                <div className="h-6 w-full animate-pulse rounded bg-surface-secondary" />
                                            </td>
                                        </tr>
                                    ))
                                ) : visibles.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-10 text-center text-sm text-muted" colSpan={rendreActions ? 6 : 5}>
                                            {recherche.trim()
                                                ? 'Aucun livreur ne porte ce nom sur cette semaine.'
                                                : 'Aucun livreur sur cette semaine.'}
                                        </td>
                                    </tr>
                                ) : (
                                    visibles.map((l) => (
                                        <tr className="border-b border-separator last:border-0" key={l.id}>
                                            <th
                                                className="max-w-[16rem] truncate px-3 py-2.5 text-left font-normal text-foreground"
                                                scope="row"
                                            >
                                                {l.nomComplet}
                                            </th>

                                            <td className="px-3 py-2.5">
                                                {/*
                                                 * `etats[].date` etait recu et jete : seule la
                                                 * PREMIERE LETTRE du jour s'affichait, donc deux
                                                 * jours sur trois portaient la meme lettre — M
                                                 * pour mardi et mercredi, S pour samedi. La date
                                                 * revient dans l'info-bulle.
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
                                            </td>

                                            <td className="px-3 py-2.5 text-right">
                                                <span className={cn('font-semibold tabular-nums', tonPerformance(l.performance))}>
                                                    {l.performance}%
                                                </span>
                                                <span className="ms-2 text-xs text-muted">
                                                    {libellePerformance(l.performance)}
                                                </span>
                                            </td>

                                            {/* Les montants a DROITE, en chasse tabulaire : c'est
                                                ce qui rend deux lignes comparables d'un coup d'oeil. */}
                                            <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">
                                                {formatCFA(l.commission)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">
                                                {formatCFA(l.prime)}
                                            </td>

                                            {rendreActions && (
                                                <td className="px-3 py-2.5 text-right">{rendreActions(l)}</td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            {!isError && !isLoading && visibles.length > 0 && (
                                <tfoot className="border-t-2 border-separator">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-sm font-semibold text-foreground" scope="row">
                                            Total
                                        </th>
                                        <td />
                                        <td />
                                        <td className="px-3 py-3 text-right text-sm font-bold tabular-nums text-foreground">
                                            {formatCFA(totaux.commission)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-bold tabular-nums text-foreground">
                                            {formatCFA(totaux.prime)}
                                        </td>
                                        {rendreActions && <td />}
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
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
