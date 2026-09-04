'use client';

import { ComboBox, Input, Label, ListBox } from '@heroui-v3/react';
import { useMemo } from 'react';

import { useDeliveryFeesByRestaurantQuery } from '@/features/price-list/queries/price-list.query';
import type { Ticket } from '@/types/bon-livraison.model';
import type { DeliveryFee } from '@/types/delivery-fee.model';

/**
 * Le choix de zone d'une ligne en cours de saisie.
 *
 * <p>Choisir une zone ne renseigne pas qu'un libelle : la grille tarifaire du partenaire
 * porte le prix de livraison ET la commission de cette zone. Les trois valeurs sont donc
 * posees ensemble, comme le faisait l'ecran d'origine.</p>
 *
 * <h3>Ce qui change par rapport au selecteur precedent</h3>
 * <p>Il allait chercher la grille dans un `useEffect` monte par LIGNE : douze lignes
 * declenchaient douze appels reseau pour la meme grille, a chaque re-rendu du tableau.
 * La requete passe desormais par le cache de TanStack, deja present dans le projet, avec
 * une cle par restaurant — une seule lecture, partagee par toutes les lignes.</p>
 */

interface SelecteurZoneProps {
    /** Placement dans la grille du parent : un enfant de grille porte son propre span. */
    className?: string;
    ticketId: string;
    restaurantId: string;
    zoneId?: string;
    onPatch: (id: string, patch: Partial<Ticket>) => void;
}

export function SelecteurZone({ className, ticketId, restaurantId, zoneId, onPatch }: SelecteurZoneProps) {
    const { data, isPending, isError } = useDeliveryFeesByRestaurantQuery(restaurantId || null, 0, 100);

    const zones: DeliveryFee[] = useMemo(() => data?.content ?? [], [data]);
    const options = useMemo(
        () => zones.map((z) => ({ value: z.id ?? '', label: z.name ?? `Zone ${z.id}` })),
        [zones],
    );

    const choisir = (cle: string) => {
        const zone = zones.find((z) => z.id === cle);
        if (!zone) return;
        // Prix ET commission viennent de la grille : les dissocier ferait saisir a la main
        // un montant que le partenaire a deja fixe.
        onPatch(ticketId, {
            zoneId: zone.id,
            nomZone: zone.name ?? '',
            montantLivraison: String(zone.prix ?? 0),
            coutLivraison: String(zone.commission ?? 0),
        });
    };

    /*
     * Ce qui ferme le champ, c'est l'ABSENCE DE ZONES, pas un drapeau d'erreur.
     *
     * <p>Une premiere version fermait sur `isError`. Or une lecture peut echouer puis etre
     * servie par le cache : le champ restait alors barre alors que les zones etaient la,
     * sous les yeux. L'echec ne compte que s'il ne laisse rien.</p>
     */
    const indisponible = !restaurantId || (options.length === 0 && !isPending);

    // Le message d'attente porte l'etat de la grille : sans partenaire il n'y a rien a
    // chercher, et une grille absente ne doit pas se confondre avec une grille vide.
    const invite = !restaurantId
        ? 'Partenaire d’abord'
        : isPending && options.length === 0
          ? 'Chargement…'
          : options.length === 0
            ? isError
                ? 'Grille indisponible'
                : 'Aucune zone'
            : 'Rechercher une zone…';

    return (
        <ComboBox
            className={className}
            isDisabled={indisponible}
            onSelectionChange={(c) => choisir(String(c ?? ''))}
            selectedKey={zoneId || null}
        >
            <Label>Zone</Label>
            <ComboBox.InputGroup>
                <Input placeholder={invite} />
                <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
                <ListBox items={options}>
                    {(o: { value: string; label: string }) => (
                        <ListBox.Item id={o.value} textValue={o.label}>
                            {o.label}
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    )}
                </ListBox>
            </ComboBox.Popover>
        </ComboBox>
    );
}
