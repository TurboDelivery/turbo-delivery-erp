'use client';

import { Button, Card, Chip, SearchField, Separator, Table, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
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
    /** L'emploi du temps sur lequel s'ecrit la justification d'absence. */
    emploiId?: string;
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

/*
 * Les cinq etats en JETONS du theme, pas en couleurs ecrites en dur : `bg-green-500` ne
 * suit ni le mode sombre ni un changement de theme, `bg-success` si.
 *
 * <p>Le theme porte quatre tons semantiques et l'ecran a cinq etats. « Justifie » se
 * distingue donc par la FORME et non par une cinquieme teinte : un anneau creux dans le
 * ton du danger. C'est ce qu'il est — une absence, mais rendue compte — et cela satisfait
 * la regle « ne jamais dire par la couleur seule ».</p>
 */
const TEINTE: Record<StatutJour, string> = {
    PRESENT: 'bg-success',
    ABSENT: 'bg-danger',
    RETARD: 'bg-warning',
    JUSTIFIE: 'border-2 border-danger bg-surface',
    NON_INSCRIT: 'bg-surface-tertiary ring-1 ring-separator',
};

/** Le ton de la barre d'assiduité : les seuils d'origine, en jetons du thème. */
function tonAssiduite(v: number): string {
    if (v >= 80) return 'bg-success';
    if (v >= 50) return 'bg-warning';
    return 'bg-danger';
}

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
                            {/*
                             * Un tiret tant qu'on ne SAIT pas. Pendant le chargement la flotte
                             * est vide : afficher « 0 absence a traiter » au-dessus d'un
                             * squelette annoncerait une semaine propre qui n'a pas ete lue.
                             */}
                            <span className="text-2xl font-bold tabular-nums text-foreground">
                                {isError || isLoading ? '—' : aTraiter}
                            </span>
                            <span className="text-sm text-muted">
                                {aTraiter > 1 && !isLoading && !isError ? 'absences à traiter' : 'absence à traiter'} cette
                                semaine
                            </span>
                        </div>

                        {/*
                         * Le selecteur de semaine EN TETE : tout l'ecran ne parle que d'une
                         * semaine, et il etait relegue a droite d'une barre secondaire, sous
                         * la legende. `flex-nowrap` : les deux fleches et le libelle forment
                         * UN controle, ils ne se separent pas sur un ecran etroit.
                         */}
                        <div className="flex flex-nowrap items-center gap-1">
                            <Button aria-label="Semaine précédente" isIconOnly onPress={onSemainePrecedente} size="sm" variant="ghost">
                                <ChevronLeft aria-hidden="true" className="size-4" />
                            </Button>
                            <span className="whitespace-nowrap px-1 text-sm font-medium text-foreground">
                                {libelleSemaine}
                            </span>
                            <Button aria-label="Semaine suivante" isIconOnly onPress={onSemaineSuivante} size="sm" variant="ghost">
                                <ChevronRight aria-hidden="true" className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {aTraiter > 0 && !isLoading && !isError && (
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
            <Card className="hidden md:block">
                <Card.Content className="p-0">
                    <Table>
                        {/*
                         * `Table.ScrollContainer` ne gere que le debordement horizontal. La
                         * hauteur bornee et le defilement vertical s'ajoutent ici, pour que
                         * l'en-tete colle en haut et la colonne des noms a gauche : on lit
                         * toujours DE QUI et DE QUEL JOUR on parle, meme au milieu de la flotte.
                         */}
                        <Table.ScrollContainer className="max-h-[32rem] overflow-y-auto">
                            <Table.Content
                                aria-label={`Présences de la flotte, jour par jour, pour ${libelleSemaine}`}
                                className="min-w-[52rem]"
                            >
                                <Table.Header>
                                    <Table.Column
                                        className="sticky left-0 top-0 z-30 bg-surface-secondary"
                                        id="turboy"
                                        isRowHeader
                                    >
                                        Turboy
                                    </Table.Column>

                                    {jours.map((j) => (
                                        <Table.Column
                                            className="sticky top-0 z-20 bg-surface-secondary px-2 py-1"
                                            id={j.date}
                                            key={j.date}
                                        >
                                            {/*
                                             * Le lien vers la journee etait un texte de dix pixels
                                             * enterre dans l'en-tete, repete sept fois et absent du
                                             * mobile. L'en-tete ENTIER y mene.
                                             */}
                                            <Button
                                                aria-label={`Ouvrir la journée du ${j.jour}`}
                                                className="mx-auto h-auto min-h-11 flex-col gap-0 px-2 py-1"
                                                onPress={() => onOuvrirJour(j.date)}
                                                size="sm"
                                                variant="ghost"
                                            >
                                                <span className="text-[11px] font-semibold uppercase tracking-wider">
                                                    {j.jour.slice(0, 3)}
                                                </span>
                                                {j.total > 0 && (
                                                    <span className="text-[11px] font-normal tabular-nums">
                                                        {j.presents}/{j.total}
                                                    </span>
                                                )}
                                            </Button>
                                        </Table.Column>
                                    ))}

                                    <Table.Column className="sticky top-0 z-20 bg-surface-secondary text-end" id="assiduite">
                                        Assiduité
                                    </Table.Column>
                                </Table.Header>

                                <Table.Body
                                    renderEmptyState={() =>
                                        isLoading ? null : (
                                            <div className="flex flex-col items-center gap-3 py-10 text-center">
                                                {isError ? (
                                                    <>
                                                        <p className="text-sm text-foreground">
                                                            La semaine n’a pas pu être lue.
                                                        </p>
                                                        {onReessayer && (
                                                            <Button onPress={onReessayer} size="sm" variant="outline">
                                                                Réessayer
                                                            </Button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-muted">
                                                        {seulementATraiter
                                                            ? 'Aucune absence à traiter cette semaine.'
                                                            : 'Aucun turboy sur cette semaine.'}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    }
                                >
                                    {/* Le squelette a la MEME forme que la matrice : la hauteur ne saute pas. */}
                                    {isLoading
                                        ? Array.from({ length: 8 }).map((_, i) => (
                                              <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                                                  {Array.from({ length: jours.length + 2 }).map((__, c) => (
                                                      <Table.Cell key={`sq-${i}-${c}`}>
                                                          <div className="h-5 animate-pulse rounded bg-surface-secondary" />
                                                      </Table.Cell>
                                                  ))}
                                              </Table.Row>
                                          ))
                                        : null}

                                    {(isError || isLoading ? [] : lignes).map((t) => (
                                        <Table.Row id={t.id} key={t.id}>
                                            <Table.Cell className="sticky left-0 z-10 bg-surface">
                                                <span className="block max-w-[14rem] truncate">{t.nomComplet}</span>
                                            </Table.Cell>

                                            {t.jours.map((j) => {
                                                const traitable = estATraiter(j);
                                                const pastille = (
                                                    <span
                                                        className={cn(
                                                            'block size-3 rounded-full',
                                                            TEINTE[j.statut],
                                                            // Une absence a traiter porte un anneau : elle
                                                            // se distingue sans qu'on ait a balayer
                                                            // soixante-dix pastilles.
                                                            traitable && 'ring-2 ring-danger/35 ring-offset-1',
                                                        )}
                                                    />
                                                );
                                                return (
                                                    <Table.Cell className="px-2 py-1 text-center" key={j.date}>
                                                        {/*
                                                         * La cible faisait douze pixels. Elle en fait
                                                         * quarante-quatre, le minimum tactile, sans que la
                                                         * pastille change de taille : c'est l'enveloppe qui
                                                         * porte la cible. Un jour qui n'appelle aucun geste
                                                         * n'est PAS un bouton desactive — un bouton
                                                         * desactive se serait affadi, et la matrice se lit
                                                         * a la couleur.
                                                         */}
                                                        {traitable ? (
                                                            <Button
                                                                aria-label={`${LIBELLE[j.statut]} — ${t.nomComplet}, ${j.jour}. Traiter cette absence`}
                                                                className="mx-auto size-11"
                                                                isIconOnly
                                                                onPress={() => onTraiterAbsence(t, j)}
                                                                size="sm"
                                                                variant="ghost"
                                                            >
                                                                {pastille}
                                                            </Button>
                                                        ) : (
                                                            <span
                                                                aria-label={`${LIBELLE[j.statut]} — ${t.nomComplet}, ${j.jour}`}
                                                                className="mx-auto flex size-11 items-center justify-center"
                                                                role="img"
                                                            >
                                                                {pastille}
                                                            </span>
                                                        )}
                                                    </Table.Cell>
                                                );
                                            })}

                                            <Table.Cell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-secondary">
                                                        <span
                                                            className={cn('block h-full rounded-full', tonAssiduite(t.assiduite))}
                                                            style={{ width: `${Math.min(100, Math.max(0, t.assiduite))}%` }}
                                                        />
                                                    </span>
                                                    <span className="w-10 text-right text-sm tabular-nums">
                                                        {t.assiduite}%
                                                    </span>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Content>
                        </Table.ScrollContainer>
                    </Table>
                </Card.Content>
            </Card>

            {/*
             * AU TELEPHONE, DES CARTES.
             *
             * <p>Une matrice de sept colonnes ne se lit pas sur un ecran de trois cent
             * soixante quinze pixels : elle deborde, et on la fait glisser pour trouver une
             * pastille. L'ecran d'origine avait deja des cartes ; elles sont conservees, avec
             * les memes gestes que la matrice — la bande des sept jours reste cliquable la ou
             * il y a une absence a traiter.</p>
             */}
            <div className="flex flex-col gap-3 md:hidden">
                {isError ? (
                    <Card>
                        <Card.Content className="items-center gap-3 py-8 text-center">
                            <p className="text-sm text-foreground">La semaine n’a pas pu être lue.</p>
                            {onReessayer && (
                                <Button onPress={onReessayer} size="sm" variant="outline">
                                    Réessayer
                                </Button>
                            )}
                        </Card.Content>
                    </Card>
                ) : isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div className="h-36 animate-pulse rounded-xl bg-surface-secondary" key={`sq-${i}`} />
                    ))
                ) : lignes.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted">
                        {seulementATraiter
                            ? 'Aucune absence à traiter cette semaine.'
                            : 'Aucun turboy sur cette semaine.'}
                    </p>
                ) : (
                    lignes.map((t) => (
                        <Card key={t.id}>
                            <Card.Content className="gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-semibold text-foreground">
                                        {t.nomComplet}
                                    </span>
                                    <span className="shrink-0 text-sm tabular-nums text-muted">
                                        {t.assiduite}%
                                    </span>
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {t.jours.map((j) => {
                                        const traitable = estATraiter(j);
                                        const contenu = (
                                            <>
                                                <span className="text-[10px] uppercase text-muted">
                                                    {j.jour.slice(0, 3)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'block size-2.5 rounded-full',
                                                        TEINTE[j.statut],
                                                        traitable && 'ring-2 ring-danger/35',
                                                    )}
                                                />
                                            </>
                                        );
                                        return traitable ? (
                                            <Button
                                                aria-label={`${LIBELLE[j.statut]} — ${j.jour}. Traiter cette absence`}
                                                className="h-auto min-h-11 flex-col gap-1 px-0 py-1"
                                                key={j.date}
                                                onPress={() => onTraiterAbsence(t, j)}
                                                size="sm"
                                                // `danger-soft` et non `secondary` : la tuile grise
                                                // se lisait comme un jour SELECTIONNE, alors qu'elle
                                                // marque un jour a traiter.
                                                variant="danger-soft"
                                            >
                                                {contenu}
                                            </Button>
                                        ) : (
                                            <span
                                                aria-label={`${LIBELLE[j.statut]} — ${j.jour}`}
                                                className="flex min-h-11 flex-col items-center justify-center gap-1"
                                                key={j.date}
                                                role="img"
                                            >
                                                {contenu}
                                            </span>
                                        );
                                    })}
                                </div>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </div>

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
                        <span className={cn('size-3 rounded-full', TEINTE[s])} />
                        {LIBELLE[s]}
                    </span>
                ))}
            </div>
        </div>
    );
}
