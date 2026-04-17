'use client';

import { Button, Card, CardBody, CardHeader, Chip, Tab, Tabs } from '@heroui/react';
import { ChevronDown } from 'lucide-react';

import TraficLivreurList from '@/features/trafic/components/trafic-livreur-list';
import { TraficLivreursResponse } from '@/features/trafic/types/trafic.type';

interface TraficLivreurPanelProps {
  data: TraficLivreursResponse;
  selectedLivreurId: string | null;
  onSelectLivreur: (livreurId: string) => void;
  onClose: () => void;
}

export default function TraficLivreurPanel({
  data,
  selectedLivreurId,
  onSelectLivreur,
  onClose,
}: TraficLivreurPanelProps) {
  return (
    <Card className="w-full max-w-full sm:max-w-5xl mx-auto rounded-xl shadow-2xl border border-default-200 max-h-[65vh] flex flex-col">
      <CardHeader className="flex justify-between items-center gap-3 px-4 py-3 bg-default-50 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Livreurs</h3>
          <Chip size="sm" variant="flat">
            {data.totalLivreurs}
          </Chip>
        </div>
        <Button
          size="sm"
          isIconOnly
          variant="light"
          aria-label="Fermer le panneau"
          onPress={onClose}
          startContent={<ChevronDown className="w-4 h-4" />}
        />
      </CardHeader>
      <CardBody className="px-2 sm:px-4 pb-4 pt-2 flex-1 overflow-hidden">
        <Tabs aria-label="Catégories de livreurs" variant="underlined" color="primary" className="w-full">
          <Tab
            key="disponibles"
            title={
              <div className="flex items-center gap-2">
                <span>Disponibles</span>
                <Chip size="sm" variant="flat" color="success">
                  {data.disponibles.total}
                </Chip>
              </div>
            }
          >
            <TraficLivreurList
              livreurs={data.disponibles.liste}
              status="disponible"
              selectedLivreurId={selectedLivreurId}
              onSelect={onSelectLivreur}
              emptyLabel="Aucun livreur disponible"
            />
          </Tab>
          <Tab
            key="enActivite"
            title={
              <div className="flex items-center gap-2">
                <span>En livraison</span>
                <Chip size="sm" variant="flat" color="warning">
                  {data.enActivite.total}
                </Chip>
              </div>
            }
          >
            <TraficLivreurList
              livreurs={data.enActivite.liste}
              status="enActivite"
              selectedLivreurId={selectedLivreurId}
              onSelect={onSelectLivreur}
              emptyLabel="Aucune livraison en cours"
            />
          </Tab>
          <Tab
            key="indisponibles"
            title={
              <div className="flex items-center gap-2">
                <span>Indisponibles</span>
                <Chip size="sm" variant="flat" color="default">
                  {data.indisponibles.total}
                </Chip>
              </div>
            }
          >
            <TraficLivreurList
              livreurs={data.indisponibles.liste}
              status="indisponible"
              selectedLivreurId={selectedLivreurId}
              onSelect={onSelectLivreur}
              emptyLabel="Aucun livreur indisponible"
            />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}
