'use client';

import DeliveryMenTools from '@/components/dashboard/delivery-men/delivery-men-tools';
import { getDeliveryMen } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { DeliveryMan } from '@/types/models';
import { createUrlFile } from '@/utils/createUrlFile';
import { Avatar, Chip } from '@/components/heroui';
import { Key, useCallback, useState } from 'react';
import { toast } from 'sonner';

export const columns = [
    { name: 'Matricule', uid: 'matricule' },
    { name: 'Prénoms & Nom', uid: 'nom' },
    { name: 'Téléphone', uid: 'telephone' },
    { name: 'État du compte', uid: 'status' },
    { name: 'Actions', uid: 'actions' },
];

export const options = [
    { key: 'libre', label: 'Libre, identifier-le' },
    { key: 'utilise-partout', label: 'Utilisé partout' },
    { key: 'restaurant-agha', label: 'Restaurant AGAHA' },
];

interface Props {
    initialData: PaginatedResponse<DeliveryMan> | null;
}

export default function useContentCtx({ initialData }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    // Sans cet etat, un echec de lecture laissait la table sur « Aucun livreur »,
    // que l'operateur lit comme « il n'y a personne a traiter ».
    // initialData a null vaut echec : l'action serveur renvoie null sur exception,
    // alors qu'une page reellement vide renvoie un contenu vide.
    const [isError, setIsError] = useState(!initialData);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [data, setData] = useState<PaginatedResponse<DeliveryMan> | null>(initialData);

    // Fonction de récupération des données
    const fetchData = async (page: number) => {
        setCurrentPage(page);
        setIsLoading(true);
        try {
            const newData = await getDeliveryMen(page - 1, pageSize);
            // Meme piege cote client : l'action ne leve pas, elle renvoie null.
            if (!newData) {
                setIsError(true);
                toast.error('Erreur lors de la récupération des données');
                return;
            }
            setData(newData);
            setIsError(false);
        } catch (error) {
            setIsError(true);
            toast.error('Erreur lors de la récupération des données');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCell = useCallback((livreur: DeliveryMan, columnKey: Key) => {
        const cellValue = livreur[columnKey as keyof DeliveryMan];

        switch (columnKey) {
            case 'nom':
                return (
                    <div className="flex items-center gap-4">
                        <Avatar src={createUrlFile(livreur?.avatarUrl ?? '', 'delivery')} />
                        <div className="font-medium capitalize">
                            {livreur.prenoms} {livreur.nom}
                        </div>
                    </div>
                );
            case 'status':
                return (
                    <Chip size="sm" color={cellValue == 3 ? 'warning' : 'default'}>
                        {cellValue == 3 ? 'Partiellement' : 'Inconnu'}
                    </Chip>
                );

            case 'actions':
                return <DeliveryMenTools deliveryMan={livreur} validateBy="ops" />;

            default:
                return cellValue;
        }
    }, []);

    const renderCols = useCallback((column: { name: string; uid: string }) => {
        return <div className="flex gap-2 text-primary">{column.name}</div>;
    }, []);

    return {
        renderCell,
        renderCols,
        columns,
        data,
        fetchData,
        currentPage,
        isLoading,
        isError,
        // Relance la page couramment affichee, pas la premiere : l'operateur doit
        // retrouver l'ecran ou il en etait.
        reessayer: () => fetchData(currentPage),
    };
}
