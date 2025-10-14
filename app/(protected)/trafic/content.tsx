'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Button } from '@heroui/react';
import { ChevronDown, LayoutDashboard } from 'lucide-react';
import { getTraficDelivers } from '@/src/actions/trafic.actions';
import { LivreurTrafic, TraficLivreursResponse } from '@/types/models';
import { LivreurTimeline } from '@/components/dashboard/trafic/LivreurTimeline';

const MapLeaflet = dynamic(() => import('@/components/dashboard/trafic/MapLeaflet'), { ssr: false });

export default function Content({ data: initialData }: { data: TraficLivreursResponse }) {
    const [data, setData] = useState<TraficLivreursResponse>(initialData);
    const [positions, setPositions] = useState<LivreurTrafic[]>([]);
    const [selectedLivreurId, setSelectedLivreurId] = useState<string | null>(null);
    const [openDashboard, setOpenDashboard] = useState<boolean>(false);

    const toggleDashboard = useCallback(() => setOpenDashboard(prev => !prev), []);
    const handleLivreurSelect = useCallback((livreurId: string | null) => setSelectedLivreurId(livreurId), []);

    // Mettre à jour les positions à chaque changement de data
    useEffect(() => {
        const combinedPositions = [
            ...data.disponibles.liste,
            ...data.enActivite.liste,
        ].filter(l => l.position.latitude !== 0 && l.position.longitude !== 0);
        setPositions(combinedPositions);
    }, [data]);

    // Rafraîchissement toutes les 15 secondes
    useEffect(() => {
        const fetchData = async () => {
            try {
                const updatedData = await getTraficDelivers();
                setData(updatedData);
            } catch (error) {
                console.error('Erreur lors de la récupération des livreurs:', error);
            }
        };

        const interval = setInterval(fetchData, 15000); // toutes les 15 secondes
        return () => clearInterval(interval); // nettoyage
    }, []);

    // DashboardPanel et reste du composant restent inchangés
    const DashboardPanel = () => (
        <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full"
        >
            <Card className="w-full max-w-full sm:max-w-6xl mx-auto rounded-md">
                <CardHeader className="flex justify-center items-center pb-2">
                    <Button 
                        size="sm" 
                        onClick={toggleDashboard}
                        isIconOnly 
                        startContent={<ChevronDown />} 
                        variant="light" 
                    />
                </CardHeader>
                <CardBody className="space-y-6 px-4 sm:px-6 pb-6">
                    {/* Statistiques et timeline comme avant */}
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                            <div className="font-semibold text-xl">{data.disponibles.total}</div>
                            <div className="text-gray-500">Livreurs disponibles</div>
                        </div>
                        <div>
                            <div className="font-semibold text-xl text-green-600">{data.indisponibles.total}</div>
                            <div className="text-gray-500">Livreurs indisponibles</div>
                        </div>
                        <div>
                            <div className="font-semibold text-xl text-red-600">{data.enActivite.total}</div>
                            <div className="text-gray-500">Livreurs en activité de Livraison</div>
                        </div>
                    </div>

                    {selectedLivreurId && (
                        <div className="border-t pt-4">
                            {(() => {
                                const livreur =
                                    data.enActivite.liste.find(l => l.livreurId === selectedLivreurId) ||
                                    data.disponibles.liste.find(l => l.livreurId === selectedLivreurId) ||
                                    data.indisponibles.liste.find(l => l.livreurId === selectedLivreurId);

                                if (!livreur) return <p className="text-gray-500">Livreur non trouvé</p>;

                                const { latitude, longitude } = livreur.position;

                                return (
                                    <div className="text-sm space-y-1">
                                        <h4 className="font-medium">{livreur.nomComplet}</h4>
                                        <p className="text-gray-600">
                                            📍 Latitude : {latitude.toFixed(6)}, Longitude : {longitude.toFixed(6)}
                                        </p>
                                        <p className="text-gray-500">📱 {livreur.telephone}</p>
                                        {livreur.course && (
                                            <p className="text-green-600">🚚 En course : {livreur.course}</p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <LivreurTimeline 
                        title={"Livreurs disponibles"} 
                        data={data.disponibles.liste}  
                        handleCourierSelect={handleLivreurSelect}  
                    />  
                    <LivreurTimeline 
                        title={"Livreurs indisponibles"} 
                        data={data.indisponibles.liste}  
                        handleCourierSelect={handleLivreurSelect}  
                    />  
                    <LivreurTimeline 
                        title={"Livreurs en activité de Livraison"} 
                        data={data.enActivite.liste}  
                        handleCourierSelect={handleLivreurSelect}  
                    />  
                </CardBody>
            </Card>
        </motion.div>
    );

    return (
        <>
            {/* Carte principale */}
            <Card className="w-full h-[85vh] shadow-md overflow-visible relative">
                <CardHeader className="bg-primary text-white flex justify-between items-center px-4 py-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">📍 Trafic des Livreurs en Temps Réel</h3>
                    <div className="text-sm font-medium bg-white text-primary px-3 py-1 rounded-md shadow">
                        Total Livreurs: {data.totalLivreurs}
                    </div>
                </CardHeader>
                <CardBody className="p-2 h-[80vh] relative">
                    <MapLeaflet positions={positions} />
                </CardBody>
            </Card>

            {/* Dashboard flottant */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    {!openDashboard ? (
                        <motion.div 
                            key="open-button"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute bottom-4 left-0 right-0 mx-auto max-w-[80%] bg-background rounded-md p-2 flex justify-center shadow-lg z-[38]"
                        >
                            <Button 
                                onClick={toggleDashboard}
                                isIconOnly 
                                startContent={<LayoutDashboard />}
                                variant="bordered" 
                                color="primary" 
                                size="sm" 
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard-panel"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            transition={{ duration: 0.4 }}
                            className="absolute bottom-4 left-0 right-0 mx-auto max-w-[80%] z-[1000]"
                        >
                            <DashboardPanel />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
