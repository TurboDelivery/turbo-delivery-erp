import { Suspense } from 'react';
import Loading from '@/components/layouts/loading';
import { DetailNotification } from './content';
import { fetchDetailNotifcation } from '@/src/actions/notification.action';

export default async function Page({ params }: { params: { id: string } }) {
    const notificationDetail = await fetchDetailNotifcation(params.id ?? '');
    return (
        <Suspense fallback={<Loading />}>
            <DetailNotification detailNotification={notificationDetail} />
        </Suspense>
    );
}
