'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Avatar, Button, Chip, Tooltip } from '@/components/heroui';
import {
  ArrowLeft,
  BikeIcon,
  Check,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Package,
  Phone,
  Store,
  UserRoundPlus,
  Wallet,
  XCircle,
} from 'lucide-react';

import { CourseExterneDetail, LivreurDisponible } from '@/types/models';
import { cancelCourseExterne, terminerCourseExterne } from '@/src/actions/courses.actions';
import { useAbility } from '@/hooks/use-ability';
import ConfirmModal from '@/components/ui/confirm-modal';
import { createUrlFile } from '@/utils/createUrlFile';
import DeliveryAssign from '../component/delivery-assign';
import { CommandeStatutChip, CourseStatutChip, fmtXof } from '../component/course-statut';

// ─── Timeline ──────────────────────────────────────────────────────────────────
const ETAPES = [
  { key: 'EN_ATTENTE', label: 'Créée' },
  { key: 'VALIDER', label: 'Assignée' },
  { key: 'EN_COURS', label: 'En livraison' },
  { key: 'TERMINER', label: 'Terminée' },
];
const ETAPE_INDEX: Record<string, number> = { EN_ATTENTE: 0, EN_PREPARATION: 0, VALIDER: 1, EN_COURS: 2, TERMINER: 3 };

function Timeline({ statut }: { statut: string }) {
  const key = (statut ?? '').toUpperCase();
  if (key === 'ANNULER') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
        <XCircle className="w-4 h-4" />
        Course annulée
      </div>
    );
  }
  const current = ETAPE_INDEX[key] ?? 0;
  return (
    <div className="flex items-center w-full overflow-x-auto py-1">
      {ETAPES.map((etape, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={etape.key}>
            {i > 0 && <div className={`h-0.5 flex-1 min-w-6 ${i <= current ? 'bg-primary' : 'bg-surface-tertiary'}`} />}
            <div className="flex flex-col items-center gap-1 shrink-0 px-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  done
                    ? 'bg-primary border-primary text-white'
                    : active
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-separator text-muted bg-surface'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[11px] font-medium whitespace-nowrap ${active || done ? 'text-primary' : 'text-muted'}`}>
                {etape.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const mapsUrl = (p?: { latitude?: number; longitude?: number } | null) =>
  p?.latitude != null && p?.longitude != null ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}` : null;

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span className="text-muted shrink-0">{icon}</span>
      {children}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Content({ course, delivers }: { course: CourseExterneDetail; delivers: LivreurDisponible[] }) {
  const router = useRouter();
  const ability = useAbility();
  const canUpdate = ability.can('update', 'Commande');

  const [openAssign, setOpenAssign] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [openFinish, setOpenFinish] = useState(false);
  const [pending, setPending] = useState(false);

  const statut = (course.statut ?? '').toUpperCase();
  const enAttente = statut === 'EN_ATTENTE';
  const enCours = statut === 'VALIDER' || statut === 'EN_COURS';

  const sousTotal = useMemo(() => (course.commandes ?? []).reduce((s, c) => s + (c.prix ?? 0), 0), [course.commandes]);
  const totalFrais = useMemo(() => (course.commandes ?? []).reduce((s, c) => s + (c.fraisLivraison ?? 0), 0), [course.commandes]);

  async function handleCancel() {
    const restaurantId = course.restaurant?.id;
    if (!restaurantId) {
      toast.error('Restaurant de la course introuvable.');
      return;
    }
    setPending(true);
    try {
      const result = await cancelCourseExterne(course.id, restaurantId);
      if (result.status === 'success') {
        toast.success('Course annulée.');
        setOpenCancel(false);
        router.refresh();
      } else {
        toast.error(result.message || "Impossible d'annuler la course.");
      }
    } finally {
      setPending(false);
    }
  }

  async function handleFinish() {
    setPending(true);
    try {
      const result = await terminerCourseExterne(course.id);
      if (result.status === 'success') {
        toast.success('Course terminée.');
        setOpenFinish(false);
        router.refresh();
      } else {
        toast.error(result.message || 'Impossible de terminer la course.');
      }
    } finally {
      setPending(false);
    }
  }

  const logoUrl = course.restaurant?.logo_Url ?? course.restaurant?.logo;

  return (
    <div className="pb-16">
      {/* Back */}
      <Link
        href="/external_delivery"
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux courses
      </Link>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-primary">Course {course.code}</h1>
            <CourseStatutChip statut={course.statut} size="md" />
          </div>
          <p className="text-sm text-muted mt-1">
            {course.dateHeureDebut ? `Créée le ${dayjs(course.dateHeureDebut).format('DD/MM/YYYY à HH:mm')}` : ''}
            {course.dateHeureFin ? ` · terminée le ${dayjs(course.dateHeureFin).format('DD/MM/YYYY à HH:mm')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && enAttente && (
            <>
              <Button
                color="primary"
                size="sm"
                startContent={<UserRoundPlus className="w-4 h-4" />}
                onPress={() => setOpenAssign(true)}
              >
                Assigner un livreur
              </Button>
              <Button
                color="danger"
                variant="bordered"
                size="sm"
                startContent={<XCircle className="w-4 h-4" />}
                onPress={() => setOpenCancel(true)}
              >
                Annuler
              </Button>
            </>
          )}
          {canUpdate && enCours && (
            <Button
              color="success"
              size="sm"
              className="text-white"
              startContent={<CheckCircle2 className="w-4 h-4" />}
              onPress={() => setOpenFinish(true)}
            >
              Terminer la course
            </Button>
          )}
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="bg-surface rounded-xl border border-separator shadow-xs px-6 py-4 mb-6">
        <Timeline statut={course.statut} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Colonne principale : commandes ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-primary flex items-center gap-2">
            <Package className="w-4 h-4" />
            Commandes ({course.commandes?.length ?? 0})
          </h2>
          {(course.commandes ?? []).map((cmd) => {
            const recup = mapsUrl(cmd.lieuRecuperation);
            const livr = mapsUrl(cmd.lieuLivraison);
            return (
              <div key={cmd.id} className="bg-surface rounded-xl border border-separator shadow-xs p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-sm font-semibold text-foreground">{cmd.numero}</span>
                  <CommandeStatutChip statut={cmd.statut} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <InfoRow icon={<Store className="w-4 h-4" />}>
                    <span className="truncate">Récupération : {course.restaurant?.nomEtablissement ?? '—'}</span>
                    {recup && (
                      <Tooltip content="Ouvrir dans Google Maps">
                        <a href={recup} target="_blank" rel="noreferrer" className="text-primary hover:opacity-70">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Tooltip>
                    )}
                  </InfoRow>
                  <InfoRow icon={<MapPin className="w-4 h-4" />}>
                    <span className="truncate">Livraison : {cmd.zone ?? 'zone non renseignée'}</span>
                    {livr && (
                      <Tooltip content="Ouvrir dans Google Maps">
                        <a href={livr} target="_blank" rel="noreferrer" className="text-primary hover:opacity-70">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Tooltip>
                    )}
                  </InfoRow>
                  <InfoRow icon={<Phone className="w-4 h-4" />}>
                    <span className="truncate">
                      {cmd.destinataire?.nomComplet ?? 'Destinataire inconnu'}
                      {cmd.destinataire?.contact ? (
                        <>
                          {' · '}
                          <a href={`tel:${cmd.destinataire.contact}`} className="text-primary hover:underline">
                            {cmd.destinataire.contact}
                          </a>
                        </>
                      ) : null}
                    </span>
                  </InfoRow>
                  <InfoRow icon={<Wallet className="w-4 h-4" />}>
                    <span>
                      {cmd.modePaiement ?? '—'}
                      {cmd.livraisonPaye && (
                        <Chip size="sm" variant="flat" color="success" className="ml-2">
                          Livraison payée
                        </Chip>
                      )}
                    </span>
                  </InfoRow>
                </div>

                <div className="flex items-center justify-end gap-6 mt-4 pt-3 border-t border-separator text-sm">
                  <span className="text-muted">
                    Frais : <b className="text-foreground">{fmtXof(cmd.fraisLivraison ?? 0)}</b>
                  </span>
                  <span className="text-muted">
                    Commande : <b className="text-foreground">{fmtXof(cmd.prix ?? 0)}</b>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Colonne latérale ── */}
        <div className="flex flex-col gap-4">
          {/* Partenaire */}
          <div className="bg-surface rounded-xl border border-separator shadow-xs p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Partenaire
            </h3>
            <div className="flex items-center gap-3">
              <Avatar
                src={logoUrl ? createUrlFile(logoUrl, 'restaurant') : undefined}
                name={course.restaurant?.nomEtablissement?.[0] ?? '?'}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{course.restaurant?.nomEtablissement ?? '—'}</p>
                <p className="text-xs text-muted truncate">{course.restaurant?.commune ?? course.restaurant?.localisation ?? ''}</p>
              </div>
            </div>
            {course.restaurant?.id && (
              <Button
                as={Link}
                href={`/restaurants/${course.restaurant.id}`}
                size="sm"
                variant="flat"
                className="mt-3 w-full"
                endContent={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Voir la fiche partenaire
              </Button>
            )}
          </div>

          {/* Livreur */}
          <div className="bg-surface rounded-xl border border-separator shadow-xs p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BikeIcon className="w-4 h-4 text-primary" />
              Livreur
            </h3>
            {course.livreur ? (
              <div className="flex items-center gap-3">
                <Avatar src={course.livreur.avatarUrl || undefined} name={course.livreur.nom?.[0] ?? '?'} size="md" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {course.livreur.nom} {course.livreur.prenoms}
                  </p>
                  <a href={`tel:${course.livreur.telephone}`} className="text-xs text-primary hover:underline">
                    {course.livreur.telephone}
                  </a>
                  {course.livreur.matricule && <p className="text-xs text-muted">Mat. {course.livreur.matricule}</p>}
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted border border-dashed border-separator rounded-lg p-4 text-center">
                Aucun livreur assigné pour l&apos;instant.
                {canUpdate && enAttente && (
                  <Button size="sm" color="primary" variant="flat" className="mt-3 w-full" onPress={() => setOpenAssign(true)}>
                    Assigner maintenant
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="bg-surface rounded-xl border border-separator shadow-xs p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Récapitulatif
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between text-muted">
                <span>Commandes</span>
                <span>{fmtXof(sousTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Frais de livraison</span>
                <span>{fmtXof(totalFrais)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-foreground border-t border-separator pt-2 mt-1">
                <span>Total</span>
                <span>{fmtXof(sousTotal + totalFrais)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modales ── */}
      <DeliveryAssign delivery={course} delivers={delivers} open={openAssign} setOpen={setOpenAssign} />

      <ConfirmModal
        isOpen={openCancel}
        onClose={() => setOpenCancel(false)}
        title={`Annuler la course ${course.code}`}
        isLoading={pending}
        size="sm"
        actions={[
          { label: 'Retour', color: 'default', variant: 'bordered', onPress: () => setOpenCancel(false) },
          { label: 'Annuler la course', color: 'danger', variant: 'solid', onPress: handleCancel },
        ]}
      >
        <p className="text-sm text-foreground">
          La course sera annulée et ne sera plus proposée aux livreurs. Possible uniquement tant qu&apos;elle est en attente.
        </p>
      </ConfirmModal>

      <ConfirmModal
        isOpen={openFinish}
        onClose={() => setOpenFinish(false)}
        title={`Terminer la course ${course.code}`}
        isLoading={pending}
        size="sm"
        actions={[
          { label: 'Retour', color: 'default', variant: 'bordered', onPress: () => setOpenFinish(false) },
          { label: 'Terminer', color: 'success', variant: 'solid', onPress: handleFinish },
        ]}
      >
        <p className="text-sm text-foreground">
          La course sera marquée comme terminée. À utiliser si le livreur n&apos;a pas pu clôturer depuis son application.
        </p>
      </ConfirmModal>
    </div>
  );
}
