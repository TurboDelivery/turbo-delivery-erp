'use client';

import { Button } from '@heroui/react';
import { RefreshCcw, WifiOff } from 'lucide-react';
import React from 'react';

interface EtatErreurProps {
    /** Ce qui n'a pas pu être chargé, au singulier ou au pluriel. Ex. « les factures ». */
    quoi?: string;
    /** Relance la requête. Absent, le bouton n'apparaît pas. */
    onReessayer?: () => void;
    /** Vrai pendant une nouvelle tentative, pour bloquer le bouton. */
    enCours?: boolean;
    /** Message technique, affiché discrètement pour le support. */
    detail?: string;
}

/**
 * Échec de CHARGEMENT d'une donnée, à l'intérieur d'un écran.
 *
 * <p>À ne pas confondre avec `EmptyDataTable`, qui dit « il n'y a rien », ni avec
 * `app/error.tsx`, qui remplace la page entière sur une erreur de rendu.</p>
 *
 * <p>Pourquoi ce composant existe : 204 fichiers savaient afficher un chargement mais
 * jamais un échec. Quand l'API tombait, l'écran affichait donc « aucune donnée », ce qui
 * se lit exactement comme un résultat vide. L'opérateur concluait qu'il n'y avait rien à
 * traiter, alors que la donnée existait et n'avait pas pu être lue.</p>
 *
 * <p>Le texte ne promet rien qu'on ne tienne : personne n'est prévenu automatiquement.</p>
 */
export default function EtatErreur({ quoi, onReessayer, enCours = false, detail }: EtatErreurProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <WifiOff className="h-10 w-10 text-danger" aria-hidden="true" />
            <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                    {quoi ? `Impossible de charger ${quoi}` : 'Impossible de charger cette donnée'}
                </h3>
                <p className="max-w-sm text-sm text-default-500">
                    La donnée existe, elle n&apos;a pas pu être lue. Réessayez dans un instant, et
                    signalez-le si cela persiste.
                </p>
            </div>
            {onReessayer && (
                <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    isLoading={enCours}
                    onClick={onReessayer}
                    startContent={!enCours && <RefreshCcw className="h-4 w-4" />}
                >
                    Réessayer
                </Button>
            )}
            {detail && <p className="max-w-sm truncate text-xs text-default-400">{detail}</p>}
        </div>
    );
}
