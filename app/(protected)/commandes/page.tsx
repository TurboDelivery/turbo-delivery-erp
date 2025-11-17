import Content from './content';
import React, { Suspense } from 'react';
import Loading from '@/components/layouts/loading';
import { getAllOrders } from '@/src/actions/commandes.actions';

export default async function Page() {
    const commandes = await getAllOrders();
    return (
        <Suspense fallback={<Loading />}>
            <Content commandesInitiales={commandes} />
        </Suspense>
    );
}
