'use client';

import { useEffect, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/creneau-turbo';
import { useSearchParams } from 'next/navigation';

interface Props { initialData: PaginatedResponse<Restaurant> | null; }

export default function useContentCtx({ initialData }: Props) {
    const searchParams = useSearchParams();
    const [search, setSearch] = useState<string | null>(null);
    const textParam = searchParams.get('text');

    const [initialTurboysCreneau, setInitialTurboysCreneau] = useState<Restaurant[]>([]);
    const [initialTurboysNotCreneau, setInitialTurboysNotCreneau] = useState<Restaurant[]>([]);
    const [turboysCreneau, setTurboysCreneau] = useState<Restaurant[]>([]);
    const [turboysNotCreneau, setTurboysNotCreneau] = useState<Restaurant[]>([]);

    function filterTurboysCreneau() {
        if (!initialData?.content) {
            setInitialTurboysCreneau([]);
            return;
        }
        const data = initialData.content.filter(
            (restaurant) => restaurant.livreurs && restaurant.livreurs.length > 0
        );
        setInitialTurboysCreneau(data);
    }

    function filterTurboysNotCreneau() {
        if (!initialData?.content) {
            setInitialTurboysNotCreneau([]);
            return;
        }
        const data = initialData.content.filter(
            (restaurant) => restaurant.livreurs && restaurant.livreurs.length == 0
        );
        setInitialTurboysNotCreneau(data);
    }

    // ⚡ Se recalculer à chaque changement de "initialData"
    useEffect(() => {
        filterTurboysCreneau();
        filterTurboysNotCreneau();
    }, [initialData]); // 👈 ici

    useEffect(() => {
        setSearch(textParam);

        if (search !== null && search.trim() !== '') {
            const filtered =
                initialTurboysCreneau.filter((item) =>
                    item.nomRestaurant.toLowerCase().includes(search.toLowerCase())
                ) || [];
            setTurboysCreneau(filtered);
        } else {
            setTurboysCreneau(initialTurboysCreneau || []);
        }
    }, [search, textParam, initialTurboysCreneau]);

    useEffect(() => {
        setSearch(textParam);

        if (search !== null && search.trim() !== '') {
            const filtered =
                initialTurboysNotCreneau.filter((item) =>
                    item.nomRestaurant.toLowerCase().includes(search.toLowerCase())
                ) || [];
            setTurboysNotCreneau(filtered);
        } else {
            setTurboysNotCreneau(initialTurboysNotCreneau || []);
        }
    }, [search, textParam, initialTurboysNotCreneau]);

    return { turboysCreneau, turboysNotCreneau };
}
