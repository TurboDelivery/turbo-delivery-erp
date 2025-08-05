'use client';

import { Restaurant } from '@/types/creneau-turbo';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import UserRestaurantListe from '@/components/dashboard/delivery-men/slot/assignes/user-restaurant-list';
import UserRestaurantListeNotCreneau from '@/components/dashboard/delivery-men/slot/assignes/user-restaurant-list-not-creneau';

interface Props {
  initialData: PaginatedResponse<Restaurant> | null;
}

export default function Content({ initialData }: Props) {
    const { turboysCreneau, turboysNotCreneau } = useContentCtx({ initialData });

    return (
        <div className="p-4 bbg-gray-100 min-h-screen">
            <UserRestaurantListe turboysCreneau={turboysCreneau}/>      
            <UserRestaurantListeNotCreneau turboysCreneau={turboysNotCreneau}/>      
        </div>
    );
}
