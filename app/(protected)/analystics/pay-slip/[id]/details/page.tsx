import { DetailContent } from './content';
const data = [
    {
        id: '1',
        restaurant: 'KFC 1',
        reference: 'ABC123',
        coutLivraison: '1500 Fcfa',
        coutCommande: '2500 Fcfa',
        dateHeure: '2022-01-01 2h:30',
        authentif: 'Oui',
    },
    {
        id: '2',
        restaurant: 'KFC 2',
        reference: 'XYZ456',
        coutLivraison: '2000 Fcfa',
        coutCommande: '2500 Fcfa',
        dateHeure: '2022-01-01 2h:30',
    },
];

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const {
        id
    } = params;

    return <DetailContent data={data} />;
}
