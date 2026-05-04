import { Metadata } from 'next';
import SectionHeader from '@/components/dashboard/price-liste/SectionHeader';
import Content from './content';

export const metadata: Metadata = {
  title: 'Restaurants ayant des livraisons définies ',
  description: 'La liste des restaurants qui ont des livraisons définies.',
};

export default function Page() {
  return (
    <>
      <SectionHeader />
      <Content />
    </>
  );
}
