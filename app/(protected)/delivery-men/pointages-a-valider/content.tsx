'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
    type IPointageHorsZone,
    pointagesValidationAPI,
} from '@/features/pointages-validation/pointages-validation.api';
import { clePointage, FileArbitrage } from '@/features/pointages/refonte/file-arbitrage';
import { createUrlFile } from '@/utils/createUrlFile';

/**
 * Registre des pointages HORS-ZONE (règle owner 2026-07-31).
 *
 * <p>La conception et ses raisons sont documentées dans
 * `features/pointages/refonte/file-arbitrage.tsx`, qui porte le rendu. Ce fichier ne fait
 * plus que la lecture, les deux écritures et leurs messages.</p>
 *
 * <h3>Ce qui est corrigé au passage</h3>
 * <p>Le bouton « Valider » portait `isLoading={valider.isPending}` sur CHAQUE ligne :
 * valider un pointage mettait les quinze autres en attente. La clé du dossier en cours
 * circule désormais, et n'occupe que ses deux boutons.</p>
 */
export function PointagesAValiderContent() {
    const { data: session } = useSession();
    const userId = session?.user?.id ?? '';
    const queryClient = useQueryClient();

    /* La borne basse commande la fenêtre lue par le serveur (30 j par défaut). */
    const [depuis, setDepuis] = useState('');
    const [cleEnCours, setCleEnCours] = useState<string | null>(null);

    const { data: pointages, isError, isFetching, isLoading, refetch } = useQuery({
        queryKey: ['pointages-hors-zone', depuis],
        queryFn: () => pointagesValidationAPI.lister(depuis || undefined),
        // Pas de `refetchInterval` : un arbitrage humain n'est pas une urgence à la
        // demi-minute, `invalider()` rafraîchit déjà après chaque décision, et chaque
        // tick relisait trente jours de registre.
    });

    const invalider = () => queryClient.invalidateQueries({ queryKey: ['pointages-hors-zone'] });

    const valider = useMutation({
        mutationFn: (p: IPointageHorsZone) => pointagesValidationAPI.valider(p, userId),
        onSuccess: async () => {
            await invalider();
            toast.success('Pointage validé — il compte comme une présence normale.');
        },
        onError: () => toast.error('Validation impossible. Réessayez.'),
        onSettled: () => setCleEnCours(null),
    });

    const rejeter = useMutation({
        mutationFn: ({ motif, p }: { motif: string; p: IPointageHorsZone }) =>
            pointagesValidationAPI.rejeter(p, userId, motif),
        onSuccess: async () => {
            await invalider();
            toast.success('Pointage rejeté — la pénalité de cote est appliquée.');
        },
        onError: () => toast.error('Rejet impossible. Réessayez.'),
        onSettled: () => setCleEnCours(null),
    });

    return (
        <div className="pt-5">
            <FileArbitrage
                cleEnCours={cleEnCours}
                depuis={depuis}
                isError={isError}
                isFetching={isFetching}
                isLoading={isLoading}
                onDepuis={setDepuis}
                onReessayer={() => refetch()}
                onRejeter={(p, motif) => {
                    setCleEnCours(clePointage(p));
                    rejeter.mutate({ motif, p });
                }}
                onValider={(p) => {
                    setCleEnCours(clePointage(p));
                    valider.mutate(p);
                }}
                pointages={pointages ?? []}
                urlPreuve={(chemin) => createUrlFile(chemin, 'backend')}
            />
        </div>
    );
}
