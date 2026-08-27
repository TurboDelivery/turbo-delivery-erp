'use client';

import { useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@/components/heroui';
import { History } from 'lucide-react';
import EtatErreur from '@/components/commons/EtatErreur';
import { useZoneHistoriqueQuery } from '../queries/zones-demande-coursier.query';

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
};

interface ZoneHistoriqueButtonProps {
  fraisId?: string;
  zoneLabel?: string;
}

export default function ZoneHistoriqueButton({ fraisId, zoneLabel }: ZoneHistoriqueButtonProps) {
  const [open, setOpen] = useState(false);
  // `data === null` EST le signal d echec ici : l action avale l exception et
  // renvoie null. `isError` ne se declenche donc que si l appel casse plus tot.
  const { data, isLoading, isError, isFetching, refetch } = useZoneHistoriqueQuery(fraisId ?? null, open);
  const historique = data ?? [];

  if (!fraisId) return null;

  return (
    <>
      <Tooltip content="Historique des tarifs">
        <button
          type="button"
          className="text-lg text-default-400 cursor-pointer active:opacity-50"
          onClick={() => setOpen(true)}
        >
          <History size={20} />
        </button>
      </Tooltip>

      <Modal isOpen={open} onClose={() => setOpen(false)} size="lg" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Historique des tarifs
            {zoneLabel && <span className="text-sm font-normal text-default-500">{zoneLabel}</span>}
          </ModalHeader>
          <ModalBody>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : isError || data === null ? (
              <EtatErreur
                quoi="l’historique des tarifs"
                onReessayer={() => void refetch()}
                enCours={isFetching}
              />
            ) : (
              <Table aria-label="Historique des tarifs de la zone" removeWrapper>
                <TableHeader>
                  <TableColumn>Période</TableColumn>
                  <TableColumn>Tarif FCFA</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Aucun historique">
                  {historique.map((item, index) => (
                    <TableRow key={`${item.debut}-${index}`}>
                      <TableCell>
                        {item.fin
                          ? `Du ${formatDate(item.debut)} au ${formatDate(item.fin)}`
                          : `Du ${formatDate(item.debut)} — en cours`}
                      </TableCell>
                      <TableCell>{item.prixFcfa.toLocaleString('fr-FR')} FCFA</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setOpen(false)}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
