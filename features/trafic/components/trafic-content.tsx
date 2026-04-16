'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Chip } from '@heroui/react';
import { LayoutDashboard } from 'lucide-react';

import TraficLivreurPanel from '@/features/trafic/components/trafic-livreur-panel';
import { useTrafic } from '@/features/trafic/hooks/use-trafic';

const MapLeaflet = dynamic(() => import('@/components/dashboard/trafic/MapLeaflet'), { ssr: false });

export default function TraficContent() {
  const {
    data,
    positions,
    selectedLivreurId,
    focusPosition,
    focusOnLivreur,
    openDashboard,
    toggleDashboard,
  } = useTrafic();

  const handleSelectLivreur = useCallback(
    (livreurId: string) => {
      focusOnLivreur(livreurId);
      if (openDashboard) toggleDashboard();
    },
    [focusOnLivreur, openDashboard, toggleDashboard],
  );

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] min-h-[600px] overflow-hidden rounded-xl shadow-md">
      <div className="absolute inset-0">
        <MapLeaflet positions={positions} focusPosition={focusPosition} />
      </div>

      <div className="pointer-events-none absolute top-3 left-3 right-3 z-[1000] flex justify-between items-center gap-3">
        <h3 className="pointer-events-auto bg-primary text-white text-sm 2xl:text-base font-semibold px-3 py-2 rounded-lg shadow flex items-center gap-2">
          📍 Trafic des Livreurs en Temps Réel
        </h3>
        <Chip variant="solid" className="pointer-events-auto bg-white text-primary font-medium shadow">
          Total : {data.totalLivreurs}
        </Chip>
      </div>

      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-[1000] flex flex-col items-center">
        <AnimatePresence initial={false}>
          {openDashboard && (
            <motion.div
              key="dashboard-panel"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full px-2 sm:px-4 mb-3 pointer-events-auto"
            >
              <TraficLivreurPanel
                data={data}
                selectedLivreurId={selectedLivreurId}
                onSelectLivreur={handleSelectLivreur}
                onClose={toggleDashboard}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!openDashboard && (
          <div className="mb-4 pointer-events-auto">
            <Button
              onPress={toggleDashboard}
              color="primary"
              variant="shadow"
              startContent={<LayoutDashboard className="w-4 h-4" />}
            >
              Voir les livreurs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
