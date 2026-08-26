'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Spinner,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AlertTriangle, GitMerge } from 'lucide-react';

import { createUrlFile } from '@/utils/createUrlFile';
import {
  donneesRattacheesRequest,
  fusionnerLivreursRequest,
  type ILivreurDonneesRattachees,
} from '@/features/turboys/apis/fusion-livreur.api';
import { turboyKeys } from '@/features/turboys/queries';

interface Props {
  ids: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}

const METRIQUES: { key: keyof ILivreurDonneesRattachees; label: string }[] = [
  { key: 'tickets', label: 'Tickets' },
  { key: 'courses', label: 'Courses' },
  { key: 'emplois', label: 'Emplois / pointages' },
  { key: 'paies', label: 'Paies' },
  { key: 'comptesTransfert', label: 'Comptes Wave' },
  { key: 'incidents', label: 'Incidents' },
];

export function FusionLivreursDialog({ ids, isOpen, onOpenChange, onDone }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['livreur-donnees-rattachees', ...[...ids].sort()],
    queryFn: () => donneesRattacheesRequest(ids),
    enabled: isOpen && ids.length >= 2,
    staleTime: 30 * 1000,
  });

  const comptes = useMemo(() => data ?? [], [data]);
  // Défaut : garder le compte qui a le PLUS de données (total le plus élevé).
  const suggereId = useMemo(() => {
    if (comptes.length === 0) return '';
    return [...comptes].sort((a, b) => b.total - a.total)[0].livreurId;
  }, [comptes]);
  const maxTotal = useMemo(() => Math.max(0, ...comptes.map((c) => c.total)), [comptes]);

  const [gardeId, setGardeId] = useState('');
  useEffect(() => {
    if (isOpen && suggereId) setGardeId(suggereId);
  }, [isOpen, suggereId]);

  const fusion = useMutation({
    mutationFn: () => {
      const supprimeIds = ids.filter((id) => id !== gardeId);
      return fusionnerLivreursRequest(gardeId, supprimeIds, userId ?? '');
    },
    onSuccess: (r) => {
      toast.success(`Fusion effectuée : ${r.fusionnes} compte(s) rattaché(s).`);
      qc.invalidateQueries({ queryKey: turboyKeys.lists() });
      onOpenChange(false);
      onDone?.();
    },
    onError: (e: unknown) => {
      toast.error(`Échec de la fusion : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    },
  });

  const [confirme, setConfirme] = useState(false);
  useEffect(() => {
    if (!isOpen) setConfirme(false);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-primary">
                <GitMerge className="h-5 w-5" />
                Fusionner des comptes livreurs en doublon
              </span>
              <span className="text-xs font-normal text-default-400">
                Choisis le compte à GARDER. Les données des autres y sont réassignées, puis ils sont
                désactivés (réversible). Aucune donnée n&apos;est perdue.
              </span>
            </ModalHeader>

            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="primary" label="Analyse des données rattachées…" />
                </div>
              ) : isError ? (
                <p className="py-6 text-center text-sm text-danger">
                  Impossible de charger les données rattachées.
                </p>
              ) : (
                <RadioGroup value={gardeId} onValueChange={setGardeId}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {comptes.map((c) => {
                      const estSuggere = c.total === maxTotal && maxTotal > 0;
                      const estGarde = c.livreurId === gardeId;
                      return (
                        <div
                          key={c.livreurId}
                          className={`rounded-xl border p-3 transition-colors ${
                            estGarde ? 'border-primary bg-primary-50' : 'border-default-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Radio value={c.livreurId} className="mt-1" />
                            <Avatar
                              src={c.avatarUrl ? createUrlFile(c.avatarUrl, 'backend') : undefined}
                              name={c.nomComplet}
                              size="sm"
                              className="shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate text-sm font-semibold text-default-800">
                                  {c.nomComplet}
                                </span>
                                {estSuggere && (
                                  <Chip size="sm" color="success" variant="flat">
                                    + de données
                                  </Chip>
                                )}
                              </div>
                              <p className="truncate text-xs text-default-400">{c.email ?? c.telephone ?? '—'}</p>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1 border-t border-default-100 pt-2">
                            {METRIQUES.map((m) => (
                              <div key={m.key} className="flex justify-between text-xs">
                                <span className="text-default-500">{m.label}</span>
                                <span className="font-medium tabular-nums text-default-700">
                                  {c[m.key] as number}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-default-100 pt-1 text-xs font-semibold">
                              <span className="text-default-600">Total</span>
                              <span className="tabular-nums text-primary">{c.total}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {!isLoading && !isError && (
                <label className="mt-2 flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-xs text-warning-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span className="flex-1">
                    Je confirme fusionner les {ids.length} comptes dans le compte sélectionné. Les autres
                    seront désactivés (réversible).
                  </span>
                  <input
                    type="checkbox"
                    checked={confirme}
                    onChange={(e) => setConfirme(e.target.checked)}
                    className="mt-0.5 h-4 w-4"
                  />
                </label>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={fusion.isPending}>
                Annuler
              </Button>
              <Button
                color="primary"
                startContent={<GitMerge className="h-4 w-4" />}
                isLoading={fusion.isPending}
                isDisabled={!gardeId || !confirme || comptes.length < 2 || !userId}
                onPress={() => fusion.mutate()}
              >
                Fusionner dans ce compte
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
