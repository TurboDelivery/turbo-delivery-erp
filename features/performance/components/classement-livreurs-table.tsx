'use client';

import { Table } from '@heroui-v3/react';

import { IndicateurTendance } from '@/features/classement-partenaires/components/indicateur-tendance';
import type { LigneClassementLivreur } from '@/src/performance/classement-livreurs.action';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';

/**
 * Le tableau du classement des livreurs.
 *
 * <h3>Le rang s'affiche TEL QUEL</h3>
 * <p>Il porte les ex æquo : 1, 2, 2, 2, 5. On ne renumérote pas les lignes, parce que trois
 * livreurs à égalité occupent vraiment la même place, et que le suivant est vraiment
 * cinquième. Renuméroter donnerait 1, 2, 3, 4, 5 et inventerait un ordre entre des égaux.</p>
 *
 * <h3>Une colonne peut ne pas s'appliquer</h3>
 * <p>« Jours travaillés » porte un tiret pour un livreur sans emploi du temps : il n'a pas
 * travaillé zéro jour, on ne sait pas. L'exigence 5.1 l'impose, et c'est ce qui distingue un
 * indépendant jamais planifié d'un journalier absent toute la semaine.</p>
 */
export function ClassementLivreursTable({
  lignes,
  lienFicheBase,
  lienFicheRequete,
}: {
  lignes: LigneClassementLivreur[];
  /**
   * Le lien vers la fiche d'un livreur, en DEUX MORCEAUX et non en fonction.
   *
   * <p>⚠ Une FONCTION ne traverse pas la frontière serveur/client. Ce composant est un
   * composant client, la page qui l'appelle est un composant serveur : lui passer
   * `lienFiche={(id) => ...}` fait lever « Functions cannot be passed directly to Client
   * Components » et emporte la PAGE ENTIÈRE sur son écran d'erreur. Constaté en production
   * le 15/09/2026, et invisible pour `tsc` comme pour `pnpm build`.</p>
   *
   * <p>Deux chaînes suffisent : le chemin de base et la requête à recopier. Le composant
   * assemble `base/identifiant + requête` lui-même.</p>
   */
  lienFicheBase: string;
  lienFicheRequete?: string;
}) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Classement des livreurs" className="min-w-[54rem]">
          <Table.Header>
            <Table.Column id="rang" isRowHeader>
              Rang
            </Table.Column>
            <Table.Column id="livreur">Livreur</Table.Column>
            <Table.Column id="contrat">Contrat</Table.Column>
            <Table.Column id="livraisons">Livraisons</Table.Column>
            <Table.Column id="gain">Gain</Table.Column>
            <Table.Column id="jours">Jours travaillés</Table.Column>
            <Table.Column id="tendance">Évolution</Table.Column>
          </Table.Header>

          <Table.Body
            renderEmptyState={() => (
              <p className="py-8 text-center text-sm text-muted">
                Aucun livreur sur cette semaine.
              </p>
            )}
          >
            {lignes.map((l) => (
              <Table.Row id={l.livreurId} key={l.livreurId}>
                <Table.Cell>
                  {/* Les trois premiers portent l'accent : c'est la seule information que
                      le rang seul ne donne pas d'un coup d'oeil sur une liste longue. */}
                  <span
                    className={cn(
                      'inline-flex size-7 items-center justify-center rounded-medium text-sm font-semibold tabular-nums',
                      l.rang <= 3
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-default-100 text-default-600',
                    )}
                  >
                    {l.rang}
                  </span>
                </Table.Cell>

                <Table.Cell>
                  <a
                    className="block max-w-[18rem] truncate font-medium text-foreground hover:underline"
                    href={`${lienFicheBase}/${l.livreurId}${lienFicheRequete ?? ''}`}
                  >
                    {l.nom ?? l.livreurId}
                  </a>
                </Table.Cell>

                <Table.Cell>
                  <span className="text-sm text-muted">
                    {l.contrat ? getTurboyTypeDisplay(l.contrat).label : '—'}
                  </span>
                </Table.Cell>

                <Table.Cell>
                  <span className="block text-right tabular-nums">{formatNumber(l.nbTickets)}</span>
                </Table.Cell>

                <Table.Cell>
                  <span className="block text-right tabular-nums">{formatMontant(l.gain)}</span>
                </Table.Cell>

                <Table.Cell>
                  {/*
                   * Un TIRET, jamais un zero. Le livreur n'a pas travaille zero jour : aucun
                   * emploi du temps n'existe, donc la grandeur n'est pas mesuree.
                   */}
                  <span className="block text-right tabular-nums text-muted">
                    {l.joursTravailles ?? '—'}
                  </span>
                </Table.Cell>

                <Table.Cell>
                  <IndicateurTendance tendance={l.tendance} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
