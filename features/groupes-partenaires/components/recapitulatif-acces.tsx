'use client';

import { Table } from '@heroui-v3/react';
import { ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';

import { IEtablissementPerimetre, IRecapitulatif } from '../types/groupes-partenaires.types';
import { nomCompte } from '../utils/simulation-groupe.utils';
import { EffetChip, PorteeChip, RoleChip } from './acces-chips';

/**
 * Le récapitulatif avant validation.
 *
 * <b>C'est l'écran, pas un ornement.</b> L'owner a demandé le groupement en promettant
 * « comme ça on ne perd rien ». Une promesse pareille ne se tient pas en silence
 * derrière un « Confirmer ? » : elle se montre, compte par compte, avant le clic. Ce
 * composant est donc la seule porte de validation des trois opérations du module —
 * constitution, changement de compte principal, détachement — et il affiche TOUJOURS
 * la totalité des comptes concernés, y compris ceux qui ne bougent pas. Ce sont
 * justement les lignes « Inchangé » qui démontrent la promesse ; les masquer pour
 * « alléger » viderait le tableau de sa raison d'être.
 *
 * Les compteurs de l'en-tête sont DÉRIVÉS des lignes, jamais écrits en dur : si le
 * calcul se met un jour à retirer un accès, le bandeau vire au rouge de lui-même.
 *
 * Les lignes sont construites en ligne (et non dans un sous-composant) : la table
 * s'appuie sur une collection React Aria, qui veut des `Table.Row` comme enfants
 * directs de `Table.Body`. Un composant intermédiaire casse la collection.
 */

function ListeEtablissements({ liste }: { liste: IEtablissementPerimetre[] }) {
  if (liste.length === 0) {
    return <span className="text-muted">Aucun établissement</span>;
  }
  return (
    <ul className="space-y-0.5">
      {liste.map((etablissement) => (
        <li key={etablissement.restaurantId} className="truncate text-xs">
          {etablissement.nom ?? 'Établissement sans nom'}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  recapitulatif: IRecapitulatif;
  /** Phrase d'intention, propre à l'opération (« Si vous constituez ce groupe… »). */
  intention: string;
  /** Nuance à afficher sous le tableau : point de contrat, effet différé, etc. */
  note?: string;
}

export function RecapitulatifAcces({ recapitulatif, intention, note }: Props) {
  const { lignes, blocages, nbComptes, nbAccesGagnes, nbAccesPerdus } = recapitulatif;
  const rienDePerdu = nbAccesPerdus === 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">{intention}</p>

      {/* Le verdict, en une ligne, avant le détail. */}
      <div className={`flex flex-wrap items-center gap-x-6 gap-y-1 rounded-medium border px-3 py-2 text-sm ${rienDePerdu ? 'border-success/30 bg-success/5' : 'border-danger/40 bg-danger/5'}`}>
        {rienDePerdu ? <ShieldCheck className="h-4 w-4 shrink-0 text-success-soft-foreground" /> : <ShieldAlert className="h-4 w-4 shrink-0 text-danger-soft-foreground" />}
        <span>
          <strong className="tabular-nums">{nbComptes}</strong> compte{nbComptes > 1 ? 's' : ''} concerné
          {nbComptes > 1 ? 's' : ''}
        </span>
        <span>
          <strong className="tabular-nums text-success-soft-foreground">{nbAccesGagnes}</strong> accès ajouté
          {nbAccesGagnes > 1 ? 's' : ''}
        </span>
        <span>
          <strong className={`tabular-nums ${rienDePerdu ? 'text-success-soft-foreground' : 'text-danger-soft-foreground'}`}>{nbAccesPerdus}</strong> accès retiré{nbAccesPerdus > 1 ? 's' : ''}
        </span>
        <span className="text-muted">{rienDePerdu ? 'Personne ne perd un accès qu’il possède aujourd’hui.' : 'Des accès disparaissent — lisez le détail avant de valider.'}</span>
      </div>

      {blocages.length > 0 && (
        <div className="space-y-1 rounded-medium border border-danger/40 bg-danger/5 px-3 py-2">
          <p className="text-sm font-medium text-danger-soft-foreground">
            {blocages.length} établissement{blocages.length > 1 ? 's' : ''} empêche
            {blocages.length > 1 ? 'nt' : ''} la validation
          </p>
          <ul className="space-y-0.5 text-xs text-foreground">
            {blocages.map((blocage) => (
              <li key={blocage.restaurantId}>
                <strong>{blocage.nom ?? 'Établissement'}</strong> — {blocage.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Effet de l'opération sur chaque compte" className="min-w-[56rem]">
            <Table.Header>
              <Table.Column id="compte" isRowHeader>
                Compte
              </Table.Column>
              <Table.Column id="avant">Aujourd&apos;hui</Table.Column>
              <Table.Column id="fleche">
                <span className="sr-only">Devient</span>
              </Table.Column>
              <Table.Column id="apres">Après validation</Table.Column>
              <Table.Column id="effet">Effet</Table.Column>
            </Table.Header>
            <Table.Body renderEmptyState={() => <p className="py-8 text-center text-sm text-muted">Aucun compte n’est rattaché aux établissements sélectionnés.</p>}>
              {lignes.map((ligne) => {
                const gains = new Set(ligne.gains.map((e) => e.restaurantId));
                return (
                  <Table.Row id={ligne.userId} key={ligne.userId}>
                    <Table.Cell className="align-top">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{nomCompte(ligne)}</p>
                        <p className="truncate text-xs text-muted">{ligne.email ?? '—'}</p>
                      </div>
                    </Table.Cell>

                    {/* Avant */}
                    <Table.Cell className="align-top">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <RoleChip role={ligne.roleAvant} />
                          <PorteeChip portee={ligne.porteeAvant} />
                        </div>
                        <ListeEtablissements liste={ligne.perimetreAvant} />
                      </div>
                    </Table.Cell>

                    <Table.Cell className="w-8 align-top text-muted">
                      <ArrowRight className="mt-1 h-4 w-4" />
                    </Table.Cell>

                    {/* Après — ce qui change est surligné, ce qui ne change pas reste sobre. */}
                    <Table.Cell className="align-top">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <RoleChip role={ligne.roleApres} />
                          <PorteeChip portee={ligne.porteeApres} />
                        </div>
                        {ligne.perimetreApres.length === 0 && ligne.pertes.length === 0 ? (
                          <span className="text-muted">Aucun établissement</span>
                        ) : (
                          <ul className="space-y-0.5">
                            {ligne.perimetreApres.map((etablissement) => (
                              <li key={etablissement.restaurantId} className={`truncate text-xs ${gains.has(etablissement.restaurantId) ? 'font-medium text-success-soft-foreground' : ''}`}>
                                {etablissement.nom ?? 'Établissement sans nom'}
                                {gains.has(etablissement.restaurantId) && <span className="ml-1 text-xs font-normal text-success-soft-foreground">nouveau</span>}
                              </li>
                            ))}
                            {ligne.pertes.map((etablissement) => (
                              <li key={`perte-${etablissement.restaurantId}`} className="truncate text-xs text-danger-soft-foreground line-through">
                                {etablissement.nom ?? 'Établissement sans nom'}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Table.Cell>

                    <Table.Cell className="align-top">
                      <div className="space-y-1">
                        <EffetChip effet={ligne.effet} />
                        <p className="max-w-88 text-xs leading-snug text-muted">{ligne.explication}</p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {note && <p className="text-xs leading-snug text-muted">{note}</p>}
    </div>
  );
}
