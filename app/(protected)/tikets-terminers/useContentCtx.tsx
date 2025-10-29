'use client';

import { getBonLivraisonAll } from '@/src/actions/bon-commande.action';
import { PaginatedResponse } from '@/types';
import { BonLivraison } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';
import { CalendarDate, Chip, RangeValue } from '@heroui/react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Key, useCallback, useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';

dayjs.extend(isBetween);

const getStatusColor = (statut: string) => {
    switch (statut?.toUpperCase()) {
        case 'VALIDER': return 'warning';
        case 'TERMINER': return 'success';
        case 'ANNULER': return 'danger';
        case 'EN_ATTENTE': return 'secondary';
        default: return 'default';
    }
};

export const columns = [
    { name: 'CODE', uid: 'reference' },
    { name: 'RESTAURANT', uid: 'restaurant' },
    { name: 'LIVREUR', uid: 'livreur' },
    { name: 'COMMANDE TOTALE', uid: 'coutCommande' },
    { name: 'COÛT DE LIVRAISON', uid: 'coutLivraison' },
    { name: 'DATE ET HEURE', uid: 'date' },
    { name: 'STATUT DE LA COMMANDE', uid: 'statut' },
];

interface Props {
    initialData: PaginatedResponse<BonLivraison> | null;
    restaurants: Restaurant[];
}

export default function useContentCtx({ initialData, restaurants }: Props) {
    const [pageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [data, setData] = useState<PaginatedResponse<BonLivraison> | null>(initialData);

    // Filtres
    const [dates, setDates] = useState<RangeValue<CalendarDate> | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

    // 🔹 Gère le changement de date
    const handleDateChange = (value: RangeValue<CalendarDate>) => {
        if (value.start && value.end) {
            setDates(value);
            setCurrentPage(0); // remise à la 1ère page
        } else {
            setDates(null);
        }
    };

    // 🔹 Gère le changement de restaurant
    const handleChangeRestaurant = (restaurantId: any) => {
        const restaurant = restaurants.find((r) => r.id === restaurantId);
        setSelectedRestaurant(restaurant?.nomEtablissement ?? null);
        setCurrentPage(0);
    };

    // 🔹 Récupération depuis l'API
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const newData = await getBonLivraisonAll(
                    0,
                    1000,
                    {
                        dates: {
                            start: dates?.start?.toString() ?? '',
                            end: dates?.end?.toString() ?? ''
                        }
                    }
                );
                setData(newData);
            } catch (error) {
                toast.error('Erreur lors de la récupération des données');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [dates?.start, dates?.end]);

    // 🔹 Filtrage local + statut TERMINER + pagination
    const filteredData = useMemo(() => {
        if (!data?.content) return [];

        let filtered = data.content;

        // 🔹 Filtre par statut TERMINER
        filtered = filtered.filter(item => item.statut?.toUpperCase() === 'TERMINER');

        // 🔹 Filtre restaurant
        if (selectedRestaurant) {
            filtered = filtered.filter(item =>
                item.restaurant?.toLowerCase().includes(selectedRestaurant.toLowerCase())
            );
        }

        // 🔹 Filtre dates
        if (dates?.start && dates?.end) {
            const startDate = dayjs(dates.start.toString());
            const endDate = dayjs(dates.end.toString());
            filtered = filtered.filter(item =>
                dayjs(item.date).isBetween(startDate, endDate, 'day', '[]')
            );
        }

        return filtered;
    }, [data, dates, selectedRestaurant]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const currentItems = filteredData.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

    // 🔹 Rendu des cellules
    const renderCell = useCallback((bonLivraison: BonLivraison, columnKey: Key) => {
        const cellValue = bonLivraison[columnKey as keyof BonLivraison];

        switch (columnKey) {
            case 'livreur':
                return <p>{cellValue?.toString() ?? '-'}</p>;
            case 'coutLivraison':
            case 'coutCommande':
                return (
                    <p>
                        {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF',
                        }).format(Number(cellValue) || 0)}
                    </p>
                );
            case 'statut':
                return (
                    <Chip
                        color={getStatusColor(String(cellValue ?? ''))}
                        variant="flat"
                        className="text-sm font-medium px-2 py-0.5 rounded-md"
                    >
                        {String(cellValue ?? '')}
                    </Chip>
                );
            case 'date':
                return (
                    <p>
                        {dayjs(
                            typeof cellValue === 'object' && cellValue !== null && 'hour' in cellValue
                                ? `1970-01-01T${String(cellValue.hour).padStart(2, '0')}:${String(cellValue.minute).padStart(2, '0')}:${String(cellValue.second ?? 0).padStart(2, '0')}`
                                : cellValue as string | number | Date | undefined
                        ).format('DD/MM/YYYY')}
                    </p>
                );
            default:
                return <p>{String(cellValue ?? '')}</p>;
        }
    }, []);

    return {
        renderCell,
        columns,
        data: { ...data, content: currentItems, totalPages },
        handlePageChange: setCurrentPage,
        currentPage,
        isLoading,
        handleDateChange,
        handleChangeRestaurant
    };
}
