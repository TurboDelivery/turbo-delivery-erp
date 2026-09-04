'use client';

/*
 * Ecran de visa DGA, rendu avec HeroUI V3.
 *
 * <p>Le squelette d'attente venait de `@/components/ui/skeleton` ; la carte du
 * recapitulatif, le bloc vide et leur trait de separation etaient des `div` habillees a
 * la main (`rounded-xl border border-separator bg-surface`). Une bordure et un fond
 * ecrits a la main a cote d'un composant qui les porte deja finissent par diverger des
 * que le theme bouge, et personne ne le voit avant d'ouvrir l'ecran. `Card`, `Separator`
 * et `Skeleton` apportent leur propre surface, leur rayon et leur ombre.</p>
 */
import { Card, EmptyState, Separator, Skeleton } from '@heroui-v3/react';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import useVisaDga from '../hooks/use-visa-dga';
import StatMini from './StatMini';
import LivreurRow from './LivreurRow';
import VisaDgaStatutBadge from './VisaDgaStatutBadge';
import VisaDgaActionBar from './VisaDgaActionBar';
import VisaDgaStatusAlert from './VisaDgaStatusAlert';
import VisaDgaChaineValidation from './VisaDgaChaineValidation';
import VisaDgaRejetModal from './VisaDgaRejetModal';
import VisaDgaViserModal from './VisaDgaViserModal';
import EtatErreur from '@/components/commons/EtatErreur';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export default function VisaDgaContent() {
  const {
    creneau,
    isLoading,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId,
    isVisant,
    isRejetant,
    vise,
    rejetOpen,
    viserOpen,
    motif,
    setMotif,
    openRejet,
    closeRejet,
    openViser,
    closeViser,
    handleViser,
    handleRejeter,
    handleVoirGrille,
    isError,
    isFetching,
    refetch,
  } = useVisaDga();

  // Etape de visa de la chaine de paie : sans ce garde, un echec de lecture
  // rendait un creneau ABSENT, indistinguable d'un lot vide, sur un ecran ou l'on
  // vise des montants reels.
  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <EtatErreur quoi="le lot à viser" onReessayer={() => refetch()} enCours={isFetching} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Skeleton className="h-8 w-72" />
        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Meme rayon que les cartes qui prennent leur place, sinon la mise en page
              saute au moment ou la donnee arrive. */}
          <Skeleton className="h-96 flex-1 rounded-3xl" />
          <Skeleton className="h-48 lg:h-96 lg:w-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!creneau) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-primary">Visa DGA</h1>
          {/*
           * Le selecteur manquait ici. Le lien du courriel « Lot soumis » ouvre un
           * creneau precis ; si ce creneau n'a pas de lot, le DGA arrivait sur un ecran
           * sans aucune commande, et ne pouvait plus changer de semaine sans retaper
           * l'adresse a la main.
           */}
          <CreneauSelectPicker
            creneaux={creneaux}
            selectedCreneauId={selectedCreneauId}
            onSelectCreneau={setSelectedCreneauId}
            disabled={isLoadingCreneaux}
          />
        </div>
        <Card className="items-center justify-center py-24">
          <EmptyState>Aucun dossier en attente de visa DGA.</EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-primary">
            Visa DGA — {creneau.code}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {formatDate(creneau.debut)} → {formatDate(creneau.fin)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CreneauSelectPicker
            creneaux={creneaux}
            selectedCreneauId={selectedCreneauId}
            onSelectCreneau={setSelectedCreneauId}
            disabled={isLoadingCreneaux}
          />
          <VisaDgaStatutBadge statut={vise ? 'VISE' : creneau.statut} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Left — Récapitulatif + liste livreurs */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <Card>
            <Card.Header>
              <Card.Title>Récapitulatif consolidé</Card.Title>
            </Card.Header>

            <Card.Content>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatMini label="Livreurs"   value={creneau.stats.totalLivreurs}      />
                <StatMini label="Tickets"    value={creneau.stats.totalTickets}     />
                <StatMini label="Total Brut" value={creneau.stats.totalBrut.toLocaleString('fr-FR')} sub="FCFA"     />
                <StatMini label="Total à payer (Indép.)" value={(creneau.stats.totalAPayer ?? creneau.stats.totalNet).toLocaleString('fr-FR')} sub="FCFA" highlight />
              </div>

              <Separator className="my-4" />

              <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                Top livreurs
              </p>
              {creneau.livreurs.map((l) => (
                <LivreurRow key={l.id} {...l} />
              ))}
            </Card.Content>
          </Card>

          {!vise && creneau.statut === 'SOUMIS_DGA' && (
            <VisaDgaActionBar
              isVisant={isVisant}
              isRejetant={isRejetant}
              onVoirGrille={handleVoirGrille}
              onRejeter={openRejet}
              onViser={openViser}
            />
          )}

          <VisaDgaStatusAlert statut={creneau.statut} vise={vise} />
        </div>

        {/* Right — Chaîne de validation */}
        <VisaDgaChaineValidation etapes={creneau.chaineValidation} />
      </div>

      <VisaDgaViserModal
        open={viserOpen}
        onClose={closeViser}
        onConfirm={handleViser}
        isLoading={isVisant}
        codeCreneau={creneau.code}
        totaux={{
          livreurs: creneau.stats.nbIndependants ?? creneau.stats.totalLivreurs,
          tickets: creneau.stats.totalTickets,
          net: creneau.stats.totalAPayer ?? creneau.stats.totalNet,
        }}
      />

      <VisaDgaRejetModal
        open={rejetOpen}
        onClose={closeRejet}
        onConfirm={handleRejeter}
        isLoading={isRejetant}
        motif={motif}
        onMotifChange={setMotif}
        totaux={{
          livreurs: creneau.stats.nbIndependants ?? creneau.stats.totalLivreurs,
          tickets: creneau.stats.totalTickets,
          net: creneau.stats.totalAPayer ?? creneau.stats.totalNet,
        }}
      />
    </div>
  );
}
