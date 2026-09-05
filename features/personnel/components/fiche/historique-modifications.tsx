'use client';

import { Chip, Table } from '@heroui-v3/react';

import { IAuditActionFiche } from '@/features/personnel/types/personnel-historisation.types';
import { formaterDateHeure } from '@/features/personnel/utils/personnel-historisation.utils';

interface Props {
  actions: IAuditActionFiche[] | undefined;
  chargement: boolean;
  erreur: unknown;
}

/**
 * Le ton d'une action d'audit.
 *
 * <p>« Modification » était en `primary` — la couleur de MARQUE — et « Export » en
 * ambre. Or une modification est l'action ordinaire de ce journal : elle en compose la
 * quasi-totalité, et la peindre revenait à colorer toute la colonne. Ce qui se distingue
 * vraiment, c'est ce qui CRÉE et ce qui SUPPRIME.</p>
 */
const TON_ACTION: Record<string, 'danger' | 'default' | 'success'> = {
  CONSULTATION_AUDIT: 'default',
  CREATION: 'success',
  EXPORT: 'default',
  MODIFICATION: 'default',
  SUPPRESSION: 'danger',
};

const COLONNES = ['Quand', 'Qui', 'Action', 'Ce qui a changé'] as const;

function texteValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined || valeur === '') return '∅';
  if (typeof valeur === 'object') return JSON.stringify(valeur);
  return String(valeur);
}

/** Les champs réellement modifiés, sous la forme « champ : avant → après ». */
function Diff({ action }: { action: IAuditActionFiche }) {
  const avant = action.valeursAvant ?? {};
  const apres = action.valeursApres ?? {};
  const champs = Array.from(new Set([...Object.keys(avant), ...Object.keys(apres)]));

  if (champs.length === 0) {
    return <span className="text-muted">{action.entiteLibelle ?? '—'}</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {champs.map((champ) => (
        <div className="text-xs" key={champ}>
          <span className="font-medium text-foreground">{champ}</span>
          <span className="text-muted"> : </span>
          <span className="text-muted line-through">{texteValeur(avant[champ])}</span>
          <span className="text-muted"> → </span>
          <span className="font-medium text-foreground">{texteValeur(apres[champ])}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Onglet « Historique des modifications » de la fiche : qui a fait quoi sur CE dossier.
 *
 * L'endpoint d'audit est gardé (Direction / Admin / Ops Manager). Un refus n'est pas une
 * panne : on le dit, on n'affiche pas d'erreur technique.
 */
export function HistoriqueModifications({ actions, chargement, erreur }: Props) {
  if (erreur) {
    const statut = (erreur as { response?: { status?: number } })?.response?.status;
    return (
      <p className="rounded-lg border border-separator bg-surface-secondary p-4 text-sm text-muted">
        {statut === 403
          ? "La consultation de l'audit est réservée à la Direction, aux administrateurs et aux Ops Managers."
          : "L'historique des modifications n'a pas pu être chargé."}
      </p>
    );
  }

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Historique des modifications de la fiche"
          className="min-w-[48rem]"
        >
          <Table.Header>
            {COLONNES.map((c) => (
              <Table.Column id={c} isRowHeader={c === 'Quand'} key={c}>
                {c}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() =>
              chargement ? null : (
                <p className="py-8 text-center text-sm text-muted">
                  Aucune modification enregistrée sur cette fiche.
                </p>
              )
            }
          >
            {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
            {chargement
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                    {COLONNES.map((c) => (
                      <Table.Cell key={`sq-${i}-${c}`}>
                        <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              : null}

            {(chargement ? [] : (actions ?? [])).map((a) => (
              <Table.Row id={a.id} key={a.id}>
                <Table.Cell className="whitespace-nowrap text-muted">
                  {formaterDateHeure(a.occurredAt)}
                </Table.Cell>
                <Table.Cell>
                  <div className="text-sm font-medium text-foreground">
                    {a.utilisateur ?? 'Inconnu'}
                  </div>
                  {a.role ? <div className="text-xs text-muted">{a.role}</div> : null}
                </Table.Cell>
                <Table.Cell>
                  <Chip color={TON_ACTION[a.typeAction ?? ''] ?? 'default'} size="sm" variant="soft">
                    <Chip.Label>{a.typeAction ?? '—'}</Chip.Label>
                  </Chip>
                  {a.ecran ? <div className="mt-0.5 text-xs text-muted">{a.ecran}</div> : null}
                </Table.Cell>
                <Table.Cell>
                  <Diff action={a} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
