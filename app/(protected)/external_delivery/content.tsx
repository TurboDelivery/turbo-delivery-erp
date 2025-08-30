'use client';
import { title } from '@/components/primitives';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { PaginatedResponse } from '@/types';
import {
    Clock, MapPin, User, Package, CreditCard, Store, ChevronDown, ChevronUp
} from 'lucide-react';
import {
    Button, Card, CardBody, CardHeader, Chip, Divider, Pagination, Skeleton
} from "@heroui/react";
import { useState, useEffect, useRef } from 'react';
import { SORT_OPTIONS } from '@/data';
import DeliveryTools from './component/deliveryTools';
import { getPaginationCourseExterneEnAttente } from '@/src/actions/courses.actions';

type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

const getStatusColor = (statut: string) => {
    switch (statut?.toUpperCase()) {
        case 'VALIDER': return 'warning';
        case 'TERMINER': return 'success';
        case 'ANNULER': return 'danger';
        case 'EN_ATTENTE': return 'secondary';
        default: return 'default';
    }
};

const getCommandeStatusColor = (statut: string) => {
    switch (statut?.toUpperCase()) {
        case 'EN_ATTENTE_VERSEMENT': return 'warning';
        case 'TERMINER': return 'success';
        case 'ANNULER': return 'danger';
        case 'RECUPERER':
        case 'EN_COURS_LIVRAISON': return 'secondary';
        default: return 'default';
    }
};

const getStatusBorderClass = (statut: string) => {
    switch (statut?.toUpperCase()) {
        case 'VALIDER': return 'border-2 border-warning';
        case 'TERMINER': return 'border-2 border-success';
        case 'ANNULER': return 'border-2 border-danger';
        case 'EN_ATTENTE': return 'border-2 border-secondary';
        default: return 'border border-default';
    }
};

interface Props {
    initialData: PaginatedResponse<CourseExterne> | null;
    delivers: LivreurDisponible[];
}

export default function Content({ initialData, delivers }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS.DATE_DESC);
    const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [data, setData] = useState<PaginatedResponse<CourseExterne> | null>(initialData);
    const [dataFilter, setDataFilter] = useState<CourseExterne[]>(data?.content ?? []);
    const [isLoading, setIsLoading] = useState(!initialData);

    // 🔊 Audio setup
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [canPlayAudio, setCanPlayAudio] = useState(false);

    // Autoriser lecture du son après interaction utilisateur
    useEffect(() => {
        const unlockAudio = () => {
            setCanPlayAudio(true);
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    // Jouer/stopper le son selon dataFilter
    useEffect(() => {
        if (!canPlayAudio || !audioRef.current) return;

        if (dataFilter.length > 0) {
            audioRef.current.loop = true;
            // audioRef.current.play().catch((e) => console.error("Erreur audio :", e));
            audioRef.current.play().catch(() => {
                alert("🔴Nouvelle Course🔴, Cliquez sur OK pour activer 🔔.");
                audioRef.current?.play();
            });
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [dataFilter, canPlayAudio]);

    // Refresh auto toutes les 15s
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            fetchDataSilently(currentPage);
        }, 15000);

        return () => clearInterval(refreshInterval);
    }, [currentPage]);

    const handleFilter = (status: string, _data?: PaginatedResponse<CourseExterne> | null) => {
        setIsLoading(true);
        setStatusFilter(status);
        const dd = typeof _data === 'undefined' ? data : _data;
        if (status === 'all') {
            setDataFilter(dd?.content ?? []);
        } else {
            const filtered = dd?.content.filter((d) => d.statut?.toUpperCase() === status) ?? [];
            setDataFilter(filtered);
        }
        setIsLoading(false);
    };

    const fetchData = async (page: number) => {
        setCurrentPage(page);
        setIsLoading(true);
        try {
            const newData = await getPaginationCourseExterneEnAttente(page - 1, pageSize);
            setData(newData);
            setDataFilter(newData?.content ?? []);
            setStatusFilter('all');
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDataSilently = async (page: number) => {
        try {
            const newData = await getPaginationCourseExterneEnAttente(page - 1, pageSize);
            setData(newData);
            if (statusFilter === 'all') {
                setDataFilter(newData?.content ?? []);
            } else {
                const filtered = newData?.content.filter((d) => d.statut?.toUpperCase() === statusFilter) ?? [];
                setDataFilter(filtered);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    const handleReset = () => {
        setSearchTerm('');
        setSortBy(SORT_OPTIONS.DATE_DESC);
        setCurrentPage(1);
    };

    const toggleExpand = (deliveryId: string) => {
        setExpandedDelivery(expandedDelivery === deliveryId ? null : deliveryId);
    };

    return (
        <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
            <audio ref={audioRef} src="/assets/sounds/notification.wav" preload="auto" />

            <div className="flex items-center justify-between">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Mes Courses</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Ajoute tes filtres ou inputs ici si besoin */}
            </div>

            {isLoading ? (
                <div className="flex flex-col gap-6">
                    {[...Array(2)].map((_, index) => (
                        <Skeleton key={index} className="rounded-lg h-52" />
                    ))}
                </div>
            ) : data?.content.length ? (
                <>
                    <div className="grid grid-cols-1 gap-6">
                        {dataFilter.map((delivery) => (
                            <Card key={delivery.id} className={`w-full ${getStatusBorderClass(delivery.statut)}`}>
                                <CardHeader className="flex justify-between">
                                    <div className="flex items-center gap-4">
                                        <Chip color={getStatusColor(delivery.statut)} variant="flat">
                                            {delivery.statut}
                                        </Chip>
                                        <span className="text-default-500 font-bold">Code: {delivery.code}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <DeliveryTools delivery={delivery} delivers={delivers} />
                                        <Button isIconOnly color="primary" variant="light" onClick={() => toggleExpand(delivery.id)}>
                                            {expandedDelivery === delivery.id ? <ChevronUp /> : <ChevronDown />}
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardBody>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Store className="text-default-500" />
                                            <div>
                                                <p className="text-default-700">{delivery?.restaurant?.nomEtablissement}</p>
                                                <p className="text-default-500 text-sm">{delivery?.restaurant?.commune}</p>
                                            </div>
                                        </div>

                                        <Divider />

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Package className="text-default-500" />
                                                <span>
                                                    {delivery.nombreCommande} commande{delivery.nombreCommande > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <span className="text-large font-semibold">{delivery.total.toFixed(2)} XOF</span>
                                        </div>

                                        {expandedDelivery === delivery.id && (
                                            <div className="mt-4 space-y-4">
                                                {delivery.commandes.map((commande, index) => (
                                                    <Card key={commande.id} className="w-full">
                                                        <CardHeader className="flex justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <Chip size="sm" variant="flat" color={getCommandeStatusColor(commande.statut)}>
                                                                    {commande.statut ?? 'EN_ATTENTE'}
                                                                </Chip>
                                                                <span className="text-default-500 font-bold">Commande #{index + 1}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-default-500 font-bold">{commande.numero}</span>
                                                            </div>
                                                        </CardHeader>
                                                        <CardBody>
                                                            <div className="space-y-3">
                                                                <div className="flex items-start gap-2">
                                                                    <User className="text-default-500 mt-1" />
                                                                    <div>
                                                                        <p className="text-default-700">{commande.destinataire.nomComplet}</p>
                                                                        <p className="text-default-500">{commande.destinataire.contact}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-start gap-2">
                                                                    <MapPin className="text-default-500 mt-1" />
                                                                    <p className="text-default-600">{`${commande.lieuLivraison.latitude}, ${commande.lieuLivraison.longitude}`}</p>
                                                                </div>

                                                                <Divider />

                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <CreditCard className="text-default-500" />
                                                                        <span className="text-default-600">{commande.modePaiement}</span>
                                                                    </div>
                                                                    <span className="font-semibold">{commande.prix.toFixed(2)} XOF</span>
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}

                                        <Divider />

                                        <div className="flex items-center gap-2">
                                            <Clock className="text-default-500" />
                                            <div>
                                                <p className="text-default-600">Début: {delivery.dateHeureDebut}</p>
                                                <p className="text-default-600">Fin: {delivery.dateHeureFin ?? '---'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                        <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                        <Pagination
                            total={data?.totalPages ?? 1}
                            page={currentPage}
                            onChange={fetchData}
                            showControls
                            color="primary"
                            variant="bordered"
                            isDisabled={isLoading}
                        />
                    </div>
                </>
            ) : (
                <Card className="min-h-52">
                    <CardBody className="flex justify-center items-center">
                        <p className="text-center text-default-500">Aucune course ne correspond à vos critères de recherche. Essayez de modifier vos filtres.</p>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
