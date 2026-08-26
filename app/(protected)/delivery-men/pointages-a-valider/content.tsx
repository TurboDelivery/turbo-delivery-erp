'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import {
  IPointageHorsZone,
  TYPE_POINTAGE_LABEL,
  VALIDATION_LABEL,
  ValidationPointage,
  pointagesValidationAPI,
} from '@/features/pointages-validation/pointages-validation.api';
import { createUrlFile } from '@/utils/createUrlFile';
import EtatErreur from '@/components/commons/EtatErreur';

const COULEUR_VALIDATION: Record<ValidationPointage, 'warning' | 'success' | 'danger'> = {
  EN_ATTENTE: 'warning',
  VALIDE: 'success',
  REJETE: 'danger',
};

/**
 * Registre des pointages HORS-ZONE (règle owner 2026-07-31) : la file
 * d'arbitrage ET l'historique des décisions, filtrables (statut, dates,
 * livreur, restaurant, type de signalement).
 */
export function PointagesAValiderContent() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';
  const queryClient = useQueryClient();

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [statutFiltre, setStatutFiltre] = useState<'TOUS' | ValidationPointage>('EN_ATTENTE');
  const [rechercheLivreur, setRechercheLivreur] = useState('');
  const [restaurantFiltre, setRestaurantFiltre] = useState('TOUS');
  const [typeFiltre, setTypeFiltre] = useState('TOUS');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const { data: pointages, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['pointages-hors-zone', dateDebut],
    // La fenêtre serveur suit la borne basse choisie (défaut 30 j) ; le reste
    // du filtrage est client — volumes faibles, réactivité immédiate.
    queryFn: () => pointagesValidationAPI.lister(dateDebut || undefined),
    // Pas de `refetchInterval` : un arbitrage humain n'est pas une urgence à la
    // demi-minute, `invalider()` rafraîchit déjà après chaque validation ou rejet,
    // et chaque tick relisait 30 jours de registre.
  });

  const [rejet, setRejet] = useState<IPointageHorsZone | null>(null);
  const [commentaire, setCommentaire] = useState('');

  const invalider = () =>
    queryClient.invalidateQueries({ queryKey: ['pointages-hors-zone'] });

  const valider = useMutation({
    mutationFn: (p: IPointageHorsZone) => pointagesValidationAPI.valider(p, userId),
    onSuccess: async () => {
      await invalider();
      toast.success('Pointage validé — il compte comme une présence normale.');
    },
    onError: () => toast.error('Validation impossible. Réessayez.'),
  });

  const rejeter = useMutation({
    mutationFn: ({ p, motif }: { p: IPointageHorsZone; motif: string }) =>
      pointagesValidationAPI.rejeter(p, userId, motif),
    onSuccess: async () => {
      await invalider();
      setRejet(null);
      setCommentaire('');
      toast.success('Pointage rejeté — la pénalité de cote est appliquée.');
    },
    onError: () => toast.error('Rejet impossible. Réessayez.'),
  });

  // Restaurants distincts observés — alimente le select sans référentiel dédié.
  const restaurants = useMemo(() => {
    const noms = new Set<string>();
    (pointages ?? []).forEach((p) => {
      if (p.restaurant) noms.add(p.restaurant);
    });
    return Array.from(noms).sort();
  }, [pointages]);

  const lignes = useMemo(() => {
    const q = rechercheLivreur.trim().toLowerCase();
    return (pointages ?? []).filter((p) => {
      if (statutFiltre !== 'TOUS' && p.validation !== statutFiltre) return false;
      if (q && !(p.livreur ?? '').toLowerCase().includes(q)) return false;
      if (restaurantFiltre !== 'TOUS' && p.restaurant !== restaurantFiltre) return false;
      if (typeFiltre !== 'TOUS' && p.type !== typeFiltre) return false;
      if (dateFin && p.date > dateFin) return false;
      return true;
    });
  }, [pointages, statutFiltre, rechercheLivreur, restaurantFiltre, typeFiltre, dateFin]);

  const nbAttente = (pointages ?? []).filter((p) => p.validation === 'EN_ATTENTE').length;

  return (
    <div className="pt-5">
      <div className="mb-5 rounded-xl border bg-white p-5 dark:bg-black">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-primary">Pointages hors zone</h1>
            <p className="mt-1 text-sm text-gray-500">
              File d&apos;arbitrage et historique des décisions. Un pointage validé compte comme une
              présence normale (la montée fait entrer le livreur dans la file d&apos;attente) ; un
              rejet entraîne la pénalité de cote.
            </p>
          </div>
          <Chip color="warning" variant="flat">
            {nbAttente} en attente
          </Chip>
        </div>

        {/* ── Barre de filtres ── */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <Select
            label="Statut"
            size="sm"
            selectedKeys={[statutFiltre]}
            onSelectionChange={(k) => setStatutFiltre((Array.from(k)[0] as typeof statutFiltre) ?? 'TOUS')}
          >
            <SelectItem key="EN_ATTENTE">En attente</SelectItem>
            <SelectItem key="VALIDE">Validés</SelectItem>
            <SelectItem key="REJETE">Rejetés</SelectItem>
            <SelectItem key="TOUS">Tous</SelectItem>
          </Select>
          <Input
            label="Livreur"
            size="sm"
            placeholder="Rechercher…"
            value={rechercheLivreur}
            onValueChange={setRechercheLivreur}
          />
          <Select
            label="Restaurant"
            size="sm"
            selectedKeys={[restaurantFiltre]}
            onSelectionChange={(k) => setRestaurantFiltre((Array.from(k)[0] as string) ?? 'TOUS')}
          >
            {[
              <SelectItem key="TOUS">Tous</SelectItem>,
              ...restaurants.map((r) => <SelectItem key={r}>{r}</SelectItem>),
            ]}
          </Select>
          <Select
            label="Signalement"
            size="sm"
            selectedKeys={[typeFiltre]}
            onSelectionChange={(k) => setTypeFiltre((Array.from(k)[0] as string) ?? 'TOUS')}
          >
            <SelectItem key="TOUS">Tous</SelectItem>
            <SelectItem key="START">Montée</SelectItem>
            <SelectItem key="MID">Relance 1</SelectItem>
            <SelectItem key="MID2">Relance 2</SelectItem>
            <SelectItem key="END">Fin de service</SelectItem>
          </Select>
          <Input
            label="Du"
            size="sm"
            type="date"
            value={dateDebut}
            onValueChange={setDateDebut}
          />
          <Input label="Au" size="sm" type="date" value={dateFin} onValueChange={setDateFin} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-black">
        {/* L'echec de lecture remplace le tableau. Avant, il affichait « Aucun
            pointage sur ces criteres. », soit exactement le message d'un backlog
            vide : l'equipe concluait qu'il n'y avait rien a trancher pendant que
            des livreurs attendaient leur arbitrage. */}
        {isError ? (
          <EtatErreur
            quoi="les pointages à valider"
            onReessayer={() => refetch()}
            enCours={isFetching}
          />
        ) : (
        <Table isStriped aria-label="Registre des pointages hors zone">
          <TableHeader>
            <TableColumn>LIVREUR</TableColumn>
            <TableColumn>RESTAURANT</TableColumn>
            <TableColumn>DATE</TableColumn>
            <TableColumn>SIGNALEMENT</TableColumn>
            <TableColumn>HEURE</TableColumn>
            <TableColumn>DISTANCE</TableColumn>
            <TableColumn>MOTIF</TableColumn>
            <TableColumn>PREUVE</TableColumn>
            <TableColumn>STATUT</TableColumn>
            <TableColumn>DÉCISION</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={isLoading ? 'Chargement…' : 'Aucun pointage sur ces critères.'}
          >
            {lignes.map((p) => (
              <TableRow key={`${p.emploiId}-${p.date}-${p.type}`}>
                <TableCell className="font-medium">{p.livreur ?? '—'}</TableCell>
                <TableCell className="text-sm text-gray-600">{p.restaurant ?? '—'}</TableCell>
                <TableCell>{new Date(p.date).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
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
                <TableCell className="max-w-[200px]">
                  <span className="block truncate text-sm text-gray-600" title={p.motif ?? ''}>
                    {p.motif || <span className="text-gray-400">—</span>}
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
                      Voir
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color={COULEUR_VALIDATION[p.validation]}>
                    {VALIDATION_LABEL[p.validation]}
                  </Chip>
                </TableCell>
                <TableCell>
                  {p.validation === 'EN_ATTENTE' ? (
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
                  ) : (
                    <Tooltip
                      content={
                        <div className="max-w-[260px] p-1 text-xs">
                          {p.arbitre && <p className="font-semibold">{p.arbitre}</p>}
                          {p.valideAt && (
                            <p className="text-gray-500">
                              {new Date(p.valideAt).toLocaleString('fr-FR')}
                            </p>
                          )}
                          {p.commentaireValidation && (
                            <p className="mt-1">{p.commentaireValidation}</p>
                          )}
                          {!p.arbitre && !p.commentaireValidation && (
                            <p className="text-gray-500">Décision d&apos;avant la refonte.</p>
                          )}
                        </div>
                      }
                    >
                      <span className="cursor-help text-sm text-gray-600 underline decoration-dotted underline-offset-2">
                        {p.arbitre ?? 'Détail'}
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
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
