'use client';

import {
    Button,
    Card,
    Input,
    Label,
    ListBox,
    ListBoxItem,
    NumberField,
    Select,
    Separator,
    TextField,
} from '@heroui-v3/react';
import { Check, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { OptionSaisie } from './plan-saisie';

/**
 * Les lignes preparees, saisies DANS l'etabli.
 *
 * <p>Elles etaient inserees au sommet du tableau d'archive, ou 1 037 lignes deja
 * enregistrees les entouraient. Rien ne les distinguait : ni bordure, ni position stable
 * — un tri ou un filtre les dispersait — ni indication de ce qu'il restait a remplir. On
 * saisissait a l'aveugle, dans un tableau a quatorze colonnes dont onze ne concernent pas
 * la saisie.</p>
 *
 * <h3>Ce qui change</h3>
 * <ul>
 *   <li>Seuls les champs qu'on REMPLIT sont la : code, zone, montants. Le restaurant, le
 *       livreur et la date sont deja declares dans le plan, ils ne se ressaisissent pas.</li>
 *   <li>Une ligne complete se marque d'un vu ; les incompletes gardent le liseré d'accent.
 *       On voit ou reprendre sans relire.</li>
 *   <li>Un seul bouton enregistre le lot. L'ancien ecran demandait de valider ligne par
 *       ligne, ce qui multipliait les allers-retours pour une liasse de douze tickets.</li>
 * </ul>
 */

export interface LignePreparee {
    id: string;
    code: string;
    zoneId: string;
    montantLivraison: number;
    montantCommande: number;
    /** Renseigne par le service selon la zone ; affiche, non saisi. */
    commission?: number;
}

interface LignesPrepareesProps {
    lignes: LignePreparee[];
    zones: OptionSaisie[];
    onChange: (id: string, champ: keyof LignePreparee, valeur: string | number) => void;
    onRetirer: (id: string) => void;
    onEnregistrer: () => void;
    enregistrement?: boolean;
    /** Contexte du lot, rappele en tete pour ne pas avoir a remonter. */
    contexte: { restaurant: string; livreur: string; date: string };
}

/** Une ligne est complete quand tout ce qui se saisit est renseigne. */
export const ligneComplete = (l: LignePreparee) =>
    Boolean(l.code.trim() && l.zoneId && l.montantLivraison > 0);

export function LignesPreparees({
    lignes,
    zones,
    onChange,
    onRetirer,
    onEnregistrer,
    enregistrement = false,
    contexte,
}: LignesPrepareesProps) {
    if (lignes.length === 0) return null;

    const completes = lignes.filter(ligneComplete).length;
    const toutesCompletes = completes === lignes.length;

    return (
        <Card className="gap-3">
            <Card.Header>
                <Card.Title className="text-sm">
                    {lignes.length} ligne{lignes.length > 1 ? 's' : ''} à saisir
                </Card.Title>
                {/* Le contexte du lot, rappele : on ne remonte pas verifier pour qui on saisit. */}
                <Card.Description>
                    {contexte.restaurant} · {contexte.livreur} · {contexte.date}
                </Card.Description>
            </Card.Header>

            <Card.Content className="gap-2">
                {lignes.map((l, i) => {
                    const complete = ligneComplete(l);
                    return (
                        <div
                            className={cn(
                                'grid grid-cols-1 items-end gap-2 rounded-lg border p-2 sm:grid-cols-[auto_1fr_1fr_auto_auto_auto]',
                                complete
                                    ? 'border-separator bg-surface-secondary/40'
                                    : 'border-accent/25 bg-accent-soft/30',
                            )}
                            key={l.id}
                        >
                            <span
                                className={cn(
                                    'flex size-6 shrink-0 items-center justify-center self-center rounded-full text-xs font-semibold tabular-nums',
                                    complete
                                        ? 'bg-green-800 text-white dark:bg-green-400 dark:text-black'
                                        : 'bg-accent-soft text-accent',
                                )}
                            >
                                {complete ? <Check aria-hidden="true" className="size-3.5" /> : i + 1}
                            </span>

                            <TextField
                                onChange={(v) => onChange(l.id, 'code', v)}
                                value={l.code}
                            >
                                <Label className="text-[11px]">Code check</Label>
                                <Input autoComplete="off" placeholder="000 0000" />
                            </TextField>

                            <Select
                                onSelectionChange={(cle) => onChange(l.id, 'zoneId', String(cle ?? ''))}
                                selectedKey={l.zoneId || null}
                            >
                                <Label className="text-[11px]">Zone</Label>
                                <Select.Trigger>
                                    <Select.Value>
                                        {({ isPlaceholder }: { isPlaceholder: boolean }) =>
                                            isPlaceholder ? 'Choisir…' : undefined
                                        }
                                    </Select.Value>
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox items={zones}>
                                        {(z: OptionSaisie) => <ListBoxItem id={z.value}>{z.label}</ListBoxItem>}
                                    </ListBox>
                                </Select.Popover>
                            </Select>

                            <NumberField
                                minValue={0}
                                onChange={(v) => onChange(l.id, 'montantLivraison', Number.isFinite(v) ? v : 0)}
                                value={l.montantLivraison}
                            >
                                <Label className="text-[11px]">Livraison</Label>
                                <NumberField.Group>
                                    <NumberField.Input className="w-28 text-right tabular-nums" />
                                </NumberField.Group>
                            </NumberField>

                            <NumberField
                                minValue={0}
                                onChange={(v) => onChange(l.id, 'montantCommande', Number.isFinite(v) ? v : 0)}
                                value={l.montantCommande}
                            >
                                <Label className="text-[11px]">Commande</Label>
                                <NumberField.Group>
                                    <NumberField.Input className="w-28 text-right tabular-nums" />
                                </NumberField.Group>
                            </NumberField>

                            <Button
                                aria-label={`Retirer la ligne ${i + 1}`}
                                isIconOnly
                                onPress={() => onRetirer(l.id)}
                                size="sm"
                                variant="ghost"
                            >
                                <Trash2 aria-hidden="true" className="size-4" />
                            </Button>
                        </div>
                    );
                })}

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-muted">
                        {toutesCompletes
                            ? 'Toutes les lignes sont complètes.'
                            : `${lignes.length - completes} ligne${lignes.length - completes > 1 ? 's' : ''} incomplète${lignes.length - completes > 1 ? 's' : ''}.`}
                    </span>
                    {/*
                     * Un seul enregistrement pour le lot. L'ecran precedent demandait de
                     * valider ligne par ligne, soit douze allers-retours pour une liasse
                     * de douze tickets.
                     */}
                    <Button isDisabled={!toutesCompletes} isPending={enregistrement} onPress={onEnregistrer}>
                        Enregistrer les {lignes.length} tickets
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
}
