'use client';

import React, { useMemo, useState } from 'react';
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
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  Checkbox,
  useDisclosure,
} from '@/components/heroui';
import { History, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import EtatErreur from '@/components/commons/EtatErreur';
import {
  useCommissionHistoryQuery,
  useModifierCommissionMutation,
} from '@/features/restaurants/commissions/commission.query';
import {
  ICommissionVersion,
  TypeCommissionVersion,
} from '@/features/restaurants/commissions/commission.types';

const TYPE_OPTIONS: { key: TypeCommissionVersion; label: string }[] = [
  { key: 'POURCENTAGE', label: 'Pourcentage (%)' },
  { key: 'MONTANT_FIXE', label: 'Montant fixe (FCFA)' },
  { key: 'AUCUNE', label: 'Aucune commission' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatType(t: TypeCommissionVersion): string {
  return t === 'POURCENTAGE' ? 'Pourcentage' : t === 'MONTANT_FIXE' ? 'Montant fixe' : 'Aucune';
}

function formatValeur(v: ICommissionVersion): string {
  if (v.type === 'AUCUNE') return '—';
  if (v.type === 'POURCENTAGE') return `${v.valeur} %`;
  return `${Number(v.valeur).toLocaleString('fr-FR')} FCFA`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'en cours';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

function sourceChip(source: string) {
  const map: Record<string, { label: string; color: 'default' | 'primary' | 'warning' }> = {
    MANUEL: { label: 'Manuel', color: 'default' },
    RETROACTIF: { label: 'Rétroactif', color: 'warning' },
    MIGRATION: { label: 'Initiale', color: 'primary' },
  };
  const cfg = map[source] ?? { label: source, color: 'default' as const };
  return <Chip size="sm" variant="flat" color={cfg.color}>{cfg.label}</Chip>;
}

export function CommissionHistorySection({ restaurantId }: { restaurantId: string }) {
  const { data: versions, isLoading, isError, isFetching, refetch } = useCommissionHistoryQuery(restaurantId);
  const mutation = useModifierCommissionMutation(restaurantId);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [type, setType] = useState<TypeCommissionVersion>('POURCENTAGE');
  const [valeur, setValeur] = useState<string>('0');
  const [seuil, setSeuil] = useState<string>('');
  const [dateEffet, setDateEffet] = useState<string>(todayISO());
  const [motif, setMotif] = useState<string>('');
  const [retroactif, setRetroactif] = useState<boolean>(false);

  const isAnterior = useMemo(() => dateEffet < todayISO(), [dateEffet]);

  function resetForm() {
    setType('POURCENTAGE');
    setValeur('0');
    setSeuil('');
    setDateEffet(todayISO());
    setMotif('');
    setRetroactif(false);
  }

  async function onSubmit() {
    try {
      const res = await mutation.mutateAsync({
        dateEffet,
        type,
        valeur: type === 'AUCUNE' ? 0 : Number(valeur) || 0,
        seuil: type === 'MONTANT_FIXE' && seuil !== '' ? Number(seuil) : null,
        motif: motif.trim() || null,
        retroactif: isAnterior && retroactif,
      });
      const suffix =
        isAnterior && retroactif
          ? ` — ${res.coursesRecalculees} course(s) non recouvrée(s) recalculée(s)`
          : '';
      toast.success(`Commission mise à jour${suffix}`);
      resetForm();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Erreur lors de la mise à jour de la commission');
    }
  }

  const list = versions ?? [];

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-base font-semibold text-primary flex items-center gap-2">
          <History className="w-4 h-4" /> Historique des commissions
        </h2>
        <Button
          type="button"
          size="sm"
          color="primary"
          variant="flat"
          startContent={<Pencil className="w-3.5 h-3.5" />}
          onPress={() => {
            resetForm();
            onOpen();
          }}
        >
          Modifier la commission
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" label="Chargement de l'historique…" />
        </div>
      ) : isError ? (
        // Les versions datees sont opposables : annoncer "aucune version"
        // sur un echec de lecture ferait poser une commission a l'aveugle.
        <EtatErreur
          quoi="les versions de commission"
          onReessayer={() => refetch()}
          enCours={isFetching}
        />
      ) : list.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">Aucune version de commission enregistrée.</p>
      ) : (
        <>
          {/* Desktop : tableau */}
          <div className="hidden md:block">
            <Table aria-label="Historique des commissions" isStriped removeWrapper>
              <TableHeader>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>VALEUR</TableColumn>
                <TableColumn>SEUIL</TableColumn>
                <TableColumn>PÉRIODE D'EFFET</TableColumn>
                <TableColumn>STATUT</TableColumn>
                <TableColumn>ORIGINE</TableColumn>
                <TableColumn>AUTEUR</TableColumn>
                <TableColumn>MOTIF</TableColumn>
              </TableHeader>
              <TableBody>
                {list.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{formatType(v.type)}</TableCell>
                    <TableCell className="font-semibold">{formatValeur(v)}</TableCell>
                    <TableCell>{v.seuil != null ? `${Number(v.seuil).toLocaleString('fr-FR')} FCFA` : '—'}</TableCell>
                    <TableCell>
                      {formatDate(v.dateDebutEffet)} → {formatDate(v.dateFinEffet)}
                    </TableCell>
                    <TableCell>
                      {v.courante ? (
                        <Chip size="sm" color="success" variant="flat">Courante</Chip>
                      ) : (
                        <Chip size="sm" variant="flat">Historique</Chip>
                      )}
                    </TableCell>
                    <TableCell>{sourceChip(v.source)}</TableCell>
                    <TableCell className="text-gray-500">{v.auteurNom ?? '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-gray-500">{v.motif ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile : cartes */}
          <div className="md:hidden space-y-3">
            {list.map((v) => (
              <div key={v.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-400">{formatType(v.type)}</p>
                    <p className="text-sm font-semibold text-primary">{formatValeur(v)}</p>
                  </div>
                  {v.courante ? (
                    <Chip size="sm" color="success" variant="flat">Courante</Chip>
                  ) : (
                    sourceChip(v.source)
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400">Période</span>
                  <span className="text-sm text-gray-700 text-right">
                    {formatDate(v.dateDebutEffet)} → {formatDate(v.dateFinEffet)}
                  </span>
                </div>
                {v.seuil != null && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">Seuil</span>
                    <span className="text-sm text-gray-700">{Number(v.seuil).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {v.auteurNom && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">Auteur</span>
                    <span className="text-sm text-gray-700 text-right">{v.auteurNom}</span>
                  </div>
                )}
                {v.motif && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">Motif</span>
                    <span className="text-sm text-gray-700 text-right">{v.motif}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Modifier la commission */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">Modifier la commission</ModalHeader>
              <ModalBody className="gap-4">
                <Select
                  label="Type de commission"
                  selectedKeys={[type]}
                  onSelectionChange={(keys) =>
                    setType((Array.from(keys as Set<string>)[0] as TypeCommissionVersion) ?? 'POURCENTAGE')
                  }
                  variant="bordered"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.key}>{o.label}</SelectItem>
                  ))}
                </Select>

                {type !== 'AUCUNE' && (
                  <Input
                    label={type === 'POURCENTAGE' ? 'Taux (%)' : 'Montant fixe (FCFA)'}
                    type="number"
                    value={valeur}
                    onChange={(e) => setValeur(e.target.value)}
                    variant="bordered"
                    min={0}
                    max={type === 'POURCENTAGE' ? 100 : undefined}
                  />
                )}

                {type === 'MONTANT_FIXE' && (
                  <Input
                    label="Seuil d'application — défaut partenaire (FCFA, optionnel)"
                    description="Montant minimum de commande sous lequel la commission ne s'applique pas. Une zone peut définir son propre seuil dans la grille tarifaire (prioritaire)."
                    type="number"
                    value={seuil}
                    onChange={(e) => setSeuil(e.target.value)}
                    variant="bordered"
                    min={0}
                  />
                )}

                <Input
                  label="Date d'effet"
                  type="date"
                  value={dateEffet}
                  onChange={(e) => setDateEffet(e.target.value)}
                  variant="bordered"
                />

                <Textarea
                  label="Motif (optionnel)"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  variant="bordered"
                  minRows={2}
                />

                {isAnterior && (
                  <Checkbox isSelected={retroactif} onValueChange={setRetroactif} size="sm">
                    Appliquer à une période antérieure (recalcule les courses{' '}
                    <span className="font-semibold">non encore recouvrées</span> depuis cette date)
                  </Checkbox>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} type="button">
                  Annuler
                </Button>
                <Button color="primary" onPress={onSubmit} isLoading={mutation.isPending} type="button">
                  Enregistrer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
