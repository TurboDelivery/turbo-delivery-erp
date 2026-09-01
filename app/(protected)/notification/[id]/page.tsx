import { Suspense } from 'react';
import Loading from '@/components/layouts/loading';
import { DetailNotification } from './content';
import { fetchDetailNotifcation } from '@/src/actions/notifcation.action';

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const notifcationDetail = await fetchDetailNotifcation(params.id ?? '');
    return (
        <Suspense fallback={<Loading />}>
            <DetailNotification detailNotification={notifcationDetail} />
        </Suspense>
    );
}
