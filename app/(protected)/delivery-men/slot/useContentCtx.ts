'use client';

import { useEffect, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { LivreurBird } from '@/types/creneau-bird';
import { useSearchParams } from 'next/navigation';

interface Props {
    initialData: PaginatedResponse<LivreurBird> | null;
}

export default function useContentCtx({ initialData }: Props) {
    const searchParams = useSearchParams();
    const textParam = searchParams.get('text');

    const [initialBirdCreneau, setInitialBirdCreneau] = useState<LivreurBird[]>([]);
    const [initialBirdNotCreneau, setInitialBirdNotCreneau] = useState<LivreurBird[]>([]);
    const [birdCreneau, setBirdCreneau] = useState<LivreurBird[]>([]);
    const [birdNotCreneau, setBirdNotCreneau] = useState<LivreurBird[]>([]);

    // ⚡ Recalcule quand initialData change (pagination ou nouveau fetch)
    useEffect(() => {
        if (!initialData?.content) {
            setInitialBirdCreneau([]);
            setInitialBirdNotCreneau([]);
            return;
        }

        const creneau = initialData.content.filter(item => item.disponibiliteCreneau);
        const notCreneau = initialData.content.filter(item => !item.disponibiliteCreneau);

        setInitialBirdCreneau(creneau);
        setInitialBirdNotCreneau(notCreneau);
    }, [initialData]); // 👈 ici le fix

    // ⚡ Recalcule quand la recherche OU les listes initiales changent
    useEffect(() => {
        const searchText = textParam?.trim().toLowerCase() || '';

        if (searchText !== '') {
            setBirdCreneau(initialBirdCreneau.filter(item =>
                item.nomComplet.toLowerCase().includes(searchText)
            ));
            setBirdNotCreneau(initialBirdNotCreneau.filter(item =>
                item.nomComplet.toLowerCase().includes(searchText)
            ));
        } else {
            setBirdCreneau(initialBirdCreneau);
            setBirdNotCreneau(initialBirdNotCreneau);
        }
    }, [textParam, initialBirdCreneau, initialBirdNotCreneau]);

    return { birdCreneau, birdNotCreneau };
}
