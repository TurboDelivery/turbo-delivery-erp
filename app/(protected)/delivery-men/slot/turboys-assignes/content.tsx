'use client';

import { useState } from 'react';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/creneau-turbo';
import { getAllCreneauTurbo } from '@/src/creneau-livreur/creneau-livreur.action';
import UserRestaurantListe from '@/components/dashboard/delivery-men/slot/assignes/user-restaurant-list';
import UserRestaurantListeNotCreneau from '@/components/dashboard/delivery-men/slot/assignes/user-restaurant-list-not-creneau';

interface Props {
    initialData: PaginatedResponse<Restaurant> | null;
}

export default function Content({ initialData }: Props) {
    const [page, setPage] = useState(initialData?.number || 0);
    const [data, setData] = useState(initialData);

    // ⚡ on passe toujours "data" au hook
    const { turboysCreneau, turboysNotCreneau } = useContentCtx({ initialData: data });

    const handlePageChange = async (newPage: number) => {
        const newData = await getAllCreneauTurbo(newPage);
        setData(newData);  
        setPage(newPage);
    };

    if (!data) return <div>Chargement...</div>;

    return (
        <div className="p-4 bg-surface-secondary rounded-md">
            <UserRestaurantListe turboysCreneau={turboysCreneau} />
            <UserRestaurantListeNotCreneau turboysCreneau={turboysNotCreneau} />

            {/* Pagination */}
            <div className="flex justify-center mt-6 space-x-2">
                <button
                    disabled={data.first}
                    onClick={() => handlePageChange(page - 1)}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    Précédent
                </button>

                <span className="px-4 py-2 bg-surface border rounded">
                    Page {page + 1} / {data.totalPages}
                </span>

                <button
                    disabled={data.last}
                    onClick={() => handlePageChange(page + 1)}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    Suivant
                </button>
            </div>
        </div>
    );
}
