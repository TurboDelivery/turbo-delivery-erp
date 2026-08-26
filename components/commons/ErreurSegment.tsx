'use client';

import { Button } from '@heroui/react';
import { RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Filet d'erreur d'une SECTION de l'ERP, monte par les `error.tsx` de segment.
 *
 * <p>Avant, un seul `app/error.tsx` couvrait les 109 routes : la moindre erreur de rendu
 * remplacait la page entiere par un ecran 500 plein format, menu compris, et l'operateur
 * perdait sa navigation. Ici l'erreur reste contenue dans la zone de contenu.</p>
 *
 * <p>Le texte ne promet pas qu'une equipe a ete prevenue : personne ne l'est
 * automatiquement.</p>
 */
export default function ErreurSegment({
    section,
    error,
    reset,
}: {
    section: string;
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(`[${section}]`, error);
    }, [section, error]);

    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-danger-200 bg-danger-50/40 p-10 text-center dark:border-danger-800 dark:bg-danger-900/10">
            <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                    {section} n&apos;a pas pu s&apos;afficher
                </h2>
                <p className="max-w-md text-sm text-default-500">
                    Le reste de l&apos;ERP fonctionne. Réessayez, et signalez-le si cela se répète.
                </p>
            </div>
            <Button color="danger" variant="flat" size="sm" onClick={reset} startContent={<RefreshCcw className="h-4 w-4" />}>
                Réessayer
            </Button>
            {error.digest && <p className="text-xs text-default-400">Référence : {error.digest}</p>}
        </div>
    );
}
