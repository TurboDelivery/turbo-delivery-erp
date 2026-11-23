'use client';

import { Button, Drawer, Separator, Tooltip } from '@heroui-v3/react';
import { ChevronLeft, ChevronRight, Download, MessageCircle, Pencil, Phone, Send } from 'lucide-react';
import React from 'react';

import { useEnvoyerProgrammeMutation } from '@/features/turboys/queries/programme.query';
import { COMPLEMENT_VIDE, type IProgramme } from '@/features/turboys/types/programme.types';
import { carburantAffiche } from '@/features/turboys/utils/carburant.utils';
import { estSeptSurSept, libelleJourInactif, OBSERVATION_SEPT_SUR_SEPT } from '@/features/turboys/utils/jour.utils';
import { heuresSemaine } from '@/features/turboys/utils/jours-programme.utils';
import { lienWhatsApp, texteProgramme } from '@/features/turboys/utils/partage-whatsapp.utils';
import { exporterProgrammeIndividuelPdf } from '@/features/turboys/utils/programmes-export.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { libelleWhatsApp } from '@/features/turboys/utils/whatsapp-statut.utils';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

/**
 * L'APERÇU, EN PANNEAU LATÉRAL (§6.3).
 *
 * <h3>Pourquoi un panneau et non une fenêtre</h3>
 *
 * <p>L'aperçu sert à vérifier une ligne de la liste. En fenêtre modale, il masque
 * justement cette liste : on ouvre, on lit, on ferme, on cherche la ligne suivante, on
 * rouvre. Sur une semaine de trente-huit livreurs à relire avant publication, cela fait
 * trente-huit allers-retours. Un panneau de 420 px laisse la liste visible, et les
 * flèches ‹ › passent au livreur suivant <b>sans le fermer</b>.</p>
 *
 * <h3>Ce que le panneau montre, et que la fenêtre taisait</h3>
 *
 * <p>La fenêtre affichait sept lignes « jour → horaires » et c'est tout. Elle ne disait
 * ni le téléphone (donc aucun moyen d'appeler), ni les sites desservis, ni les sites de
 * chaque jour, ni les postes, ni le carburant — jour par jour ou en total — ni le total
 * d'heures. Or c'est exactement ce que le livreur reçoit : un aperçu qui n'en montre que
 * la moitié ne permet pas de vérifier ce qu'on envoie.</p>
 *
 * <p>Rien n'a été retiré : export PDF individuel, partage WhatsApp avec le message écrit,
 * « Envoyer au livreur », l'observation des sept jours travaillés et le détail d'un échec
 * d'envoi sont tous là.</p>
 */

const JOURS: { cle: string; libelle: string }[] = [
  { cle: 'LUNDI', libelle: 'Lundi' },
  { cle: 'MARDI', libelle: 'Mardi' },
  { cle: 'MERCREDI', libelle: 'Mercredi' },
  { cle: 'JEUDI', libelle: 'Jeudi' },
  { cle: 'VENDREDI', libelle: 'Vendredi' },
  { cle: 'SAMEDI', libelle: 'Samedi' },
  { cle: 'DIMANCHE', libelle: 'Dimanche' },
];

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

/** Un numéro ivoirien utilisable : dix chiffres. En dessous, ni appel ni WhatsApp. */
const numeroUtilisable = (tel?: string | null) => (tel ?? '').replace(/\D/g, '').length >= 10;

export interface ProgrammeApercuPanneauProps {
  programme: IProgramme | null;
  annee: number;
  semaine: number;
  onFermer: () => void;
  /** Passer au livreur précédent / suivant de la liste. Absent : la flèche est inactive. */
  onPrecedent?: () => void;
  onSuivant?: () => void;
  /** Position dans la liste, pour situer : « 7 sur 38 ». */
  position?: { index: number; total: number } | null;
  /** Ouvrir la fenêtre d'édition sur ce programme. */
  onEditer?: (p: IProgramme) => void;
  telephone?: string | null;
  /** Nom d'un site par identifiant : base, sites desservis et sites du jour s'écrivent en clair. */
  nomSite?: Map<string, string>;
}

/** Une journée : horaires, sites, postes, carburant. « Repos » écrit en clair. */
function Journee({
  nomSite,
  p,
  cle,
  libelle,
}: {
  cle: string;
  libelle: string;
  nomSite: Map<string, string>;
  p: IProgramme;
}) {
  const j = (p.jours ?? []).find((x) => (x.jour ?? '').toUpperCase() === cle);
  const repos = !j || !j.actif;
  const complement = p.complement ?? COMPLEMENT_VIDE;
  const sites = complement.sitesParJour?.[cle] ?? [];
  const postes = (j?.postes ?? []).map((po) => po.restaurantNom).filter((n): n is string => Boolean(n));
  const surplus = (complement.surplusParJour?.[cle] ?? []).filter((s) => !s.annule);
  const montantSurplus = surplus.reduce((n, s) => n + (s.montant ?? 0), 0);

  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('text-sm', repos ? 'text-muted' : 'font-medium text-foreground')}>{libelle}</span>
        {/*
         * Le repos s'écrivait en ROUGE, encadré. Ce n'est ni une erreur ni une alerte :
         * c'est le programme normal d'un livreur, et une semaine en compte deux.
         */}
        {repos ? (
          <span className="text-sm text-muted">{libelleJourInactif(j)}</span>
        ) : (
          <span className="text-sm font-medium tabular-nums text-foreground">
            {hhmm(j!.debut)} – {hhmm(j!.fin)}
          </span>
        )}
      </div>

      {!repos && (
        <div className="flex flex-col gap-0.5 ps-0.5 text-xs text-muted">
          {sites.length > 0 && <span>{sites.map((s) => nomSite.get(s) ?? s).join(' · ')}</span>}
          {postes.length > 0 && <span>{postes.join(' · ')}</span>}
          {(j?.montantCarburant ?? 0) > 0 || montantSurplus > 0 ? (
            <span className="tabular-nums">
              Carburant {formatMontant(j?.montantCarburant ?? 0)}
              {montantSurplus > 0 ? (
                <span className="text-warning-soft-foreground"> + {formatMontant(montantSurplus)} de surplus</span>
              ) : null}
            </span>
          ) : null}
        </div>
      )}
    </li>
  );
}

export function ProgrammeApercuPanneau({
  programme,
  annee,
  semaine,
  onFermer,
  onPrecedent,
  onSuivant,
  position = null,
  onEditer,
  telephone = null,
  nomSite,
}: ProgrammeApercuPanneauProps) {
  const envoyer = useEnvoyerProgrammeMutation();
  const sites = React.useMemo(() => nomSite ?? new Map<string, string>(), [nomSite]);

  const complement = programme?.complement ?? COMPLEMENT_VIDE;
  const superviseur = programme?.typeLivreur === 'SUPERVISEUR_LIVREUR';
  const lien = programme ? lienWhatsApp(telephone, texteProgramme(programme, annee, semaine)) : null;
  const whatsapp = programme ? libelleWhatsApp(programme) : null;
  const septSurSept = programme ? estSeptSurSept(programme.jours) : false;
  const heures = programme ? heuresSemaine(programme.jours ?? []) : 0;
  const carburant = programme ? carburantAffiche(programme) : null;
  const totalSurplus = Object.values(complement.surplusParJour ?? {})
    .flat()
    .filter((s) => !s.annule)
    .reduce((n, s) => n + (s.montant ?? 0), 0);

  return (
    <Drawer.Backdrop isOpen={!!programme} onOpenChange={(ouvert) => !ouvert && onFermer()} variant="transparent">
      {/* 420 px (§6.3), et la largeur pleine sous cette taille d'écran. */}
      <Drawer.Content placement="right">
        <Drawer.Dialog className="w-full border-l border-separator sm:w-[420px]">
          <Drawer.Header className="flex-col items-stretch gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <Drawer.Heading className="truncate text-base">{programme?.livreurNom ?? '—'}</Drawer.Heading>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  {programme?.typeLivreur ? getTurboyTypeDisplay(programme.typeLivreur).label : 'Livreur'}
                  <span aria-hidden="true">·</span>
                  Semaine {semaine} / {annee}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {/* Les flèches passent au livreur voisin SANS fermer le panneau : c'est ce
                    qui fait la différence entre relire une semaine et l'ouvrir trente-huit fois. */}
                <Button
                  aria-label="Livreur précédent"
                  isDisabled={!onPrecedent}
                  isIconOnly
                  onPress={onPrecedent}
                  size="sm"
                  variant="ghost"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  aria-label="Livreur suivant"
                  isDisabled={!onSuivant}
                  isIconOnly
                  onPress={onSuivant}
                  size="sm"
                  variant="ghost"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Button>
                <Drawer.CloseTrigger />
              </div>
            </div>

            {position ? (
              <span className="text-xs text-muted">
                {position.index + 1} sur {position.total}
              </span>
            ) : null}
          </Drawer.Header>

          <Drawer.Body className="gap-4">
            {programme && (
              <>
                {/* LE TÉLÉPHONE. Il n'était nulle part : on fermait l'aperçu pour aller
                    chercher le numéro sur la fiche du livreur. */}
                <div className="flex flex-wrap items-center gap-2">
                  {numeroUtilisable(telephone) ? (
                    <>
                      <span className="text-sm tabular-nums text-foreground">{telephone}</span>
                      <Button
                        onPress={() => window.open(`tel:${(telephone ?? '').replace(/\s/g, '')}`, '_self')}
                        size="sm"
                        variant="outline"
                      >
                        <Phone aria-hidden="true" className="size-4" />
                        Appeler
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted">Aucun numéro à dix chiffres</span>
                  )}
                </div>

                {/*
                 * L'état du dernier envoi, SUR SA PROPRE LIGNE et en texte.
                 *
                 * ⚠ C'était un Badge : mesuré à l'écran, « WhatsApp : envoyé le 24/08 à
                 * 10:12 » y arrivait en blanc sur gris pâle et tronqué par la largeur du
                 * panneau — illisible. Un badge sert à porter un mot, pas une phrase
                 * datée. Le texte, lui, passe à la ligne et garde son contraste.
                 */}
                {whatsapp ? (
                  <p
                    className={cn(
                      'text-xs leading-tight',
                      whatsapp.ton === 'attention' ? 'text-warning-soft-foreground' : 'text-muted',
                    )}
                  >
                    {whatsapp.texte}
                    {programme.whatsappStatut === 'ECHEC' && programme.whatsappDetail
                      ? ` : ${programme.whatsappDetail}`
                      : ''}
                  </p>
                ) : null}

                <Separator />

                {/* LES SITES DE LA SEMAINE (§3.2) : la base, puis ce qui s'y ajoute. */}
                <div className="flex flex-col gap-1">
                  {superviseur ? (
                    <>
                      <span className="text-xs text-muted">Bases gérées</span>
                      <span className="text-sm text-foreground">
                        {(complement.basesGerees ?? []).length === 0
                          ? 'Aucune base renseignée'
                          : (complement.basesGerees ?? []).map((s) => sites.get(s) ?? s).join(' · ')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted">Site de base</span>
                      <span className="text-sm text-foreground">
                        {programme.siteId ? (sites.get(programme.siteId) ?? programme.siteId) : 'Aucun site'}
                      </span>
                      {(complement.sitesDesservis ?? []).length > 0 && (
                        <>
                          <span className="mt-1 text-xs text-muted">Sites desservis en plus</span>
                          <span className="text-sm text-foreground">
                            {(complement.sitesDesservis ?? []).map((s) => sites.get(s) ?? s).join(' · ')}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                {/* LES SEPT JOURS, tels que le livreur les reçoit. */}
                <ul className="divide-y divide-separator">
                  {JOURS.map((jr) => (
                    <Journee cle={jr.cle} key={jr.cle} libelle={jr.libelle} nomSite={sites} p={programme} />
                  ))}
                </ul>

                {septSurSept ? (
                  <p className="text-xs text-foreground">Sept jours travaillés. {OBSERVATION_SEPT_SUR_SEPT}.</p>
                ) : null}
              </>
            )}
          </Drawer.Body>

          <Drawer.Footer className="flex-col items-stretch gap-3">
            {/* LE PIED : les deux totaux, puis les gestes. Un total d'heures et un total
                carburant ne se recomposent pas de tête à partir de sept lignes. */}
            {programme && (
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted">
                  Total heures <span className="font-semibold tabular-nums text-foreground">{heures} h</span>
                </span>
                <span className="text-muted">
                  Carburant{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMontant((carburant?.montant ?? 0) + totalSurplus)}
                  </span>
                  {/* « Prévisionnel » tant que la publication n'a pas figé le montant :
                      sans cette mention, un chiffre qui bougera demain se lit comme définitif. */}
                  {carburant && !carburant.fige ? <span className="text-xs"> (prévisionnel)</span> : null}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {onEditer && programme ? (
                <Button className="flex-1" onPress={() => onEditer(programme)} variant="outline">
                  <Pencil aria-hidden="true" className="size-4" />
                  Modifier
                </Button>
              ) : null}
              <Button
                className="flex-1"
                isDisabled={!programme}
                isPending={envoyer.isPending}
                onPress={() => programme && envoyer.mutate(programme.id)}
                variant="primary"
              >
                <Send aria-hidden="true" className="size-4" />
                {/* « Renvoyer » sur un programme jamais parti laissait croire qu'il l'était. */}
                {programme && (programme.statut === 'BROUILLON' || programme.statut === 'PLANIFIE') ? 'Envoyer' : 'Renvoyer'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <Button
                  className="flex-1"
                  isDisabled={!lien}
                  onPress={() => lien && window.open(lien, '_blank', 'noopener,noreferrer')}
                  size="sm"
                  variant="ghost"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  WhatsApp
                </Button>
                <Tooltip.Content>
                  {lien
                    ? 'Ouvre la conversation avec le message écrit ; rien ne part sans votre envoi'
                    : 'Aucun numéro à dix chiffres pour ce livreur'}
                </Tooltip.Content>
              </Tooltip>
              <Button
                className="flex-1"
                isDisabled={!programme}
                onPress={() =>
                  programme &&
                  exporterProgrammeIndividuelPdf(
                    programme,
                    annee,
                    semaine,
                    programme.siteId ? (sites.get(programme.siteId) ?? null) : null,
                  )
                }
                size="sm"
                variant="ghost"
              >
                <Download aria-hidden="true" className="size-4" />
                Exporter PDF
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
