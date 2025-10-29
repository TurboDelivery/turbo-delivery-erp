'use client';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useState } from 'react';
import { PaginatedResponse } from '@/types';
import { courses_statuses_filters } from '@/data';
import IconPlus from '@/components/icon/icon-plus';
import { createUrlFile } from '@/utils/createUrlFile';
import DeliveryTools from '../component/deliveryTools';
import { Clock, Package, Store, Search } from 'lucide-react';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { getPaginationCourseExterneAutreStatus } from '@/src/actions/courses.actions';
import { Button, Card, CardBody, CardHeader, Chip, Pagination, Skeleton, Avatar, Input, CardFooter } from "@heroui/react";

const getStatusColor = (statut: string) => {
    switch (statut?.toUpperCase()) {
        case 'VALIDER': return 'warning';
        case 'TERMINER': return 'success';
        case 'ANNULER': return 'danger';
        case 'EN_ATTENTE': return 'secondary';
        default: return 'default';
    }
};
const getStatusTextColor = (statut: string) => {
    switch (statut?.toUpperCase()) {
        case 'VALIDER': return 'text-yellow-700';
        case 'TERMINER': return 'text-green-700';
        case 'ANNULER': return 'text-red-700';
        case 'EN_ATTENTE': return 'text-gray-500';
        case 'PREPARATION': return 'text-orange-600';
        default: return 'text-gray-600';
    }
};
const getStatusBorderClass = (statut: string) => {
    switch (statut?.toUpperCase()) {
        case 'VALIDER': return 'border-l-4 border-yellow-500';
        case 'TERMINER': return 'border-l-4 border-green-500';
        case 'ANNULER': return 'border-l-4 border-red-500';
        case 'EN_ATTENTE': return 'border-l-4 border-gray-500';
        case 'PREPARATION': return 'border-l-4 border-orange-500';
        default: return 'border border-gray-200';
    }
};

interface Props {
    initialData: PaginatedResponse<CourseExterne>;
    delivers: LivreurDisponible[];
}

export default function Content({ initialData, delivers }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRestaurant, setSelectedRestaurant] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [data, setData] = useState<PaginatedResponse<CourseExterne>>(initialData);
    const [dataFilter, setDataFilter] = useState<CourseExterne[]>(data?.content ?? []);
    const [isLoading, setIsLoading] = useState(!initialData);

    const handleFilter = (status: string) => {
        setIsLoading(true);
        setStatusFilter(status);
        setDataFilter(
            status === 'all'
                ? data.content
                : data.content.filter((d) => d.statut?.toUpperCase() === status)
        );
        setIsLoading(false);
    };

    const filterByCode = (term: string) => {
        if (!term.trim()) return handleFilter(statusFilter);
        const lowerTerm = term.toLowerCase();
        setDataFilter(
            data?.content.filter((item) => item.code?.toLowerCase().includes(lowerTerm) ||
                (!selectedRestaurant || item.restaurant.nomEtablissement === selectedRestaurant)
            ) ?? []
        );
    };

    const fetchData = async (page: number) => {
        setCurrentPage(page);
        setIsLoading(true);
        try {
            const newData = await getPaginationCourseExterneAutreStatus(page - 1, pageSize);
            setData(newData ?? initialData);
            setDataFilter(newData?.content ?? []);
            setStatusFilter('all');
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full pb-10">
            {/* HEADER */}
            <div className="flex items-center justify-between py-4 px-1">
                <h1 className="text-3xl font-bold text-[#E63946]">Toutes les courses</h1>
                <Button
                    as={Link}
                    href="/delivery/create"
                    color="danger"
                    size="lg"
                    className="rounded px-5 text-lg"
                    startContent={<IconPlus className="h-5 w-6" />}
                >Nouvelle course</Button>
            </div>

            {/* INPUTS FILTRES */}
            <div className="flex flex-col md:flex-row gap-3 items-center w-full mb-4 px-1">
                <Input
                    startContent={<Search className="text-gray-400 w-4 h-4" />}
                    label=""
                    variant="bordered"
                    placeholder="Rechercher par code"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        filterByCode(e.target.value);
                    }}
                    className="w-72"
                    size="sm"
                />

                {/* Restaurant selector */}
                {/* <select
                    className="border rounded px-3 py-2 w-56"
                    value={selectedRestaurant}
                    onChange={e => {
                        setSelectedRestaurant(e.target.value);
                        // Filtering could be triggered here
                        filterByCode(searchTerm);
                    }}
                >
                    <option value="">Tous les restaurants</option>
                    {[...new Set(data.content.map(d => d.restaurant.nomEtablissement))].map(resto =>
                        <option key={resto} value={resto}>{resto}</option>
                    )}
                </select> */}

                <Button color="danger" className="px-7">Rechercher</Button>
            </div>

            {/* PILLS & FILTERS */}
            <div className="flex gap-2 flex-wrap mb-5 px-1">
                {courses_statuses_filters.map((category) => (
                    <Button
                        key={category.id}
                        size="sm"
                        className="rounded-md font-medium"
                        variant={statusFilter === category.id ? 'solid' : 'flat'}
                        color={statusFilter === category.id ? 'danger' : 'default'}
                        onClick={() => handleFilter(category.id)}
                    >{category.name}</Button>
                ))}
            </div>

            {/* LISTE DES COURSES */}
            <div>
                {isLoading ? (
                    <div className="flex flex-col gap-6">
                        {[...Array(2)].map((_, i) => <Skeleton key={i} className="rounded-lg h-52" />)}
                    </div>
                ) : dataFilter.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dataFilter.map((delivery) => (
                            <Card key={delivery.id} className={`w-full bg-white ${getStatusBorderClass(delivery.statut)} shadow-md rounded-md`}>
                                <CardHeader className="flex justify-between items-center py-3 border-b">
                                    <div className="flex items-center gap-5">
                                        <span className={`font-bold text-base ${getStatusTextColor(delivery.statut)}`}>Code: {delivery.code}</span>
                                        <span className="bg-gray-900 text-white font-semibold rounded px-2 ml-2 py-1">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(
                                                (delivery.commandes?.reduce((sum, cmd) => sum + (cmd.prix ?? 0), 0) || 0) +
                                                (delivery.commandes?.reduce((sum, cmd) => sum + (cmd.fraisLivraison ?? 0), 0) || 0)
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <DeliveryTools delivery={delivery} delivers={delivers} />
                                    </div>
                                </CardHeader>
                                <CardBody className="py-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="text-gray-400" />
                                        <span className="font-medium">
                                            {delivery.nombreCommande} commande{delivery.nombreCommande > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="text-gray-400" />
                                        <span>Créé le {dayjs(delivery.createdAt).format('DD/MM/YYYY HH:mm:ss')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="text-gray-400" />                                        

                                        {/* Statut */}
                                        <Chip
                                            color={getStatusColor(delivery.statut)}
                                            variant="flat" className="text-sm font-medium px-2 py-0.5 rounded-md">
                                            {delivery.statut}
                                        </Chip>
                                        {/* Date de prise en charge */}
                                        <span className="text-sm text-gray-700">
                                            Prise en charge : {delivery.pickupAt ? dayjs(delivery.pickupAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                                        </span>
                                    </div>
                                </CardBody>
                                <CardFooter>
                                    <div className="flex items-center justify-between w-full mb-2">
                                        {/* Partie gauche : infos restaurant */}
                                        <div className="flex items-center gap-2">
                                            {delivery?.restaurant?.logo_Url ? (
                                                <Avatar src={createUrlFile(delivery.restaurant.logo_Url, 'restaurant')} size="sm" />
                                            ) : (
                                                <Store className="text-gray-400" />
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-900">{delivery?.restaurant?.nomEtablissement}</p>
                                                <p className="text-gray-500 text-sm">{delivery?.restaurant?.commune}</p>
                                            </div>
                                        </div>

                                        {/* Partie droite : lien */}
                                        <Link href={`/external_delivery/restaurant/${delivery?.restaurant?.id}`}
                                            className="text-primary text-sm font-medium hover:underline whitespace-nowrap">
                                            Voir toutes les courses du restaurant
                                        </Link>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <EmptyDataTable
                        title="Aucune Course Trouvée"
                        message="Aucune course ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                    />
                )}
            </div>
            {/* PAGINATION */}
            <div className="flex justify-center mt-8 w-full">
                <Pagination
                    total={data?.totalPages ?? 1}
                    page={currentPage}
                    onChange={fetchData}
                    showControls
                    color="danger"
                    variant="flat"
                    isDisabled={isLoading}
                />
            </div>
        </div>
    );
}
