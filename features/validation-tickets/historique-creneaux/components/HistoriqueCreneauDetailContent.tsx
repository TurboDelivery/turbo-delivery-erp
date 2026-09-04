'use client';

/*
 * Detail d'un creneau de paie, rendu avec HeroUI V3.
 *
 * <p>L'en-tete et les quatre cartes d'indicateurs etaient des `div` habillees a la main
 * (`rounded-xl border border-separator bg-surface`). Une surface et un rayon reecrits a
 * cote d'un composant qui les porte deja finissent par diverger du reste de l'ecran des
 * que le theme bouge. `Card` apporte sa surface, son rayon et son ombre.</p>
 *
 * <p>Le squelette d'attente venait de `@/components/ui/skeleton`, dont le fond prend la
 * couleur de marque : les blocs d'attente etaient donc des rectangles rouges, et le
 * chargement se lisait comme un incident sur un ecran ou l'operateur cherche justement
 * un rejet. Le `Skeleton` V3 se peint sur la surface tertiaire, neutre dans les deux
 * themes.</p>
 *
 * <p>Trois teintes ecrites en dur n'avaient pas de couple sombre et gardaient leur aplat
 * pale sur fond sombre : l'ambre du motif de regularisation, dont le texte fonce
 * devenait illisible, et les pastilles `bg-red-50` des icones. Le motif passe sur
 * l'echelle `warning`, qui porte ses deux themes. Les trois pastilles rouges ne
 * distinguaient rien — c'etait la meme teinte quatre fois — et redeviennent neutres ;
 * seul le total net garde sa couleur, sur l'echelle `success`, parce qu'il dit ce qui
 * sera reellement verse aux livreurs.</p>
 */
import { AlertTriangle, CreditCard, Receipt, TrendingUp, Users } from 'lucide-react';
import { Card, Chip, Skeleton } from '@heroui-v3/react';
import GrillePaiementExportButton from '@/features/validation-tickets/grille-de-paiement/components/GrillePaiementExportButton';
import { cn } from '@/lib/utils';
import { formatMontantCompact } from '@/utils/format.utils';
import useHistoriqueCreneauDetail from '../hooks/use-historique-creneau-detail';
import HistoriqueCreneauDetailLivreurs from './HistoriqueCreneauDetailLivreurs';
import HistoriqueCreneauDetailTimeline from './HistoriqueCreneauDetailTimeline';
import { getLotStatutConfig } from '../utils/lot-statut.utils';
import EtatErreur from '@/components/commons/EtatErreur';

interface Props {
  id: string;
}

export default function HistoriqueCreneauDetailContent({ id }: Props) {
  const { detail, isLoading, isError, isFetching, refetch } = useHistoriqueCreneauDetail(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  // L'echec passait par la meme porte que l'absence de donnee (`return null`), donc
  // l'operateur voyait un ecran vide et concluait que le creneau n'existait pas.
  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <EtatErreur quoi="le détail du créneau" onReessayer={() => refetch()} enCours={isFetching} />
      </div>
    );
  }

  if (!detail) return null;

  const statut = getLotStatutConfig(detail.statut);

  /*
   * `unit` et `ton` sont portes par les quatre entrees, meme vides : une cle presente sur
   * une seule d'entre elles fait inferer a TypeScript une union ou la destructuration du
   * champ manquant ne compile plus.
   */
  const indicateurs = [
    { label: 'Livreurs',   value: detail.kpi.livreurs,  icon: Users,      compact: false, unit: '',     verse: false },
    { label: 'Tickets',    value: detail.kpi.tickets,   icon: Receipt,    compact: false, unit: '',     verse: false },
    { label: 'Total Brut', value: detail.kpi.totalBrut, icon: TrendingUp, compact: true,  unit: 'FCFA', verse: false },
    { label: 'Total Net',  value: detail.kpi.totalNet,  icon: CreditCard, compact: true,  unit: 'FCFA', verse: true  },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* En-tete : code du creneau, statut du lot, provenance, export */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">{detail.code}</h1>
              {/*
               * La teinte vient de `lot-statut.utils` faute d'equivalent : la chaine de
               * validation d'un lot compte HUIT etats et `Chip` n'offre que quatre
               * variantes. Le libelle reste toujours ecrit, pour que l'etat ne tienne pas
               * qu'a la couleur.
               */}
              <Chip className={cn('whitespace-nowrap', statut.className)} size="sm" variant="soft">
                {statut.label}
              </Chip>
            </div>
            {detail.soumisLe && (
              /*
               * Le rouge etait pose sur le libelle « Soumis le », pas sur la date, et sans
               * variante sombre : la seule couleur de la ligne mettait en avant le mot, pas
               * l'information. C'est la date et l'auteur qu'on lit ici.
               */
              <p className="text-xs text-muted">
                Soumis le <span className="font-medium text-foreground">{detail.soumisLe}</span>
                {detail.soumisParNom && (
                  <>
                    {' '}
                    · Par <span className="font-medium text-foreground">{detail.soumisParNom}</span>
                  </>
                )}
              </p>
            )}
            {detail.derniereAction && (
              <p className="text-xs text-muted">
                Dernière action : <span className="text-muted">{detail.derniereAction}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start">
            <GrillePaiementExportButton creneauId={id} grilleCode={detail.code} totalItems={detail.kpi.livreurs} />
          </div>
        </div>
      </Card>

      {/* Motif de régularisation */}
      {detail.motifRegularisation && (
        <div className="flex flex-col gap-1 rounded-xl border border-warning/30 bg-warning-soft px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-soft-foreground">
            <AlertTriangle aria-hidden="true" className="h-4 w-4" />
            Motif de régularisation
          </p>
          <p className="text-sm text-warning-soft-foreground">{detail.motifRegularisation}</p>
        </div>
      )}

      {/* Indicateurs du créneau */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indicateurs.map(({ label, value, icon: Icon, compact, unit, verse }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</span>
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  verse ? 'bg-success-soft' : 'bg-surface-secondary',
                )}
              >
                <Icon aria-hidden="true" className={cn('h-4 w-4', verse ? 'text-success-soft-foreground' : 'text-muted')} />
              </div>
            </div>
            {/* Chasse tabulaire : sans elle, deux montants empiles ne s'alignent pas et ne se comparent plus. */}
            <p
              className={cn(
                'text-2xl font-bold leading-tight tabular-nums',
                verse ? 'text-success-soft-foreground' : 'text-foreground',
              )}
            >
              {compact ? formatMontantCompact(value) : value}
              {unit && <span className="ml-1 text-sm font-medium text-muted">{unit}</span>}
            </p>
          </Card>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <HistoriqueCreneauDetailLivreurs
          livreurs={detail.livreurs}
          totalLivreurs={detail.kpi.livreurs}
          totalTickets={detail.kpi.tickets}
        />
        <HistoriqueCreneauDetailTimeline events={detail.timeline} />
      </div>
    </div>
  );
}
