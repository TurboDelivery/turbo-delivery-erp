'use client';

import { Chip } from '@heroui-v3/react';

/**
 * La pastille de statut d'une facture, pour toute la chaîne de recouvrement.
 *
 * <h3>Un vocabulaire, trois palettes</h3>
 * <p>Trois écrans du même dossier — Responsable financier, Caissier, Agent recouvreur —
 * portaient chacun leur propre table `statutConfig` sur le MÊME vocabulaire de statuts,
 * et les trois divergeaient : « Clôturé » était `green-100` chez le caissier et
 * `green-200` chez les deux autres ; « Soldé » était vert sur deux écrans et absent du
 * troisième, donc gris. Le même mot changeait de couleur selon la page où on le lisait.</p>
 *
 * <h3>Seize teintes deviennent trois tons</h3>
 * <p>Chacun des seize statuts avait sa teinte choisie à la main — violet, sky, amber,
 * slate, indigo… Seize couleurs sur une colonne, c'est aucune couleur : l'œil n'en tire
 * plus de hiérarchie et lit le texte. Et aucune de ces teintes n'avait de variante
 * sombre.</p>
 *
 * <p>Ce qu'il faut distinguer d'un coup d'œil, c'est ce qui est TERMINÉ (soldé, clôturé),
 * ce qui est BLOQUÉ (rejeté par la DGA), et ce qui suit son cours. Trois tons, tirés du
 * thème. Ce qui appelle un geste n'est pas dit par la pastille mais par la colonne
 * ACTIONS, qui porte alors un bouton plein — un seul par ligne.</p>
 *
 * <p>Aucun libellé ne disparaît : les seize statuts gardent leur texte, y compris les
 * « Acompte N » qui ne figuraient dans aucune table.</p>
 */

export type TonStatut = 'danger' | 'default' | 'success';

const TON_STATUT: Record<string, TonStatut> = {
    Clôturé: 'success',
    'Rejeté DGA': 'danger',
    Soldé: 'success',
};

export function getTonStatutFacture(statut: string): TonStatut {
    return TON_STATUT[statut] ?? 'default';
}

export function ChipStatutFacture({ statut }: { statut: string }) {
    return (
        <Chip color={getTonStatutFacture(statut)} size="sm" variant="soft">
            <Chip.Label className="whitespace-nowrap">{statut}</Chip.Label>
        </Chip>
    );
}
