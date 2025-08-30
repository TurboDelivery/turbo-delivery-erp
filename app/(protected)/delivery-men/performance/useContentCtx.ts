'use client';

import { useEffect, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { useSearchParams } from 'next/navigation';

interface props {
    initialData: PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null;
}

export default function useContentCtx({ initialData }: props) {
    const [data, setData] = useState<LivreurPerformanceBirdEndTorubo[]>(initialData?.content || []);


    useEffect(() => {
        // Fonction pour calculer le début et la fin de la semaine actuelle
        function getWeekDateRange() {
            const today = new Date();
            const dayOfWeek = today.getDay(); // Dimanche = 0, Lundi = 1, etc.
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek + 1); // Début de la semaine (lundi)

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Fin de la semaine (dimanche)

            return { start: startOfWeek, end: endOfWeek };
        }

        // Fonction pour vérifier si une date est dans la plage de la semaine actuelle
        function isInCurrentWeek(dateStr: any) {
            const { start, end } = getWeekDateRange();
            const date = new Date(dateStr);
            return date >= start && date <= end;
        }

        // Filtrer les items qui ont un créneau dans la semaine actuelle
        const currentWeekItems = initialData?.content.filter(item =>
            isInCurrentWeek(item.creneau.debut) || isInCurrentWeek(item.creneau.fin)
        );

    }, [])

    return { data };
}
