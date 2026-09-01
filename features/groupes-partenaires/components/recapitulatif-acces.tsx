'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
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
 * HeroUI s'appuie sur une collection React Aria, qui veut des `TableRow` comme enfants
 * directs de `TableBody`. Un composant intermédiaire casse la collection.
 */

function ListeEtablissements({ liste }: { liste: IEtablissementPerimetre[] }) {
  if (liste.length === 0) {
    return <span className="text-default-400">Aucun établissement</span>;
  }
  return (
    <ul className="space-y-0.5">
      {liste.map((etablissement) => (
        <li key={etablissement.restaurantId} className="truncate text-[13px]">
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
      <p className="text-sm text-default-600">{intention}</p>

      {/* Le verdict, en une ligne, avant le détail. */}
      <div
        className={`flex flex-wrap items-center gap-x-6 gap-y-1 rounded-medium border px-3 py-2 text-sm ${
          rienDePerdu ? 'border-success/30 bg-success/5' : 'border-danger/40 bg-danger/5'
        }`}
      >
        {rienDePerdu ? (
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
        ) : (
          <ShieldAlert className="h-4 w-4 shrink-0 text-danger" />
        )}
        <span>
          <strong className="tabular-nums">{nbComptes}</strong> compte{nbComptes > 1 ? 's' : ''} concerné
          {nbComptes > 1 ? 's' : ''}
        </span>
        <span>
          <strong className="tabular-nums text-success-600">{nbAccesGagnes}</strong> accès ajouté
          {nbAccesGagnes > 1 ? 's' : ''}
        </span>
        <span>
          <strong className={`tabular-nums ${rienDePerdu ? 'text-success-600' : 'text-danger'}`}>
            {nbAccesPerdus}
          </strong>{' '}
          accès retiré{nbAccesPerdus > 1 ? 's' : ''}
        </span>
        <span className="text-default-500">
          {rienDePerdu
            ? 'Personne ne perd un accès qu’il possède aujourd’hui.'
            : 'Des accès disparaissent — lisez le détail avant de valider.'}
        </span>
      </div>

      {blocages.length > 0 && (
        <div className="space-y-1 rounded-medium border border-danger/40 bg-danger/5 px-3 py-2">
          <p className="text-sm font-medium text-danger">
            {blocages.length} établissement{blocages.length > 1 ? 's' : ''} empêche
            {blocages.length > 1 ? 'nt' : ''} la validation
          </p>
          <ul className="space-y-0.5 text-[13px] text-default-600">
            {blocages.map((blocage) => (
              <li key={blocage.restaurantId}>
                <strong>{blocage.nom ?? 'Établissement'}</strong> — {blocage.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Table aria-label="Effet de l'opération sur chaque compte" isStriped removeWrapper>
        <TableHeader>
          <TableColumn className="text-primary">COMPTE</TableColumn>
          <TableColumn className="text-primary">AUJOURD&apos;HUI</TableColumn>
          <TableColumn className="text-primary">
            <span className="sr-only">Devient</span>
          </TableColumn>
          <TableColumn className="text-primary">APRÈS VALIDATION</TableColumn>
          <TableColumn className="text-primary">EFFET</TableColumn>
        </TableHeader>
        <TableBody emptyContent="Aucun compte n’est rattaché aux établissements sélectionnés.">
          {lignes.map((ligne) => {
            const gains = new Set(ligne.gains.map((e) => e.restaurantId));
            return (
              <TableRow key={ligne.userId}>
                <TableCell className="align-top">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{nomCompte(ligne)}</p>
                    <p className="truncate text-[11px] text-default-400">{ligne.email ?? '—'}</p>
                  </div>
                </TableCell>

                {/* Avant */}
                <TableCell className="align-top">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <RoleChip role={ligne.roleAvant} />
                      <PorteeChip portee={ligne.porteeAvant} />
                    </div>
                    <ListeEtablissements liste={ligne.perimetreAvant} />
                  </div>
                </TableCell>

                <TableCell className="w-8 align-top text-default-300">
                  <ArrowRight className="mt-1 h-4 w-4" />
                </TableCell>

                {/* Après — ce qui change est surligné, ce qui ne change pas reste sobre. */}
                <TableCell className="align-top">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <RoleChip role={ligne.roleApres} />
                      <PorteeChip portee={ligne.porteeApres} />
                    </div>
                    {ligne.perimetreApres.length === 0 && ligne.pertes.length === 0 ? (
                      <span className="text-default-400">Aucun établissement</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {ligne.perimetreApres.map((etablissement) => (
                          <li
                            key={etablissement.restaurantId}
                            className={`truncate text-[13px] ${
                              gains.has(etablissement.restaurantId) ? 'font-medium text-success-600' : ''
                            }`}
                          >
                            {etablissement.nom ?? 'Établissement sans nom'}
                            {gains.has(etablissement.restaurantId) && (
                              <span className="ml-1 text-[11px] font-normal text-success-600">nouveau</span>
                            )}
                          </li>
                        ))}
                        {ligne.pertes.map((etablissement) => (
                          <li
                            key={`perte-${etablissement.restaurantId}`}
                            className="truncate text-[13px] text-danger line-through"
                          >
                            {etablissement.nom ?? 'Établissement sans nom'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  <div className="space-y-1">
                    <EffetChip effet={ligne.effet} />
                    <p className="max-w-88 text-[12px] leading-snug text-default-500">{ligne.explication}</p>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {note && <p className="text-[12px] leading-snug text-default-500">{note}</p>}
    </div>
  );
}
