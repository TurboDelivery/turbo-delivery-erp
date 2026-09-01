import { Metadata } from 'next';
import Content from './content';
import { getDeliveryDetail } from '@/src/actions/delivery-men.actions';

export const metadata: Metadata = {
    title: 'Delievry Man',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1.0,
};

export default async function DeliveryManPage(props: { params: Promise<{ driver_id: string }> }) {
    const params = await props.params;
    const driver = await getDeliveryDetail(params.driver_id ?? "");
    return (
        <Content driver={driver} />
    );
}
