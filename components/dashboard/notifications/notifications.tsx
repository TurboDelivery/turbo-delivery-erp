'use client';

import { Suspense } from 'react';
import Loading from '@/app/loading';
import Content from './content';

function Notifications({ className }: { className?: string }) {
    return (
        <div className={className}>
            <Suspense fallback={<Loading />}>
                <Content />
            </Suspense>
        </div>
    );
}

export default Notifications;
