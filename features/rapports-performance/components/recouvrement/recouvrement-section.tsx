'use client';

import { Card, Table } from '@heroui-v3/react';

import type {
  IRecouvrementFacture,
  IRecouvrementPeriode,
} from '@/features/rapports-performance/types/performance.type';

import {
  ANCRE_RECOUVREMENT,
  COLONNES_MOUVEMENT,
  NOTE_MOUVEMENTS,
  avecColonneEtablissement,
  NOTE_ECART_FACTURE,
  NOTE_RECOUVREMENT,
  colonnesRecouvrement,
  libelleTotalFactures,
  formatMontantRecouvrement,
  texteCellule,
  texteMouvement,
} from './recouvrement-table-columns';

interface RecouvrementSectionProps {
  /**
   * NUL en vue globale, où aucun partenaire n'est choisi.
   *
   * <p>C'est la section elle-même qui rend alors sa raison, et non l'appelant : le bloc et
   * l'explication de son absence sont la même information, et les séparer ferait qu'un jour
   * l'un changerait sans l'autre.</p>
   */
  bloc: IRecouvrementPeriode | null;
  /** Vrai pendant la PREMIÈRE lecture : des lignes de squelette, jamais « aucune facture ». */
  enChargement?: boolean;
}

/**
 * LE RECOUVREMENT DES FACTURES DE LA PÉRIODE : une ligne par facture.
 *
 * <h3>Les trois questions</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : ce qui reste dû. Le rapport dit déjà ce qu'on a
 *       facturé ; ce bloc dit ce qui est rentré et ce qui manque, facture par facture. Sur
 *       AGHA ZONE 4 en août 2026 : 10 776 200 F facturés, 9 785 900 F recouvrés, et les
 *       990 300 F restants tiennent sur une seule des quatre factures.</li>
 *   <li><b>Ce qui appelle un geste</b> : RIEN, ici. Aucune relance ne part de cet écran, le
 *       geste est sur Comptabilité, Responsable Financier. Aucun montant n'est donc peint :
 *       peindre « Reste à recouvrer » en rouge transformerait un état en alarme et
 *       contredirait le tableau d'à côté, qui ne peint rien.</li>
 *   <li><b>La forme naturelle</b> : un tableau. Sept grandeurs sur N factures se lisent en
 *       colonnes alignées, chasse tabulaire, montants à droite. En tuiles, deux factures ne
 *       se comparent pas.</li>
 * </ul>
 *
 * <h3>⚠ Ce que ce bloc ne dit PAS</h3>
 * <p>Il ne dit pas « combien d'argent est rentré en août ». Aucune colonne ne date un
 * encaissement : les huit dates d'une facture sont sa période, son assignation, sa validation,
 * le dépôt partenaire, le dépôt banque, le visa DG et l'orientation. Le seul historique qui
 * date les versements est purgé dès qu'une facture est réinitialisée. Le titre dit donc
 * « recouvrement des factures de la période », et la note sous le tableau dit le reste.</p>
 *
 * <p>Il ne se soustrait pas non plus de « Facture totale à régler » : ce montant-là vient des
 * COURSES, celui-ci des FACTURES, et les deux règles diffèrent. La note le dit quand les deux
 * s'écartent.</p>
 */
export function RecouvrementSection({
  bloc,
  enChargement = false,
}: RecouvrementSectionProps) {
  /*
   * ⚠ LE CHARGEMENT SE TESTE AVANT L'ABSENCE, et c'est l'ordre qui compte.
   *
   * Pendant la premiere lecture, `data` est indefini, donc `bloc` est NUL - exactement comme en
   * vue globale. Tester `bloc === null` d'abord faisait donc afficher « Choisissez un
   * partenaire » pendant tout le chargement d'une selection ou un partenaire ETAIT choisi, puis
   * le tableau apparaissait d'un coup. L'ecran affirmait le contraire de ce que l'operateur
   * venait de faire.
   */
  if (enChargement && bloc === null) {
    return (
      <Card id={ANCRE_RECOUVREMENT}>
        <Card.Content className="gap-4 p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Recouvrement des factures de la période
          </h2>
          <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" />
        </Card.Content>
      </Card>
    );
  }

  if (bloc === null) {
    return (
      <Card id={ANCRE_RECOUVREMENT}>
        <Card.Content className="gap-1 p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Recouvrement des factures de la période
          </h2>
          <p className="text-sm text-muted">
            Choisissez un partenaire, plusieurs partenaires ou un groupe pour voir où en est le
            recouvrement de leurs factures. Sans sélection, la liste serait celle de toutes les
            factures de la période, tous partenaires confondus : c&apos;est l&apos;écran
            Comptabilité, Responsable Financier.
          </p>
        </Card.Content>
      </Card>
    );
  }

  const lignes = bloc.lignes ?? [];
  const colonnes = colonnesRecouvrement(avecColonneEtablissement(lignes));
  const mouvements = bloc.mouvements ?? [];
  const tronque = lignes.length < bloc.nombreFactures;

  const totalDe = (id: string) => {
    if (id === 'montant') return bloc.totalMontant;
    if (id === 'recouvre') return bloc.totalRecouvre;
    if (id === 'restant') return bloc.totalRestant;
    return null;
  };

  const cleLigne = (ligne: IRecouvrementFacture, i: number) =>
    `${ligne.code ?? ligne.restaurantId}-${ligne.composante ?? ''}-${ligne.periodeDebut}-${i}`;

  return (
    <Card id={ANCRE_RECOUVREMENT}>
      <Card.Content className="gap-4 p-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Recouvrement des factures de la période
          </h2>
          <p className="mt-1 text-sm text-muted">
            {bloc.nombreFactures === 0
              ? "Aucune facture n'a été émise sur cette période pour cette sélection."
              : `${bloc.nombreFactures} facture${bloc.nombreFactures > 1 ? 's' : ''} · ${formatMontantRecouvrement(bloc.totalRecouvre)} FCFA recouvrés sur ${formatMontantRecouvrement(bloc.totalMontant)} FCFA`}
          </p>
        </div>

        {/*
         * ⚠ Une liste COUPÉE qui ne le dit pas se lit « voilà tout ». Les totaux, eux, portent
         * sur toutes les factures : ils restent justes même ici.
         */}
        {tronque && (
          <p className="rounded-lg bg-surface-secondary px-4 py-3 text-xs text-warning-soft-foreground">
            {lignes.length} lignes affichées sur {bloc.nombreFactures}. Les totaux ci-dessous
            portent sur la totalité des factures, pas seulement sur les lignes visibles.
            Restreignez la période ou la sélection pour voir le détail complet.
          </p>
        )}

        {/*
         * ⚠ `lg:` vaut 1024 px et la fenêtre réelle du poste en fait environ 1000 : le tableau
         * ne s'ouvrirait JAMAIS et l'opérateur ne verrait que les cartes du téléphone. Le seuil
         * est `md:`.
         */}
        <div className="hidden md:block">
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Recouvrement des factures de la période"
                className="min-w-[56rem]"
              >
                <Table.Header>
                  {colonnes.map((colonne) => (
                    <Table.Column
                      className={colonne.classeLargeur}
                      id={colonne.id}
                      isRowHeader={colonne.id === colonnes[0].id}
                      key={colonne.id}
                    >
                      {colonne.numerique ? (
                        <span className="block text-right">{colonne.entete}</span>
                      ) : (
                        colonne.entete
                      )}
                    </Table.Column>
                  ))}
                </Table.Header>

                <Table.Body
                  renderEmptyState={() => (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <p className="text-sm text-muted">
                        Aucune facture n&apos;a été émise sur cette période pour cette sélection.
                      </p>
                      <p className="max-w-md text-xs text-muted">
                        Ce n&apos;est pas forcément une anomalie : la facturation peut ne pas
                        encore avoir tourné sur la période.
                      </p>
                    </div>
                  )}
                >
                  {enChargement
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {colonnes.map((colonne) => (
                            <Table.Cell key={`sq-${i}-${colonne.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(enChargement ? [] : lignes).map((ligne, i) => (
                    <Table.Row id={cleLigne(ligne, i)} key={cleLigne(ligne, i)}>
                      {colonnes.map((colonne) => (
                        <Table.Cell key={`${cleLigne(ligne, i)}-${colonne.id}`}>
                          {/*
                            * ⚠ `truncate` seulement sur les colonnes qui peuvent l'encaisser.
                            * « du 01/08/2026 au 07/08/2026 » et « Partiellement réglée » sont
                            * plus larges que leur colonne : tronquer une periode facturee la
                            * rend illisible, et c'est precisement la donnee qu'on vient
                            * verifier. Ces deux-la se REPLIENT sur deux lignes.
                            */}
                          <span
                            className={
                              colonne.numerique
                                ? 'block text-right tabular-nums'
                                : colonne.id === 'periode' || colonne.id === 'statut'
                                  ? 'block'
                                  : 'block truncate'
                            }
                          >
                            {texteCellule(ligne, colonne.id)}
                          </span>
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}

                  {/*
                   * LA LIGNE DE TOTAL EST UNE LIGNE DU TABLEAU, pas un `Table.Footer` : celui-ci
                   * est rendu HORS du `<table>` et ne s'aligne sur aucune colonne. Or ce total
                   * existe pour être lu sous sa colonne.
                   *
                   * ⚠ Autant de CELLULES que de COLONNES. Elles sont produites par la MÊME liste
                   * que l'en-tête, l'écart est donc impossible — et un écart lève « Cell count
                   * must match column count », qui emporte la page entière en 500.
                   *
                   * Le total porte sur TOUTES les factures, pas sur les lignes visibles.
                   */}
                  {!enChargement && lignes.length > 0 ? (
                    <Table.Row id="total">
                      {colonnes.map((colonne, index) => (
                        <Table.Cell className="border-t-2 border-t-separator" key={`total-${colonne.id}`}>
                          {index === 0 ? (
                            <span className="block font-semibold">
                              {libelleTotalFactures(bloc.nombreFactures)}
                            </span>
                          ) : colonne.totalisable ? (
                            <span className="block text-right font-semibold tabular-nums">
                              {formatMontantRecouvrement(totalDe(colonne.id))}
                            </span>
                          ) : (
                            <span className="block text-right text-muted">—</span>
                          )}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ) : null}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>

        {/* ── Au téléphone : une carte par facture, mêmes grandeurs ─────────────────── */}
        <div className="flex flex-col gap-3 md:hidden">
          {enChargement ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" key={`sqm-${i}`} />
            ))
          ) : lignes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Aucune facture n&apos;a été émise sur cette période pour cette sélection.
            </p>
          ) : (
            lignes.map((ligne, i) => (
              <Card key={cleLigne(ligne, i)}>
                <Card.Content className="gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {texteCellule(ligne, 'code')}
                  </span>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {colonnes
                      .filter((c) => c.id !== 'code')
                      .map((colonne) => (
                        <div className="flex items-center justify-between gap-2" key={colonne.id}>
                          <dt className="truncate text-muted">{colonne.entete}</dt>
                          {/*
                            * ⚠ PAS de `shrink-0` ici, contrairement au bloc voisin dont cette
                            * carte est copiee : la-bas toutes les valeurs sont des nombres
                            * courts, ici « du 01/08/2026 au 07/08/2026 » et « Partiellement
                            * reglee » sont plus larges que leur demi-colonne. `shrink-0` les
                            * faisait deborder de la grille au lieu de se replier.
                            */}
                          <dd className="text-right font-medium tabular-nums text-foreground">
                            {texteCellule(ligne, colonne.id)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </Card.Content>
              </Card>
            ))
          )}
        </div>

        {/*
          * LA CHRONOLOGIE, en bas, comme l'owner la demande : « la date et le montant recouvré
          * à chaque fois, quand l'agent dit qu'il a les sous, et quand le caissier confirme la
          * réception ».
          *
          * Un SECOND tableau plutôt que des lignes dépliables : une facture porte de un à
          * quatre mouvements, et l'opérateur suit l'argent dans le TEMPS, pas facture par
          * facture. Un relevé chronologique répond à la question posée ; des lignes à déplier
          * obligeraient à ouvrir quatre factures pour reconstituer une semaine.
          */}
        {lignes.length > 0 && (
          <div className="mt-2 border-t border-separator pt-4">
            <h3 className="text-base font-semibold text-foreground">Détail des encaissements</h3>

            {mouvements.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                {bloc.totalRecouvre > 0
                  ? "Aucun mouvement n'est tracé pour ces factures, alors qu'une partie est recouvrée. La chronologie a probablement été effacée par une réinitialisation de facture."
                  : "Aucun encaissement n'a encore été enregistré sur ces factures."}
              </p>
            ) : (
              <>
                <div className="mt-3 hidden md:block">
                  <Table>
                    <Table.ScrollContainer>
                      <Table.Content
                        aria-label="Détail des encaissements de la période"
                        className="min-w-[54rem]"
                      >
                        <Table.Header>
                          {COLONNES_MOUVEMENT.map((colonne) => (
                            <Table.Column
                              className={colonne.classeLargeur}
                              id={colonne.id}
                              isRowHeader={colonne.id === 'date'}
                              key={colonne.id}
                            >
                              {colonne.numerique ? (
                                <span className="block text-right">{colonne.entete}</span>
                              ) : (
                                colonne.entete
                              )}
                            </Table.Column>
                          ))}
                        </Table.Header>

                        <Table.Body>
                          {mouvements.map((m, i) => (
                            <Table.Row id={`mv-${i}`} key={`mv-${i}`}>
                              {COLONNES_MOUVEMENT.map((colonne) => (
                                <Table.Cell key={`mv-${i}-${colonne.id}`}>
                                  <span
                                    className={
                                      colonne.numerique
                                        ? 'block text-right tabular-nums'
                                        : 'block'
                                    }
                                  >
                                    {texteMouvement(m, colonne.id)}
                                  </span>
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                </div>

                {/* Au téléphone : une carte par mouvement. */}
                <div className="mt-3 flex flex-col gap-2 md:hidden">
                  {mouvements.map((m, i) => (
                    <Card key={`mvm-${i}`}>
                      <Card.Content className="gap-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {texteMouvement(m, 'libelle')}
                          </span>
                          <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                            {texteMouvement(m, 'montant')}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          {texteMouvement(m, 'date')} · {texteMouvement(m, 'factureCode')} ·{' '}
                          {texteMouvement(m, 'par')}
                        </p>
                      </Card.Content>
                    </Card>
                  ))}
                </div>
              </>
            )}

            <p className="mt-3 text-xs text-muted">{NOTE_MOUVEMENTS}</p>
          </div>
        )}

        <p className="text-xs text-muted">{NOTE_RECOUVREMENT}</p>
        <p className="text-xs text-muted">{NOTE_ECART_FACTURE}</p>
      </Card.Content>
    </Card>
  );
}
