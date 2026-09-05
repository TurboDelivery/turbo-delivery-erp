'use client';

import { Button, Card, Chip, SearchField, Separator, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

/**
 * La semaine des créneaux, refondue.
 *
 * <h3>Ce que l'écran demandait de faire, et ce qu'il coûtait</h3>
 * <p>Cet écran porte UNE écriture : traiter une absence — la justifier, ou la requalifier
 * en retard. Rien ne le disait. Il s'ouvrait sur quatre pourcentages, et l'action
 * n'existait pas dans ce mode : `onAbsenceClick` valait `undefined` en Prévisionnel. Il
 * fallait donc découvrir une bascule posée à côté de la légende, puis repérer à l'oeil une
 * pastille de douze pixels parmi soixante-dix, sans compteur ni filtre, sur dix lignes à
 * la fois. Quatre clics et un balayage visuel avant de pouvoir agir.</p>
 *
 * <h3>Les trois questions, et ce qu'elles changent</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : plus un taux. Ce qu'il reste à traiter cette
 *       semaine, avec le moyen d'y aller. Les alertes de rupture remontent avec lui : elles
 *       étaient sous le tableau ET sous l'histogramme, donc hors de l'écran.</li>
 *   <li><b>Ce qui appelle une action</b> : les absences, et elles seules. Les quatre taux
 *       informent : ils passent sur une ligne, en dessous. Le « +2 % vs semaine dernière »
 *       disparaît — c'était une chaîne écrite en dur, lue comme une mesure.</li>
 *   <li><b>La forme de la donnée</b> : une semaine de flotte EST une matrice. Elle est
 *       conservée, mais elle cesse d'être coupée en tranches de dix : on voit la forme de
 *       la semaine, et un filtre isole les lignes à traiter au lieu de les faire chercher.</li>
 * </ul>
 *
 * <p>Le mode Prévisionnel / Réalité devient l'axe de lecture qu'il est — planifié contre
 * constaté — et non une puce accolée à la légende. L'action reste disponible dans les
 * deux : une absence est une absence, quel que soit l'angle sous lequel on regarde.</p>
 */

export type StatutJour = 'PRESENT' | 'ABSENT' | 'RETARD' | 'JUSTIFIE' | 'NON_INSCRIT';

export interface JourCreneau {
    jour: string;
    date: string;
    statut: StatutJour;
}

export interface LigneTurboy {
    id: string;
    nomComplet: string;
    avatar?: string;
    jours: JourCreneau[];
    assiduite: number;
}

export interface AlerteCreneau {
    type: string;
    message: string;
    joursImpactes?: string[];
}

export interface SemaineCreneauxProps {
    /** Les lignes de la semaine, flotte entière. */
    turboys: LigneTurboy[];
    /** Les quatre taux, tels que le serveur les rend. */
    taux: {
        tauxPresenceGlobal: number;
        retention: number;
        fideliteTurboys: number;
        capaciteGlobale: number;
    } | null;
    /** Présents et inscrits par jour, pour la lecture par colonne. */
    parJour: { jour: string; date: string; presents: number; total: number }[];
    alertes: AlerteCreneau[];
    libelleSemaine: string;
    mode: 'previsionnel' | 'realite';
    onMode: (m: 'previsionnel' | 'realite') => void;
    recherche: string;
    onRecherche: (v: string) => void;
    onSemainePrecedente: () => void;
    onSemaineSuivante: () => void;
    /** Traiter une absence. Disponible dans les DEUX modes. */
    onTraiterAbsence: (turboy: LigneTurboy, jour: JourCreneau) => void;
    /** Ouvrir le détail d'une journée. */
    onOuvrirJour: (date: string) => void;
    isLoading?: boolean;
    isError?: boolean;
    onReessayer?: () => void;
}

/** Une absence non encore traitée : c'est ce qui reste à faire. */
const estATraiter = (j: JourCreneau) => j.statut === 'ABSENT';

const TEINTE: Record<StatutJour, string> = {
    PRESENT: 'bg-green-500',
    ABSENT: 'bg-red-500',
    RETARD: 'bg-orange-500',
    JUSTIFIE: 'bg-blue-500',
    NON_INSCRIT: 'bg-surface-tertiary',
};

const LIBELLE: Record<StatutJour, string> = {
    PRESENT: 'Présent',
    ABSENT: 'Absent',
    RETARD: 'Retard',
    JUSTIFIE: 'Justifié',
    NON_INSCRIT: 'Non inscrit',
};

export function SemaineCreneaux({
    turboys,
    taux,
    parJour,
    alertes,
    libelleSemaine,
    mode,
    onMode,
    recherche,
    onRecherche,
    onSemainePrecedente,
    onSemaineSuivante,
    onTraiterAbsence,
    onOuvrirJour,
    isLoading = false,
    isError = false,
    onReessayer,
}: SemaineCreneauxProps) {
    const [seulementATraiter, setSeulementATraiter] = React.useState(false);

    const aTraiter = React.useMemo(
        () =>
            turboys.reduce(
                (n, t) => n + t.jours.filter(estATraiter).length,
                0,
            ),
        [turboys],
    );

    const lignes = React.useMemo(
        () => (seulementATraiter ? turboys.filter((t) => t.jours.some(estATraiter)) : turboys),
        [turboys, seulementATraiter],
    );

    const jours = parJour.length > 0 ? parJour : turboys[0]?.jours.map((j) => ({ jour: j.jour, date: j.date, presents: 0, total: 0 })) ?? [];

    return (
        <div className="flex flex-col gap-4">
            {/*
             * CE QUI RESTE A FAIRE, EN PREMIER.
             *
             * L'ecran s'ouvrait sur quatre pourcentages que personne ne vient lire, pendant
             * que la seule action possible etait invisible. On inverse : le compte des
             * absences non traitees ouvre l'ecran, et il mene directement a elles.
             */}
            <Card className={cn('gap-3', aTraiter > 0 && 'border-accent/30 bg-accent-soft/25')}>
                <Card.Content className="gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-bold tabular-nums text-foreground">
                                {isError ? '—' : aTraiter}
                            </span>
                            <span className="text-sm text-muted">
                                {aTraiter > 1 ? 'absences à traiter' : 'absence à traiter'} cette semaine
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/*
                             * Le selecteur de semaine EN TETE : tout l'ecran ne parle que
                             * d'une semaine, et il etait relegue a droite d'une barre
                             * secondaire, sous la legende.
                             */}
                            <Button aria-label="Semaine précédente" isIconOnly onPress={onSemainePrecedente} size="sm" variant="ghost">
                                <ChevronLeft aria-hidden="true" className="size-4" />
                            </Button>
                            <span className="whitespace-nowrap text-sm font-medium text-foreground">{libelleSemaine}</span>
                            <Button aria-label="Semaine suivante" isIconOnly onPress={onSemaineSuivante} size="sm" variant="ghost">
                                <ChevronRight aria-hidden="true" className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {aTraiter > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                onPress={() => setSeulementATraiter((v) => !v)}
                                size="sm"
                                variant={seulementATraiter ? 'primary' : 'outline'}
                            >
                                {seulementATraiter ? 'Voir toute la flotte' : 'Ne montrer que ces lignes'}
                            </Button>
                            <span className="text-xs text-muted">
                                Une absence se traite en cliquant sa pastille : justifier, ou requalifier en retard.
                            </span>
                        </div>
                    )}

                    {/*
                     * Les alertes remontent ici. Elles etaient sous le tableau ET sous
                     * l'histogramme : il fallait faire defiler pour voir une alerte, ce qui
                     * est le contraire d'une alerte.
                     */}
                    {alertes.length > 0 && (
                        <>
                            <Separator />
                            <div className="flex flex-col gap-2">
                                {alertes.map((a) => (
                                    <div className="flex items-start gap-2" key={a.message}>
                                        <AlertTriangle
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0 text-warning-soft-foreground"
                                        />
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm text-foreground">{a.message}</span>
                                            {a.joursImpactes?.map((j) => (
                                                <Chip key={j} size="sm" variant="soft">
                                                    {j}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card.Content>
            </Card>

            {/*
             * L'AXE DE LECTURE, en clair. Prevu contre constate : c'est la tension centrale
             * du domaine, et c'etait une puce grise accolee a la legende. L'action reste
             * disponible dans les DEUX modes — une absence est une absence.
             */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ToggleButtonGroup
                    onSelectionChange={(s) => {
                        const v = Array.from(s)[0];
                        if (v) onMode(String(v) as 'previsionnel' | 'realite');
                    }}
                    selectedKeys={new Set([mode])}
                    selectionMode="single"
                >
                    <ToggleButton id="previsionnel">Prévu</ToggleButton>
                    <ToggleButton id="realite">Constaté</ToggleButton>
                </ToggleButtonGroup>

                <SearchField className="w-full sm:w-72" onChange={onRecherche} value={recherche}>
                    <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Rechercher un turboy…" />
                        <SearchField.ClearButton />
                    </SearchField.Group>
                </SearchField>
            </div>

            {/*
             * LA MATRICE, ENTIERE.
             *
             * La forme est juste — une semaine de flotte EST une grille personnes x jours —
             * mais elle etait servie dix lignes a la fois : on ne voyait jamais la forme de
             * la semaine, seulement une tranche. Elle defile desormais d'un bloc, en-tete
             * de jours et colonne des noms fixes, et le filtre du bandeau isole les lignes
             * a traiter plutot que de les faire chercher.
             */}
            <Card>
                <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <div className="max-h-[32rem] overflow-y-auto">
                            <table className="w-full min-w-[52rem] border-collapse text-sm">
                                <caption className="sr-only">
                                    Présences de la flotte, jour par jour, pour {libelleSemaine}.
                                </caption>
                                <thead className="sticky top-0 z-10 bg-surface">
                                    <tr>
                                        <th
                                            className="sticky left-0 z-20 bg-surface px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted"
                                            scope="col"
                                        >
                                            Turboy
                                        </th>
                                        {jours.map((j) => (
                                            <th className="px-2 py-2 text-center" key={j.date} scope="col">
                                                {/*
                                                 * Le lien vers la journee etait un texte de dix
                                                 * pixels enterre dans l'en-tete, repete sept fois
                                                 * et absent du mobile. L'en-tete ENTIER y mene.
                                                 */}
                                                <button
                                                    className="mx-auto flex min-h-11 flex-col items-center justify-center rounded-md px-2 transition-colors hover:bg-surface-secondary"
                                                    onClick={() => onOuvrirJour(j.date)}
                                                    type="button"
                                                >
                                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                                                        {j.jour.slice(0, 3)}
                                                    </span>
                                                    {j.total > 0 && (
                                                        <span className="text-[11px] tabular-nums text-muted">
                                                            {j.presents}/{j.total}
                                                        </span>
                                                    )}
                                                </button>
                                            </th>
                                        ))}
                                        <th
                                            className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted"
                                            scope="col"
                                        >
                                            Assiduité
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {isError ? (
                                        <tr>
                                            <td className="px-4 py-10 text-center" colSpan={jours.length + 2}>
                                                <p className="text-sm text-foreground">La semaine n’a pas pu être lue.</p>
                                                {onReessayer && (
                                                    <Button className="mt-3" onPress={onReessayer} size="sm" variant="outline">
                                                        Réessayer
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : isLoading ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={`squelette-${i}`}>
                                                <td className="px-4 py-3" colSpan={jours.length + 2}>
                                                    <div className="h-6 w-full animate-pulse rounded bg-surface-secondary" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : lignes.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-10 text-center text-sm text-muted" colSpan={jours.length + 2}>
                                                {seulementATraiter
                                                    ? 'Aucune absence à traiter cette semaine.'
                                                    : 'Aucun turboy sur cette semaine.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        lignes.map((t) => (
                                            <tr className="border-t border-separator" key={t.id}>
                                                <th
                                                    className="sticky left-0 z-10 max-w-[14rem] truncate bg-surface px-4 py-2 text-left font-normal text-foreground"
                                                    scope="row"
                                                >
                                                    {t.nomComplet}
                                                </th>

                                                {t.jours.map((j) => {
                                                    const traitable = estATraiter(j);
                                                    return (
                                                        <td className="px-2 py-1 text-center" key={j.date}>
                                                            {/*
                                                             * La cible faisait douze pixels. Elle en fait
                                                             * quarante-quatre, le minimum tactile, sans que
                                                             * la pastille change de taille : c'est
                                                             * l'enveloppe qui porte la cible.
                                                             */}
                                                            <button
                                                                aria-label={`${LIBELLE[j.statut]} — ${t.nomComplet}, ${j.jour}${traitable ? '. Traiter cette absence' : ''}`}
                                                                className={cn(
                                                                    'mx-auto flex size-11 items-center justify-center rounded-md transition-colors',
                                                                    traitable
                                                                        ? 'cursor-pointer hover:bg-accent-soft'
                                                                        : 'cursor-default',
                                                                )}
                                                                disabled={!traitable}
                                                                onClick={() => traitable && onTraiterAbsence(t, j)}
                                                                type="button"
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        'block size-3 rounded-full',
                                                                        TEINTE[j.statut],
                                                                        // Une absence a traiter porte un anneau :
                                                                        // elle se distingue sans qu'on ait a
                                                                        // balayer soixante-dix pastilles.
                                                                        traitable && 'ring-2 ring-red-500/35 ring-offset-1',
                                                                    )}
                                                                />
                                                            </button>
                                                        </td>
                                                    );
                                                })}

                                                <td className="px-4 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-secondary">
                                                            <span
                                                                className={cn(
                                                                    'block h-full rounded-full',
                                                                    t.assiduite >= 80
                                                                        ? 'bg-green-500'
                                                                        : t.assiduite >= 50
                                                                          ? 'bg-orange-500'
                                                                          : 'bg-red-500',
                                                                )}
                                                                style={{ width: `${Math.min(100, Math.max(0, t.assiduite))}%` }}
                                                            />
                                                        </span>
                                                        <span className="w-10 text-right text-sm tabular-nums text-foreground">
                                                            {t.assiduite}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card.Content>
            </Card>

            {/*
             * LES TAUX INFORMENT, ILS N'APPELLENT AUCUN GESTE. Ils occupaient le haut de
             * l'ecran en quatre grandes tuiles ; ils tiennent sur une ligne, en dessous.
             * Le « +2 % vs semaine derniere » n'est pas repris : c'etait une chaine ecrite
             * en dur, posee sous un vrai pourcentage, donc lue comme une mesure.
             */}
            <Card>
                <Card.Content>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                        {[
                            ['Présence globale', taux?.tauxPresenceGlobal],
                            ['Créneaux remplis', taux?.retention],
                            ['Fiabilité terrain', taux?.fideliteTurboys],
                            ['Capacité globale', taux?.capaciteGlobale],
                        ].map(([libelle, valeur]) => (
                            <div key={String(libelle)}>
                                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">
                                    {libelle}
                                </dt>
                                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                                    {isError || valeur === null || valeur === undefined ? '—' : `${valeur} %`}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Card.Content>
            </Card>

            {/*
             * La legende, en bas : on la consulte une fois, on ne la relit pas. Elle etait
             * en tete, sur la meme ligne que le controle le plus lourd de consequence.
             */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs text-muted">
                {(Object.keys(TEINTE) as StatutJour[]).map((s) => (
                    <span className="flex items-center gap-1.5" key={s}>
                        <span className={cn('size-2.5 rounded-full', TEINTE[s])} />
                        {LIBELLE[s]}
                    </span>
                ))}
            </div>
        </div>
    );
}
