'use client';

import { Button, Card, Chip, Separator } from '@heroui-v3/react';
import { CalendarDays, Check, Plus, Store, Truck } from 'lucide-react';
import Select from 'react-select';

import { cn } from '@/lib/utils';

/**
 * Le plan de saisie : l'etabli, separe de l'archive.
 *
 * <h3>Ce que l'ecran faisait, et pourquoi il fatiguait</h3>
 * <p>La page des tickets melange DEUX activites opposees sur une seule surface. D'un
 * cote SAISIR — concentre, repetitif, sur une poignee de lignes qu'on remplit depuis une
 * liasse de tickets papier. De l'autre CONSULTER — chercher dans un millier
 * d'enregistrements. Elles n'ont ni le meme rythme, ni la meme densite, ni les memes
 * gestes.</p>
 *
 * <p>Le geste principal — preparer N lignes pour un restaurant, un livreur et une date —
 * tenait dans cinq petits champs poses au-dessus d'un tableau de 1 037 lignes. Et les
 * lignes en cours de saisie apparaissaient DANS ce tableau, visuellement identiques aux
 * 1 037 autres : rien ne disait ou l'on en etait, ni combien il restait a remplir.</p>
 *
 * <h3>Ce que ce composant change</h3>
 * <ul>
 *   <li>Le lot se declare une fois — restaurant, livreur, date — et ces trois valeurs
 *       restent AFFICHEES pendant toute la saisie. On sait pour qui on saisit.</li>
 *   <li>L'avancement est un compte, pas une impression : « 7 sur 12 saisis ».</li>
 *   <li>L'accent de marque ne sert qu'ici : c'est la seule zone de l'ecran qui appelle
 *       un geste. Le vert du bouton d'origine ne disait rien — le vert est la couleur
 *       d'un statut valide dans cet ecran, pas celle d'une action.</li>
 * </ul>
 */

export interface OptionSaisie {
    value: string;
    label: string;
}

export interface EtatPlanSaisie {
    nombreLignes: number;
    livreurId: string;
    restaurantId: string;
    date: string;
    setNombreLignes: (v: number) => void;
    setLivreurId: (v: string) => void;
    setRestaurantId: (v: string) => void;
    setDate: (v: string) => void;
}

interface PlanSaisieProps {
    livreurs: OptionSaisie[];
    restaurants: OptionSaisie[];
    etat: EtatPlanSaisie;
    onPreparer: () => void;
    peutCreer: boolean;
    /** Nombre de lignes preparees et nombre deja completees. */
    preparees: number;
    completees: number;
    /** Delai avant verrouillage du creneau, si connu. */
    heuresAvantVerrouillage?: number;
}

/** `react-select` ne porte pas de fond : la surface vient de styles/tailwind.css. */
const HAUTEUR_CHAMP = {
    control: (base: object) => ({ ...base, minHeight: '38px', height: '38px' }),
    valueContainer: (base: object) => ({ ...base, height: '38px', padding: '0 8px' }),
    indicatorsContainer: (base: object) => ({ ...base, height: '38px' }),
};

export function PlanSaisie({
    livreurs,
    restaurants,
    etat,
    onPreparer,
    peutCreer,
    preparees,
    completees,
    heuresAvantVerrouillage,
}: PlanSaisieProps) {
    const enCours = preparees > 0;
    const restant = Math.max(0, preparees - completees);
    const pret = Boolean(etat.restaurantId && etat.livreurId && etat.date && etat.nombreLignes > 0);

    return (
        <Card className="gap-3 border border-accent/20">
            <Card.Header>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Card.Title className="text-sm">Saisir un lot de tickets</Card.Title>
                        <Card.Description>
                            Déclarez le restaurant, le livreur et la date une seule fois, puis remplissez
                            les codes.
                        </Card.Description>
                    </div>

                    {/* Le verrouillage gouverne toute l'activite : il se voit ici, pas ailleurs. */}
                    {heuresAvantVerrouillage !== undefined && heuresAvantVerrouillage <= 48 && (
                        <Chip
                            className="border-accent/30 bg-accent-soft text-foreground"
                            size="sm"
                            variant="soft"
                        >
                            Verrouillage dans {heuresAvantVerrouillage} h
                        </Chip>
                    )}
                </div>
            </Card.Header>

            <Card.Content className="gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
                    <label className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                            <Store aria-hidden="true" className="size-3.5" /> Restaurant
                        </span>
                        <Select
                            classNamePrefix="react-select"
                            isClearable
                            onChange={(o) => etat.setRestaurantId((o as OptionSaisie | null)?.value ?? '')}
                            options={restaurants}
                            placeholder="Choisir…"
                            styles={HAUTEUR_CHAMP}
                            value={restaurants.find((o) => o.value === etat.restaurantId) ?? null}
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                            <Truck aria-hidden="true" className="size-3.5" /> Livreur
                        </span>
                        <Select
                            classNamePrefix="react-select"
                            isClearable
                            onChange={(o) => etat.setLivreurId((o as OptionSaisie | null)?.value ?? '')}
                            options={livreurs}
                            placeholder="Choisir…"
                            styles={HAUTEUR_CHAMP}
                            value={livreurs.find((o) => o.value === etat.livreurId) ?? null}
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                            <CalendarDays aria-hidden="true" className="size-3.5" /> Date
                        </span>
                        <input
                            className="h-[38px] rounded-md border border-separator bg-surface px-2 text-sm"
                            onChange={(e) => etat.setDate(e.target.value)}
                            type="date"
                            value={etat.date}
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted">Lignes</span>
                        <input
                            className="h-[38px] w-20 rounded-md border border-separator bg-surface px-2 text-center text-sm tabular-nums"
                            min={1}
                            onChange={(e) => etat.setNombreLignes(Number(e.target.value))}
                            type="number"
                            value={etat.nombreLignes}
                        />
                    </label>

                    <div className="flex flex-col gap-1">
                        <span aria-hidden="true" className="text-xs">
                            &nbsp;
                        </span>
                        <Button
                            className="h-[38px]"
                            isDisabled={!peutCreer || !pret}
                            onPress={onPreparer}
                            size="sm"
                        >
                            <Plus aria-hidden="true" className="size-4" />
                            Préparer {etat.nombreLignes > 1 ? `${etat.nombreLignes} lignes` : 'la ligne'}
                        </Button>
                    </div>
                </div>

                {!peutCreer && (
                    <p className="text-xs text-muted">
                        Votre rôle ne permet pas de créer un ticket.
                    </p>
                )}

                {enCours && (
                    <>
                        <Separator />
                        {/*
                         * L'avancement est un COMPTE, pas une impression. Les lignes en cours
                         * de saisie se perdaient parmi les 1 037 du tableau : rien ne disait
                         * combien restaient a remplir.
                         */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <span className="flex items-center gap-2 text-sm">
                                <Check
                                    aria-hidden="true"
                                    className={cn(
                                        'size-4',
                                        restant === 0 ? 'text-green-800 dark:text-green-400' : 'text-muted',
                                    )}
                                />
                                <span className="tabular-nums font-semibold">
                                    {completees} sur {preparees}
                                </span>
                                <span className="text-muted">saisis</span>
                            </span>

                            {restant > 0 && (
                                <span className="text-sm text-muted">
                                    {restant} ligne{restant > 1 ? 's' : ''} à compléter
                                </span>
                            )}

                            <div
                                aria-label={`${completees} lignes saisies sur ${preparees}`}
                                aria-valuemax={preparees}
                                aria-valuemin={0}
                                aria-valuenow={completees}
                                className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-surface-secondary"
                                role="progressbar"
                            >
                                <div
                                    className="h-full rounded-full bg-accent transition-[width]"
                                    style={{ width: `${preparees ? (completees / preparees) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </Card.Content>
        </Card>
    );
}
