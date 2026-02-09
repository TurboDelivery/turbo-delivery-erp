import { Metadata } from 'next';
import Content from './content';

export const metadata: Metadata = {
  title: 'Restaurants',
};

export default function Restaurants() {
  return <Content />;
}
