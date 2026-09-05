'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, Chip, Spinner } from '@heroui-v3/react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ExternalLink, Undo2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/commons/tabs';
import { TypeLivreurBascule } from '@/features/personnel/apis/personnel-historisation.api';
import {
  useDossierAgentQuery,
  useHistoriqueFicheQuery,
  useRemunerationHistoriqueQuery,
} from '@/features/personnel/queries/personnel-historisation.query';
import {
  etatDeclarationDepuisContrat,
  formaterDate,
  formaterDateHeure,
  formaterMontant,
  initiales,
  libelleTypeCollaborateur,
} from '@/features/personnel/utils/personnel-historisation.utils';

import { DeclarationContratAction } from '../shared/declaration-contrat-action';
import { DeclarationChip, StatutEffectifChip, TypeContratChip } from '../shared/personnel-chips';
import { BasculeTypeBouton } from './bascule-type-bouton';
import { HistoriqueModifications } from './historique-modifications';
import { ParcoursTimeline } from './parcours-timeline';
import { RegularisationModal } from './regularisation-modal';
import { RemunerationHistorique } from './remuneration-historique';

/** Une ligne « libellé / valeur » du dossier d'enrôlement. */
function Kv({ libelle, valeur }: { libelle: string; valeur: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 text-sm">
      <span className="shrink-0 text-muted">{libelle}</span>
      <span className="text-right font-medium text-foreground">{valeur}</span>
    </div>
  );
}

/** Types de collaborateur pour lesquels la bascule journalier ⇄ indépendant a un sens. */
const TYPES_BASCULABLES = ['JOURNALIER', 'INDEPENDANT'];

/**
 * Fiche agent (F1, F2, F3, F5) : le dossier d'enrôlement, le parcours, les rémunérations
 * mois par mois et l'historique d'audit de la fiche — la vue où l'on vient chercher
 * « qu'est-ce qui s'est passé pour cet agent ».
 */
export function FicheAgentView({ employeId }: { employeId: string }) {
  const { data: session } = useSession();
  const lecteurId = session?.user?.id ? String(session.user.id) : null;
  const [regularisation, setRegularisation] = useState(false);

  const { data: dossier, isLoading, isError } = useDossierAgentQuery(employeId);
  const {
    data: remunerations,
    isLoading: chargementRemu,
    isFetching: rechargeRemu,
    isError: echecRemu,
    refetch: relancerRemu,
  } = useRemunerationHistoriqueQuery(employeId);
  const {
    data: auditActions,
    isLoading: chargementAudit,
    error: erreurAudit,
  } = useHistoriqueFicheQuery(employeId, lecteurId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
        <p className="text-sm text-muted">Chargement du dossier…</p>
      </div>
    );
  }

  if (isError || !dossier) {
    return (
      <div className="rounded-xl border border-separator bg-surface p-6 text-sm text-muted">
        Ce dossier est introuvable.{' '}
        <Link href="/personnel" className="font-semibold text-primary hover:underline">
          Retour à l&apos;effectif
        </Link>
        .
      </div>
    );
  }

  const fiche = dossier.fiche;
  const contrat = dossier.contratActif;
  const type = contrat?.typeContrat ?? fiche.typeCollaborateur;
  const declaration = etatDeclarationDepuisContrat(contrat?.declare ?? null, type);
  const typeNormalise = (fiche.typeCollaborateur ?? '').trim().toUpperCase();
  // Volontairement indépendant de `sorti` : basculer en INDEPENDANT sort l'agent de
  // l'effectif salarié (il n'est plus payé), et c'est justement l'état depuis lequel on doit
  // pouvoir revenir en JOURNALIER. Le serveur réintègre alors la fiche de lui-même
  // (`reintegrerSiSorti`) — masquer le bouton ici rendrait le retour impossible.
  const basculable = !!fiche.livreurId && TYPES_BASCULABLES.includes(typeNormalise);

  return (
    <div className="space-y-4">
      <Link
        href="/personnel"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;effectif
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-separator bg-surface p-4">
        <div className="flex items-center gap-3">
          {/* C'etait un rond dessine a la main : la bibliotheque a un avatar. */}
          <Avatar size="lg">
            <Avatar.Fallback>{initiales(fiche.name)}</Avatar.Fallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {fiche.name ?? '—'}
              {fiche.matricule ? (
                <span className="ml-2 font-mono text-xs font-normal text-muted">{fiche.matricule}</span>
              ) : null}
            </h1>
            <p className="text-xs text-muted">
              {[fiche.position, fiche.agence ?? fiche.department].filter(Boolean).join(' · ') ||
                'Poste non renseigné'}
              {fiche.enregistreLe ? ` · enrôlé le ${formaterDate(fiche.enregistreLe)}` : ''}
              {fiche.enregistreParNom ? ` par ${fiche.enregistreParNom}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TypeContratChip type={type} />
          <StatutEffectifChip actif={!fiche.sorti} sortieLe={fiche.sortieLe} />
          <DeclarationChip etat={declaration} />
          {basculable ? (
            <BasculeTypeBouton
              employeId={employeId}
              livreurId={fiche.livreurId as string}
              typeActuel={typeNormalise as TypeLivreurBascule}
            />
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="dossier">
        <TabsList className="grid max-w-lg grid-cols-2 rounded-full">
          <TabsTrigger value="dossier">Dossier &amp; parcours</TabsTrigger>
          <TabsTrigger value="audit">Historique des modifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dossier" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
            {/* Colonne gauche */}
            <div className="space-y-4">
              <section className="rounded-xl border border-separator bg-surface p-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Dossier d&apos;enrôlement
                </h2>
                <Kv
                  libelle="Pièce d'identité"
                  valeur={
                    fiche.pieceNumero || fiche.pieceUrl ? (
                      <span>
                        {[fiche.pieceType, fiche.pieceNumero].filter(Boolean).join(' · ') || 'Jointe'}
                        {fiche.pieceUrl ? (
                          <a
                            href={fiche.pieceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 inline-flex text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                        {fiche.pieceExpireLe ? (
                          <span className="block text-xs font-normal text-muted">
                            expire le {formaterDate(fiche.pieceExpireLe)}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-danger-soft-foreground">Manquante</span>
                    )
                  }
                />
                <Kv
                  libelle="Contrat"
                  valeur={
                    contrat ? (
                      <span>
                        {libelleTypeCollaborateur(contrat.typeContrat)}
                        <span className="block text-xs font-normal text-muted">
                          {formaterDate(contrat.dateDebut)}
                          {contrat.dateFin ? ` → ${formaterDate(contrat.dateFin)}` : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted">{libelleTypeCollaborateur(fiche.typeCollaborateur)}</span>
                    )
                  }
                />
                <Kv
                  libelle="Déclaration"
                  valeur={
                    declaration === 'NON_APPLICABLE' ? (
                      <span className="text-muted">Non applicable</span>
                    ) : (
                      <span>
                        <DeclarationChip etat={declaration} />
                        {contrat?.referenceDeclaration ? (
                          <span className="block text-xs font-normal text-muted">
                            réf. {contrat.referenceDeclaration}
                            {contrat.dateDeclaration ? ` · ${formaterDate(contrat.dateDeclaration)}` : ''}
                          </span>
                        ) : null}
                        {contrat ? (
                          <span className="mt-1 flex justify-end">
                            <DeclarationContratAction
                              contratId={contrat.id}
                              employeId={employeId}
                              etat={declaration}
                              dateDeclaration={contrat.dateDeclaration}
                              referenceDeclaration={contrat.referenceDeclaration}
                              declarationUrl={contrat.declarationUrl}
                            />
                          </span>
                        ) : null}
                      </span>
                    )
                  }
                />
                <Kv
                  libelle="Contact d'urgence"
                  valeur={
                    fiche.urgenceNom || fiche.urgenceTelephone ? (
                      <span>
                        {fiche.urgenceNom ?? '—'}
                        <span className="block text-xs font-normal text-muted">
                          {[fiche.urgenceTelephone, fiche.urgenceLien].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted">Non renseigné</span>
                    )
                  }
                />
                <Kv
                  libelle="Rémunération de référence"
                  valeur={fiche.salary ? formaterMontant(fiche.salary) : <span className="text-muted">—</span>}
                />
                {fiche.sorti ? (
                  <Kv
                    libelle="Sortie d'effectif"
                    valeur={
                      <span>
                        {formaterDate(fiche.sortieLe)}
                        {fiche.sortieMotif ? (
                          <span className="block text-xs font-normal text-muted">{fiche.sortieMotif}</span>
                        ) : null}
                      </span>
                    }
                  />
                ) : null}

                <div className="mt-3 border-t border-separator pt-2">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    Pièces jointes
                  </h3>
                  {dossier.pieces.length === 0 ? (
                    <p className="text-xs text-muted">Aucune pièce jointe au dossier.</p>
                  ) : (
                    <ul className="space-y-1">
                      {dossier.pieces.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-foreground">
                            {p.libelle ?? p.categorie ?? 'Pièce'}
                            {p.ajouteParNom ? (
                              <span className="text-muted"> · {p.ajouteParNom}</span>
                            ) : null}
                          </span>
                          {p.url ? (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-primary"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-separator bg-surface p-4">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Parcours de l&apos;agent
                </h2>
                <ParcoursTimeline evenements={dossier.parcours} />
              </section>
            </div>

            {/* Colonne droite */}
            <section className="rounded-xl border border-separator bg-surface p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Historique mensuel de rémunération
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip size="sm" variant="soft">
                    <Chip.Label>Net moyen {formaterMontant(remunerations?.netMoyen)}</Chip.Label>
                  </Chip>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>Total perçu {formaterMontant(remunerations?.totalPercu)}</Chip.Label>
                  </Chip>
                  <Button onPress={() => setRegularisation(true)} size="sm" variant="outline">
                    <Undo2 aria-hidden="true" className="size-4" />
                    Régulariser un mois clôturé
                  </Button>
                </div>
              </div>
              <RemunerationHistorique
                historique={remunerations}
                chargement={chargementRemu}
                echec={echecRemu}
                onReessayer={() => relancerRemu()}
                relanceEnCours={rechargeRemu}
              />
              <RegularisationModal
                employeId={employeId}
                ouvert={regularisation}
                onFermer={() => setRegularisation(false)}
              />
            </section>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="space-y-2 rounded-xl border border-separator bg-surface p-4">
            <p className="text-xs text-muted">
              Toute écriture sur cette fiche est journalisée automatiquement, avec l&apos;auteur et la valeur avant /
              après. Le journal est immuable : il ne peut être ni modifié ni supprimé.
              {fiche.updatedAt ? ` Dernière mise à jour ${formaterDateHeure(fiche.updatedAt)}.` : ''}
            </p>
            <HistoriqueModifications
              actions={auditActions}
              chargement={chargementAudit}
              erreur={erreurAudit}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
