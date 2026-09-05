'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, Table } from '@heroui-v3/react';
import { Can } from '@/components/auth/Can';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEntreeCaisseListQuery } from '@/features/entrees-caisse/queries/entree-caisse-list.query';
import { EntreeCaisseStatutCell } from '@/components/finance/entrees-caisse/statut-cell';
import EtatErreur from '@/components/commons/EtatErreur';
import { formatMontant } from '@/utils/format.utils';

export function EntreeCaisseMiniTable() {
  const router = useRouter();
  const { data: entries, isLoading, isError, isFetching, refetch } = useEntreeCaisseListQuery();
  const derniers5 = (entries || []).slice(0, 5);

  // meme bloc pour les deux rendus (tableau desktop, cartes mobiles) : un seul est visible a la fois
  const zoneErreur = <EtatErreur quoi="les entrées caisse" onReessayer={() => refetch()} enCours={isFetching} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          5 dernières entrées caisse
        </h3>
        {/* Ce tableau vit dans « Dashboard Performance », ouvert a OPS_MANAGER et
            RESPONSABLE_VA — mais `/finance/entrees-caisse` demande `read Finance`,
            que ni l'un ni l'autre ne possede. Depuis que le defaut d'acces est FERME,
            le bouton les menait a un 403 depuis un ecran qu'on leur accorde. On masque
            le lien plutot que d'elargir un droit financier : on ne montre pas une porte
            qu'on ne peut pas ouvrir. */}
        <Can I="read" a="Finance">
          <Button onPress={() => router.push('/finance/entrees-caisse')} size="sm" variant="ghost">
            Voir tout
            <ArrowRight aria-hidden="true" className="size-3" />
          </Button>
        </Can>
      </div>
      {/* Tableau — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="5 dernières entrées caisse">
                <Table.Header>
                  <Table.Column id="libelle" isRowHeader>
                    Libellé
                  </Table.Column>
                  <Table.Column id="montant">Montant</Table.Column>
                  <Table.Column id="statut">Statut</Table.Column>
                  <Table.Column id="date">Date</Table.Column>
                </Table.Header>

                {/* sur echec, l'erreur prend la place du message vide qui se lirait comme
                    "il n'y a rien" */}
                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : isError ? (
                      <div className="py-4">{zoneErreur}</div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted">Aucune entrée caisse</p>
                    )
                  }
                >
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {['libelle', 'montant', 'statut', 'date'].map((c) => (
                            <Table.Cell key={`sq-${i}-${c}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading || isError ? [] : derniers5).map((entry) => (
                    <Table.Row id={entry.id} key={entry.id}>
                      <Table.Cell>{entry.libelle}</Table.Cell>
                      <Table.Cell>
                        <span className="block text-right font-semibold tabular-nums">
                          {formatMontant(entry.montant)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <EntreeCaisseStatutCell entree={entry} />
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-muted">
                          {format(new Date(entry.dateEntree), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`m-skel-${i}`} className="h-20 rounded-xl bg-surface-secondary animate-pulse" />
          ))
        ) : isError ? (
          zoneErreur
        ) : derniers5.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">Aucune entrée caisse</p>
        ) : (
          derniers5.map((entry) => (
            <Card key={entry.id}>
              <Card.Content className="gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{entry.libelle}</p>
                <span className="text-sm font-semibold text-foreground shrink-0">{formatMontant(entry.montant)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Date</span>
                <span className="text-sm text-muted">{format(new Date(entry.dateEntree), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Statut</span>
                <EntreeCaisseStatutCell entree={entry} />
              </div>
              </Card.Content>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
