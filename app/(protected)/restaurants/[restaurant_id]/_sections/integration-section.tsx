'use client';

import {
  Button,
  Card,
  Chip,
  Modal,
  Spinner,
  Table,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@heroui-v3/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Webhook,
  XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { ChampCopiable } from '@/components/commons/ChampCopiable';
import EtatErreur from '@/components/commons/EtatErreur';
import { ChampTexte, ChampZoneTexte } from '@/components/commons/champs-formulaire';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import type { IIntegrationLog, IWebhook } from '@/features/integrations/apis/integration.api';
import {
  useCleApiQuery,
  useEnregistrerWebhookMutation,
  useIntegrationLogsQuery,
  useModifierWebhookMutation,
  useSupprimerWebhookMutation,
  useWebhooksQuery,
} from '@/features/integrations/queries/integration.query';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BACKEND_URL ?? '').replace(/\/$/, '');
const ENDPOINT_ENTRANT = `${BACKEND_URL}/api/restaurant/course-externe/commande`;

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
  } catch {
    return iso;
  }
}

// ─── Bloc titre de sous-section ────────────────────────────────────────────────
function SubTitle({
  action,
  children,
  icon,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-muted">{icon}</span>
        {children}
      </div>
      {action}
    </div>
  );
}

/**
 * Le SENS d'un appel réseau : entrant ou sortant.
 *
 * <p>C'était `color="primary"` et `color="secondary"` — deux couleurs pour une DIRECTION,
 * dont celle de la marque. La flèche le dit déjà, et sans ambiguïté.</p>
 */
function ChipSens({ direction }: { direction: string }) {
  const entrant = direction === 'ENTRANT';
  return (
    <Chip size="sm" variant="soft">
      {entrant ? (
        <ArrowDownLeft aria-hidden="true" className="size-3" />
      ) : (
        <ArrowUpRight aria-hidden="true" className="size-3" />
      )}
      <Chip.Label>{entrant ? 'Entrant' : 'Sortant'}</Chip.Label>
    </Chip>
  );
}

/** Le RÉSULTAT, lui, garde sa couleur : c'est ce qu'on cherche dans ce journal. */
function ChipResultat({ succes }: { succes: boolean }) {
  return (
    <Chip color={succes ? 'success' : 'danger'} size="sm" variant="soft">
      {succes ? (
        <CheckCircle2 aria-hidden="true" className="size-3" />
      ) : (
        <XCircle aria-hidden="true" className="size-3" />
      )}
      <Chip.Label>{succes ? 'Succès' : 'Échec'}</Chip.Label>
    </Chip>
  );
}

// ─── Modale d'ajout / modification d'un webhook ────────────────────────────────
function WebhookFormModal({
  isOpen,
  onOpenChange,
  restaurantId,
  webhook,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  webhook: IWebhook | null;
}) {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const enregistrer = useEnregistrerWebhookMutation(restaurantId);
  const modifier = useModifierWebhookMutation(restaurantId);
  const isEdit = !!webhook;
  const pending = enregistrer.isPending || modifier.isPending;

  // Réinitialise les champs à chaque ouverture.
  React.useEffect(() => {
    if (isOpen) {
      setUrl(webhook?.url ?? '');
      setDescription(webhook?.description ?? '');
    }
  }, [isOpen, webhook]);

  async function submit() {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    try {
      if (isEdit) {
        await modifier.mutateAsync({
          description: description.trim() || undefined,
          id: webhook!.id,
          url: cleanUrl,
        });
      } else {
        await enregistrer.mutateAsync({
          description: description.trim() || undefined,
          url: cleanUrl,
        });
      }
      onOpenChange(false);
    } catch {
      /* toast géré dans la mutation */
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span>{isEdit ? 'Modifier le webhook' : 'Ajouter un webhook'}</span>
                <span className="text-xs font-normal text-muted">
                  URL appelée par Turbo (POST) à chaque évènement de course de ce partenaire.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <ChampTexte
                label="URL du webhook"
                onChange={setUrl}
                placeholder="https://api.partenaire.com/turbo/webhook"
                valeur={url}
              />
              <ChampZoneTexte
                label="Description (optionnel)"
                lignes={2}
                onChange={setDescription}
                placeholder="Ex. : endpoint de suivi des commandes"
                valeur={description}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button isDisabled={pending} onPress={() => onOpenChange(false)} variant="ghost">
                Annuler
              </Button>
              <Button
                isDisabled={!url.trim()}
                isPending={pending}
                onPress={submit}
                variant="primary"
              >
                {isEdit ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ─── Modale de détails d'un appel réseau ───────────────────────────────────────
function LogDetailsModal({
  isOpen,
  log,
  onOpenChange,
}: {
  isOpen: boolean;
  log: IIntegrationLog | null;
  onOpenChange: (open: boolean) => void;
}) {
  const pretty = (raw: null | string) => {
    if (!raw) return '—';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <ChipSens direction={log?.direction ?? ''} />
                  <span className="text-sm">{log?.evenement}</span>
                </span>
                <span className="text-xs font-normal text-muted">
                  {log ? fmtDate(log.createdAt) : ''}
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted">Méthode</p>
                  <p className="font-medium text-foreground">{log?.methode ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Statut HTTP</p>
                  <p className="font-medium text-foreground">{log?.reponseStatut ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Résultat</p>
                  <p className="font-medium text-foreground">{log?.succes ? 'Succès' : 'Échec'}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted">URL</p>
                <p className="rounded-md border border-separator bg-surface-secondary p-2 font-mono text-xs break-all">
                  {log?.url ?? '—'}
                </p>
              </div>
              {log?.erreur && (
                <div>
                  <p className="mb-1 text-xs text-muted">Erreur</p>
                  {/* C'etait `bg-red-50 text-red-700 border-red-100` : trois teintes de
                      palette sans variante sombre, sur le seul bloc qu'on vient lire. */}
                  <pre className="rounded-md border border-danger/30 bg-danger/10 p-2 font-mono text-xs break-all whitespace-pre-wrap text-danger-soft-foreground">
                    {log.erreur}
                  </pre>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs text-muted">Requête</p>
                <pre className="max-h-60 overflow-auto rounded-md border border-separator bg-surface-secondary p-2 font-mono text-xs break-all whitespace-pre-wrap">
                  {pretty(log?.requete ?? null)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted">Réponse</p>
                <pre className="max-h-60 overflow-auto rounded-md border border-separator bg-surface-secondary p-2 font-mono text-xs break-all whitespace-pre-wrap">
                  {pretty(log?.reponseCorps ?? null)}
                </pre>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

const COLONNES_LOGS = [
  { id: 'date', libelle: 'Date' },
  { id: 'sens', libelle: 'Sens' },
  { id: 'evenement', libelle: 'Évènement' },
  { id: 'statut', libelle: 'Statut' },
  { id: 'resultat', libelle: 'Résultat' },
  { id: 'actions', libelle: '' },
] as const;

const SENS = [
  { id: 'TOUS', libelle: 'Tous' },
  { id: 'ENTRANT', libelle: 'Entrants' },
  { id: 'SORTANT', libelle: 'Sortants' },
] as const;

const RESULTATS = [
  { id: 'TOUS', libelle: 'Tous résultats' },
  { id: 'OK', libelle: 'Succès' },
  { id: 'KO', libelle: 'Échecs' },
] as const;

// ─── Journal des appels réseau ─────────────────────────────────────────────────
function LogsViewer({ restaurantId }: { restaurantId: string }) {
  const [direction, setDirection] = useState<'ENTRANT' | 'SORTANT' | 'TOUS'>('TOUS');
  const [statut, setStatut] = useState<'KO' | 'OK' | 'TOUS'>('TOUS');
  const [page, setPage] = useState(0);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const [selected, setSelected] = useState<IIntegrationLog | null>(null);

  const { data, isError, isFetching, isLoading, refetch } = useIntegrationLogsQuery({
    direction: direction === 'TOUS' ? undefined : direction,
    page,
    restaurantId,
    size: 10,
    succes: statut === 'TOUS' ? undefined : statut === 'OK',
  });

  const logs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  function openDetail(log: IIntegrationLog) {
    setSelected(log);
    setDetailOuvert(true);
  }

  return (
    <div>
      <SubTitle
        action={
          isFetching ? (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Spinner size="sm" /> actualisation…
            </span>
          ) : (
            <span className="text-xs text-muted">
              {data?.totalElements ?? 0} appel{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </span>
          )
        }
        icon={<Radio aria-hidden="true" className="size-4" />}
      >
        Journal des appels réseau
      </SubTitle>

      {/*
       * `ToggleButtonGroup` et non `Tabs` : `Tabs.Indicator` fait tomber la page, et sans
       * lui les onglets ne distinguent l'actif que par une nuance de gris. Trois options
       * par groupe : la rangee tient sur une ligne.
       */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <ToggleButtonGroup
          onSelectionChange={(sel) => {
            setDirection(String(Array.from(sel)[0] ?? 'TOUS') as typeof direction);
            setPage(0);
          }}
          selectedKeys={new Set([direction])}
          selectionMode="single"
          size="sm"
        >
          {SENS.map((s) => (
            <ToggleButton id={s.id} key={s.id}>
              {s.libelle}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          onSelectionChange={(sel) => {
            setStatut(String(Array.from(sel)[0] ?? 'TOUS') as typeof statut);
            setPage(0);
          }}
          selectedKeys={new Set([statut])}
          selectionMode="single"
          size="sm"
        >
          {RESULTATS.map((r) => (
            <ToggleButton id={r.id} key={r.id}>
              {r.libelle}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {/* On retire le tableau plutot que de le laisser dire "aucun appel
          reseau enregistre" : c'est la conclusion inverse de celle a tirer
          quand c'est la lecture du journal qui a echoue. */}
      {isError ? (
        <EtatErreur
          enCours={isFetching}
          onReessayer={() => refetch()}
          quoi="les appels réseau de ce partenaire"
        />
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Journal des appels réseau" className="min-w-[52rem]">
              <Table.Header>
                {COLONNES_LOGS.map((c) => (
                  <Table.Column id={c.id} isRowHeader={c.id === 'date'} key={c.id}>
                    {c.libelle}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  isLoading ? null : (
                    <p className="py-8 text-center text-sm text-muted">
                      Aucun appel réseau enregistré pour l&apos;instant.
                    </p>
                  )
                }
              >
                {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {COLONNES_LOGS.map((c) => (
                          <Table.Cell key={`sq-${i}-${c.id}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : null}

                {(isLoading ? [] : logs).map((log) => (
                  <Table.Row id={log.id} key={log.id}>
                    <Table.Cell className="text-xs whitespace-nowrap text-muted">
                      {fmtDate(log.createdAt)}
                    </Table.Cell>
                    <Table.Cell>
                      <ChipSens direction={log.direction} />
                    </Table.Cell>
                    <Table.Cell className="text-xs font-medium text-foreground">
                      {log.evenement}
                    </Table.Cell>
                    <Table.Cell className="text-xs text-muted">
                      {log.reponseStatut ?? '—'}
                    </Table.Cell>
                    <Table.Cell>
                      <ChipResultat succes={log.succes} />
                    </Table.Cell>
                    <Table.Cell>
                      <Tooltip>
                        <Button
                          aria-label="Voir le détail de cet appel"
                          isIconOnly
                          onPress={() => openDetail(log)}
                          size="sm"
                          variant="ghost"
                        >
                          <Eye aria-hidden="true" className="size-4" />
                        </Button>
                        <Tooltip.Content>Voir le détail (requête / réponse)</Tooltip.Content>
                      </Tooltip>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>

          {totalPages > 1 && (
            <Table.Footer className="justify-center">
              <PaginationTableau onPage={(p) => setPage(p - 1)} page={page + 1} total={totalPages} />
            </Table.Footer>
          )}
        </Table>
      )}

      <LogDetailsModal isOpen={detailOuvert} log={selected} onOpenChange={setDetailOuvert} />
    </div>
  );
}

// ─── Section principale ────────────────────────────────────────────────────────
export default function IntegrationSection({ restaurantId }: { restaurantId: string }) {
  const {
    data: cleApi,
    isError: cleErreur,
    isFetching: cleRelecture,
    isLoading: cleLoading,
    refetch: relireCle,
  } = useCleApiQuery(restaurantId);
  const {
    data: webhooks,
    isError: webhooksErreur,
    isFetching: webhooksRelecture,
    isLoading: webhooksLoading,
    refetch: relireWebhooks,
  } = useWebhooksQuery(restaurantId);
  const [formOuvert, setFormOuvert] = useState(false);
  const suppr = useSupprimerWebhookMutation(restaurantId);
  const [editing, setEditing] = useState<IWebhook | null>(null);

  const apiKey = cleApi?.apiKey ?? '';

  function openAdd() {
    setEditing(null);
    setFormOuvert(true);
  }
  function openEdit(w: IWebhook) {
    setEditing(w);
    setFormOuvert(true);
  }

  const webhookList = useMemo(() => webhooks ?? [], [webhooks]);

  return (
    <Card>
      <Card.Content className="gap-8 p-6">
        <div>
          <h2 className="mb-1 text-base font-semibold text-foreground">Intégration</h2>
          <p className="text-sm text-muted">
            Connectez la solution de ce partenaire à Turbo : clé d&apos;accès, endpoint de
            création de course, webhooks de suivi et journal complet des échanges réseau.
          </p>
        </div>

        {/* ── Clé API ── */}
        <div>
          <SubTitle icon={<KeyRound aria-hidden="true" className="size-4" />}>Clé API</SubTitle>
          <p className="mb-2 text-xs text-muted">
            Le partenaire l&apos;envoie dans l&apos;en-tête{' '}
            <code className="font-mono text-foreground">X-API-KEY</code> de chaque requête. À
            communiquer de façon sécurisée.
          </p>
          {cleLoading ? (
            <div className="h-10 animate-pulse rounded-lg bg-surface-secondary" />
          ) : cleErreur ? (
            // "Aucune cle API" ferait croire que le partenaire n'est pas
            // integre, et pousserait a lui en generer une nouvelle.
            <EtatErreur
              enCours={cleRelecture}
              onReessayer={() => relireCle()}
              quoi="la clé API de ce partenaire"
            />
          ) : apiKey ? (
            // La cle etait affichee EN CLAIR des l'ouverture de la fiche : lisible par-dessus
            // l'epaule, sur un ecran partage, et dans toute capture de la page. Elle reste
            // masquee par defaut ; « copier » fonctionne sans rien reveler.
            <ChampCopiable masquable valeur={apiKey} />
          ) : (
            <p className="text-xs text-muted">Aucune clé API pour ce partenaire.</p>
          )}
        </div>

        {/* ── Endpoint entrant (documentation) ── */}
        <div>
          <SubTitle icon={<ArrowDownLeft aria-hidden="true" className="size-4" />}>
            Endpoint de création de course (entrant)
          </SubTitle>
          <p className="mb-2 text-xs text-muted">
            Le partenaire crée une course en envoyant un <b>POST</b> à cette URL, avec sa clé API
            en en-tête.
          </p>
          <ChampCopiable valeur={ENDPOINT_ENTRANT} />
        </div>

        {/* ── Webhooks ── */}
        <div>
          <SubTitle
            action={
              <Button onPress={openAdd} size="sm" variant="outline">
                <Plus aria-hidden="true" className="size-4" />
                Ajouter
              </Button>
            }
            icon={<Webhook aria-hidden="true" className="size-4" />}
          >
            Webhooks (sortant)
          </SubTitle>
          <p className="mb-3 text-xs text-muted">
            À chaque évènement de course (créée, récupérée, en route, livrée, annulée), Turbo
            envoie une notification <b>POST</b> à ces URL. Sans webhook configuré, aucune
            notification n&apos;est envoyée.
          </p>

          {webhooksLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div className="h-14 animate-pulse rounded-lg bg-surface-secondary" key={i} />
              ))}
            </div>
          ) : webhooksErreur ? (
            // "Aucun webhook configure" se lit ici comme "le partenaire ne
            // recoit rien" : sur un echec de lecture, c'est un faux diagnostic.
            <EtatErreur
              enCours={webhooksRelecture}
              onReessayer={() => relireWebhooks()}
              quoi="les webhooks de ce partenaire"
            />
          ) : webhookList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-separator p-4 text-center text-xs text-muted">
              Aucun webhook configuré.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {webhookList.map((w) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-surface-secondary/50 px-4 py-2.5"
                  key={w.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-foreground">{w.url}</p>
                    {w.description && <p className="truncate text-xs text-muted">{w.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Tooltip>
                      <Button
                        aria-label="Modifier ce webhook"
                        isIconOnly
                        onPress={() => openEdit(w)}
                        size="sm"
                        variant="ghost"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </Button>
                      <Tooltip.Content>Modifier</Tooltip.Content>
                    </Tooltip>
                    <Tooltip>
                      <Button
                        aria-label="Supprimer ce webhook"
                        isIconOnly
                        isPending={suppr.isPending && suppr.variables === w.id}
                        onPress={() => suppr.mutate(w.id)}
                        size="sm"
                        variant="danger-soft"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                      <Tooltip.Content>Supprimer</Tooltip.Content>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Journal ── */}
        <LogsViewer restaurantId={restaurantId} />

        <WebhookFormModal
          isOpen={formOuvert}
          onOpenChange={setFormOuvert}
          restaurantId={restaurantId}
          webhook={editing}
        />
      </Card.Content>
    </Card>
  );
}
