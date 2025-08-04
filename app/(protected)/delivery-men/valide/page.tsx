import { getDeliveryMenValidated } from '@/src/actions/delivery-men.actions';
import { Metadata } from 'next';
import Content from './content';
export const metadata: Metadata = {
    title: 'Delivery Men',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1.0,
};

export default async function DeliveryMen() {
    const deliveryMen = await getDeliveryMenValidated(0, 5);
    return <Content initialData={deliveryMen} />;
}
