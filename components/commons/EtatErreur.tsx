'use client';

/*
 * `Button` de HeroUI V3, et non plus celui de la V2.
 *
 * <p>Ce composant est rendu par 125 fichiers : c'etait le dernier point de l'ecran de
 * refonte a dependre encore de l'ancienne bibliotheque. La bascule ne touche que le
 * rendu interne — les props d'`EtatErreur` (`quoi`, `onReessayer`, `enCours`, `detail`,
 * `compact`) ne changent pas, donc aucun des 125 appelants n'est a modifier.</p>
 *
 * <p>Les noms de props different d'une version a l'autre : `color` devient une `variant`
 * semantique, `isLoading` devient `isPending`, `onClick` devient `onPress`, et
 * `startContent` disparait au profit d'enfants ordinaires. Une prop V2 laissee en place
 * serait SILENCIEUSEMENT ignoree — le bouton resterait cliquable pendant une relance.</p>
 */
import { Button, Spinner } from '@heroui-v3/react';
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
/**
 * `compact` : une seule LIGNE, pour un echec qui occupe la place d'un bloc de contenu.
 *
 * <p>La forme centree d'origine tient 200 px de haut : une icone de 40 px, un titre, deux
 * lignes d'explication, un bouton. C'est juste pour une zone qui remplace un tableau
 * entier. Sur le tableau de bord, TROIS echecs simultanes empilaient trois de ces blocs —
 * 600 px de vide vertical, trois icones geantes, et la meme phrase repetee trois fois.</p>
 *
 * <p>En compact, l'echec tient sur une ligne avec sa relance a droite. L'information est
 * la meme ; elle cesse d'occuper l'ecran.</p>
 */
export default function EtatErreur({
    quoi,
    onReessayer,
    enCours = false,
    detail,
    compact = false,
}: EtatErreurProps & { compact?: boolean }) {
    if (compact) {
        return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2.5">
                <WifiOff aria-hidden="true" className="size-4 shrink-0 text-danger-soft-foreground" />
                <span className="min-w-0 flex-1 text-sm text-danger-soft-foreground">
                    {quoi ? `Impossible de charger ${quoi}` : 'Impossible de charger cette donnée'}
                </span>
                {onReessayer && (
                    <Button isPending={enCours} onPress={onReessayer} size="sm" variant="danger-soft">
                        {({ isPending }: { isPending: boolean }) => (
                            <>
                                {isPending && <Spinner color="current" size="sm" />}
                                Réessayer
                            </>
                        )}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <WifiOff aria-hidden="true" className="h-10 w-10 text-danger-soft-foreground" />
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
                <Button isPending={enCours} onPress={onReessayer} size="sm" variant="danger-soft">
                    {({ isPending }: { isPending: boolean }) => (
                        <>
                            {isPending ? (
                                <Spinner color="current" size="sm" />
                            ) : (
                                <RefreshCcw aria-hidden="true" className="size-4" />
                            )}
                            Réessayer
                        </>
                    )}
                </Button>
            )}
            {detail && <p className="max-w-sm truncate text-xs text-default-400">{detail}</p>}
        </div>
    );
}
