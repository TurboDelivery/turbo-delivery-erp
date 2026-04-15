'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Chip } from '@heroui/react';
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

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] min-h-[600px]">
      <Card className="w-full h-full shadow-md overflow-hidden flex flex-col">
        <CardHeader className="bg-primary text-white flex justify-between items-center px-4 py-3 shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📍 Trafic des Livreurs en Temps Réel
          </h3>
          <Chip variant="solid" className="bg-white text-primary font-medium">
            Total : {data.totalLivreurs}
          </Chip>
        </CardHeader>
        <CardBody className="p-2 flex-1 relative overflow-hidden">
          <MapLeaflet positions={positions} focusPosition={focusPosition} />
        </CardBody>
      </Card>

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
                onSelectLivreur={focusOnLivreur}
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
