import Content from './content';
import React, { Suspense } from 'react';
import Loading from '@/components/layouts/loading';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { getAllOrders, getOrdersStats } from '@/src/actions/commandes.actions';

export default async function Page() {
    const commandes = await getAllOrders();
    const restaurants = await getAllRestaurants();
    const stats = await getOrdersStats();

    return (
        <Suspense fallback={<Loading />}>
            <Content commandesInitiales={commandes} restaurants={restaurants} stats={stats} />
        </Suspense>
    );
}
