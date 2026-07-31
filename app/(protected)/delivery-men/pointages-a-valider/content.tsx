'use client';

import { useState } from 'react';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import {
  IPointageAValider,
  TYPE_POINTAGE_LABEL,
  pointagesValidationAPI,
} from '@/features/pointages-validation/pointages-validation.api';
import { createUrlFile } from '@/utils/createUrlFile';

/**
 * Arbitrage des pointages HORS-ZONE (règle owner 2026-07-31).
 *
 * Le livreur qui pointe loin de son poste ne se justifie plus lui-même : son
 * signalement attend ici. Valider = le pointage compte (et ouvre la file
 * d'attente si c'est la montée). Rejeter = pénalité de cote, commentaire
 * obligatoire.
 */
export function PointagesAValiderContent() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';
  const queryClient = useQueryClient();

  const { data: pointages, isLoading } = useQuery({
    queryKey: ['pointages-a-valider'],
    queryFn: () => pointagesValidationAPI.lister(),
    refetchInterval: 30_000,
  });

  const [rejet, setRejet] = useState<IPointageAValider | null>(null);
  const [commentaire, setCommentaire] = useState('');

  const invalider = () =>
    queryClient.invalidateQueries({ queryKey: ['pointages-a-valider'] });

  const valider = useMutation({
    mutationFn: (p: IPointageAValider) => pointagesValidationAPI.valider(p, userId),
    onSuccess: async () => {
      await invalider();
      toast.success('Pointage validé — il compte comme une présence normale.');
    },
    onError: () => toast.error('Validation impossible. Réessayez.'),
  });

  const rejeter = useMutation({
    mutationFn: ({ p, motif }: { p: IPointageAValider; motif: string }) =>
      pointagesValidationAPI.rejeter(p, userId, motif),
    onSuccess: async () => {
      await invalider();
      setRejet(null);
      setCommentaire('');
      toast.success('Pointage rejeté — la pénalité de cote est appliquée.');
    },
    onError: () => toast.error('Rejet impossible. Réessayez.'),
  });

  const lignes = pointages ?? [];

  return (
    <div className="pt-5">
      <div className="mb-5 rounded-xl border bg-white p-5 dark:bg-black">
        <h1 className="text-lg font-semibold text-primary">Pointages à valider</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pointages effectués <span className="font-medium">hors de la zone du poste</span>. Un
          pointage validé compte comme une présence normale (la montée fait entrer le livreur dans
          la file d&apos;attente) ; un pointage rejeté entraîne la pénalité de cote.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-black">
        <Table isStriped aria-label="Pointages hors zone en attente de validation">
          <TableHeader>
            <TableColumn>LIVREUR</TableColumn>
            <TableColumn>DATE</TableColumn>
            <TableColumn>SIGNALEMENT</TableColumn>
            <TableColumn>HEURE</TableColumn>
            <TableColumn>DISTANCE</TableColumn>
            <TableColumn>MOTIF DU LIVREUR</TableColumn>
            <TableColumn>PREUVE</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={isLoading ? 'Chargement…' : 'Aucun pointage en attente.'}
          >
            {lignes.map((p) => (
              <TableRow key={`${p.emploiId}-${p.date}-${p.type}`}>
                <TableCell className="font-medium">{p.livreur ?? '—'}</TableCell>
                <TableCell>{new Date(p.date).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="warning">
                    {TYPE_POINTAGE_LABEL[p.type] ?? p.type}
                  </Chip>
                </TableCell>
                <TableCell>
                  {p.pointeAt
                    ? new Date(p.pointeAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </TableCell>
                <TableCell>
                  {p.distanceMetres != null
                    ? p.distanceMetres >= 1000
                      ? `${(p.distanceMetres / 1000).toFixed(1)} km`
                      : `${Math.round(p.distanceMetres)} m`
                    : '—'}
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <span className="block truncate text-sm text-gray-600" title={p.motif ?? ''}>
                    {p.motif || <span className="text-gray-400">Aucun motif</span>}
                  </span>
                </TableCell>
                <TableCell>
                  {p.preuveUrl ? (
                    <a
                      href={createUrlFile(p.preuveUrl, 'backend')}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary underline underline-offset-2"
                    >
                      Voir la preuve
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      isLoading={valider.isLoading}
                      onPress={() => valider.mutate(p)}
                    >
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => {
                        setCommentaire('');
                        setRejet(p);
                      }}
                    >
                      Rejeter
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Rejet : commentaire obligatoire — il part dans l'historique de cote du livreur. */}
      <Modal
        isOpen={rejet !== null}
        onOpenChange={(open) => {
          if (!open) setRejet(null);
        }}
        size="md"
      >
        <ModalContent>
          {(fermer) => (
            <>
              <ModalHeader>Rejeter le pointage</ModalHeader>
              <ModalBody className="gap-3">
                <p className="text-sm text-gray-600">
                  {rejet?.livreur} — {rejet ? TYPE_POINTAGE_LABEL[rejet.type] : ''} du{' '}
                  {rejet ? new Date(rejet.date).toLocaleDateString('fr-FR') : ''}. Le rejet applique
                  la pénalité de cote ; le commentaire est visible dans son historique.
                </p>
                <Input
                  autoFocus
                  label="Motif du rejet (obligatoire)"
                  size="sm"
                  value={commentaire}
                  onValueChange={setCommentaire}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={fermer}>
                  Annuler
                </Button>
                <Button
                  color="danger"
                  isDisabled={!commentaire.trim()}
                  isLoading={rejeter.isLoading}
                  onPress={() => rejet && rejeter.mutate({ p: rejet, motif: commentaire.trim() })}
                >
                  Rejeter le pointage
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
