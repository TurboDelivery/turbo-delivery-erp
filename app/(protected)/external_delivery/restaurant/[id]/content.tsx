'use client';
import dayjs from 'dayjs';
import { SORT_OPTIONS } from '@/data';
import { PaginatedResponse } from '@/types';
import { useState, useEffect, useRef } from 'react';
import { Clock, Package, Store } from 'lucide-react';
import { createUrlFile } from '@/utils/createUrlFile';
import DeliveryTools from '../../component/deliveryTools';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import EtatErreur from '@/components/commons/EtatErreur';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { getPaginationCourseExterne, getPaginationCourseExterneEnAttente } from '@/src/actions/courses.actions';
import { Avatar, Card, CardBody, CardFooter, CardHeader, Chip, Pagination, Skeleton } from "@/components/heroui";

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
    restaurantId: string
}

export default function Content({ initialData, delivers, restaurantId }: Props) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [data, setData] = useState<PaginatedResponse<CourseExterne> | null>(initialData);
    const [dataFilter, setDataFilter] = useState<CourseExterne[]>(data?.content ?? []);
    // `getPaginationCourseExterne` avale l'erreur et rend `null` : une page
    // absente vaut lecture en echec, jamais liste vide. Le squelette n'a donc
    // plus a couvrir ce cas, c'est l'etat d'erreur qui le prend.
    const [erreurLecture, setErreurLecture] = useState(!initialData);
    const [isLoading, setIsLoading] = useState(false);

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
            audioRef.current.play().catch(() => {
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

    const fetchData = async (page: number) => {
        setCurrentPage(page);
        setIsLoading(true);
    
        try {
            // ✅ Ajoute "await" ici pour récupérer la valeur réelle
            const response = await getPaginationCourseExterne(restaurantId, page - 1, pageSize);
    
            setData(response);
            setDataFilter(response?.content ?? []);
            setStatusFilter('all');
            setErreurLecture(!response);
        } catch (error) {
            console.error('Error fetching data:', error);
            setErreurLecture(true);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDataSilently = async (page: number) => {
        try {
            const newData = await getPaginationCourseExterne(restaurantId, page - 1, pageSize);
            setData(newData);
            if (statusFilter === 'all') {
                setDataFilter(newData?.content ?? []);
            } else {
                const filtered = newData?.content.filter((d) => d.statut?.toUpperCase() === statusFilter) ?? [];
                setDataFilter(filtered);
            }
            setErreurLecture(!newData);
        } catch (error) {
            console.error('Error refreshing data:', error);
            setErreurLecture(true);
        }
    };

    return (
        <div className="w-full h-full pb-10">
            <audio ref={audioRef} src="/assets/sounds/notification.wav" preload="auto" />
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-primary">Toutes les courses</h1>
            </div>

            <div>
                {erreurLecture && !data?.content.length ? (
                    // A la place du message de vide : "aucune course trouvee"
                    // est la reponse a un filtre, pas a un appel qui a echoue.
                    <EtatErreur
                        quoi="les courses de ce partenaire"
                        onReessayer={() => fetchData(currentPage)}
                        enCours={isLoading}
                    />
                ) : isLoading ? (
                    <div className="flex flex-col gap-6">
                        {[...Array(2)].map((_, index) => (
                            <Skeleton key={index} className="rounded-lg h-52" />
                        ))}
                    </div>
                ) : data?.content.length ? (
                    <>
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
                                            <span>Créé le {delivery.createdAt ? dayjs(delivery.createdAt).format('DD/MM/YYYY HH:mm:ss') : '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="text-gray-400" />                                        

                                            {/* Statut */}
                                            <Chip
                                                color={getStatusColor(delivery.statut)}
                                                variant="flat" className="text-sm font-medium px-2 py-0.5 rounded-md">
                                                {delivery.statut}
                                            </Chip>
                                        </div>
                                    </CardBody>
                                    <CardFooter>
                                        <div className="flex items-center justify-between w-full mb-2">
                                            {/* Partie gauche : infos restaurant */}
                                            <div className="flex items-center gap-2">
                                                {delivery?.restaurant?.logo ? (
                                                    <Avatar src={createUrlFile(delivery.restaurant.logo, 'restaurant')} size="sm" />
                                                ) : (
                                                    <Store className="text-gray-400" />
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900">{delivery?.restaurant?.nomEtablissement}</p>
                                                    <p className="text-gray-500 text-sm">{delivery?.restaurant?.commune}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyDataTable
                        title="Aucune course trouvée"
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
