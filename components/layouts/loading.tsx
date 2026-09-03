'use client';

import { Spinner } from '@heroui-v3/react';
import React from 'react';

/**
 * Écran d'attente pendant le chargement de l'application.
 *
 * <p>Il portait DEUX indicateurs pour un seul chargement : un arc qui tourne, et une barre
 * de progression sous le texte. Deux animations qui disent la même chose, et la barre
 * suggérait en plus une progression MESURÉE alors qu'elle ne mesurait rien — elle
 * traversait en boucle, indépendamment de l'avancement réel. Un indicateur qui simule une
 * information qu'il n'a pas apprend à l'utilisateur à ne plus le croire.</p>
 *
 * <p>Il ne reste qu'un `Spinner` de la bibliothèque, qui porte déjà son animation, son
 * rôle ARIA et son respect de `prefers-reduced-motion`. Les cinq animations d'entrée
 * `framer-motion` disparaissent avec : sur un écran qui s'affiche justement parce que
 * quelque chose est lent, faire attendre 600 ms de plus pour voir apparaître le texte
 * ajoute de la latence à de la latence.</p>
 */
export default function Loading() {
    return (
        <div
            aria-busy="true"
            aria-live="polite"
            className="flex h-screen w-full items-center justify-center bg-background px-4"
        >
            <div className="flex flex-col items-center gap-4 text-center">
                <Spinner size="lg" />
                <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">Chargement</p>
                    <p className="max-w-xs text-sm text-muted">Préparation de votre contenu</p>
                </div>
            </div>
        </div>
    );
}
