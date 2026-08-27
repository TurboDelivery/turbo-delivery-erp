'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Snippet,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Tab,
  Textarea,
  Tooltip,
  useDisclosure,
} from '@heroui/react';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  useCleApiQuery,
  useEnregistrerWebhookMutation,
  useIntegrationLogsQuery,
  useModifierWebhookMutation,
  useSupprimerWebhookMutation,
  useWebhooksQuery,
} from '@/features/integrations/queries/integration.query';
import type { IIntegrationLog, IWebhook } from '@/features/integrations/apis/integration.api';

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
function SubTitle({ icon, children, action }: { icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-primary">{icon}</span>
        {children}
      </div>
      {action}
    </div>
  );
}

// ─── Modale d'ajout / modification d'un webhook ────────────────────────────────
function WebhookFormModal({
  restaurantId,
  webhook,
  isOpen,
  onOpenChange,
}: {
  restaurantId: string;
  webhook: IWebhook | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

  async function submit(close: () => void) {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    try {
      if (isEdit) {
        await modifier.mutateAsync({ id: webhook!.id, url: cleanUrl, description: description.trim() || undefined });
      } else {
        await enregistrer.mutateAsync({ url: cleanUrl, description: description.trim() || undefined });
      }
      close();
    } catch {
      /* toast géré dans la mutation */
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {isEdit ? 'Modifier le webhook' : 'Ajouter un webhook'}
              <span className="text-xs font-normal text-gray-500">
                URL appelée par Turbo (POST) à chaque évènement de course de ce partenaire.
              </span>
            </ModalHeader>
            <ModalBody>
              <Input
                autoFocus
                label="URL du webhook"
                placeholder="https://api.partenaire.com/turbo/webhook"
                variant="bordered"
                value={url}
                onValueChange={setUrl}
                isRequired
              />
              <Textarea
                label="Description (optionnel)"
                placeholder="Ex. : endpoint de suivi des commandes"
                variant="bordered"
                value={description}
                onValueChange={setDescription}
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={close} isDisabled={pending}>
                Annuler
              </Button>
              <Button color="primary" onPress={() => submit(close)} isLoading={pending} isDisabled={!url.trim()}>
                {isEdit ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// ─── Modale de détails d'un appel réseau ───────────────────────────────────────
function LogDetailsModal({
  log,
  isOpen,
  onOpenChange,
}: {
  log: IIntegrationLog | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pretty = (raw: string | null) => {
    if (!raw) return '—';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  };
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" placement="center" scrollBehavior="inside">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                {log?.direction === 'ENTRANT' ? (
                  <Chip size="sm" color="primary" variant="flat" startContent={<ArrowDownLeft className="w-3 h-3" />}>
                    Entrant
                  </Chip>
                ) : (
                  <Chip size="sm" color="secondary" variant="flat" startContent={<ArrowUpRight className="w-3 h-3" />}>
                    Sortant
                  </Chip>
                )}
                <span className="text-sm">{log?.evenement}</span>
              </span>
              <span className="text-xs font-normal text-gray-500">{log ? fmtDate(log.createdAt) : ''}</span>
            </ModalHeader>
            <ModalBody className="text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Méthode</p>
                  <p className="font-medium">{log?.methode ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut HTTP</p>
                  <p className="font-medium">{log?.reponseStatut ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Résultat</p>
                  <p className="font-medium">{log?.succes ? 'Succès' : 'Échec'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">URL</p>
                <p className="font-mono text-xs break-all bg-gray-50 rounded-md p-2 border border-gray-100">
                  {log?.url ?? '—'}
                </p>
              </div>
              {log?.erreur && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Erreur</p>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-all bg-red-50 text-red-700 rounded-md p-2 border border-red-100">
                    {log.erreur}
                  </pre>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Requête</p>
                <pre className="font-mono text-xs whitespace-pre-wrap break-all bg-gray-50 rounded-md p-2 border border-gray-100 max-h-60 overflow-auto">
                  {pretty(log?.requete ?? null)}
                </pre>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Réponse</p>
                <pre className="font-mono text-xs whitespace-pre-wrap break-all bg-gray-50 rounded-md p-2 border border-gray-100 max-h-60 overflow-auto">
                  {pretty(log?.reponseCorps ?? null)}
                </pre>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// ─── Journal des appels réseau ─────────────────────────────────────────────────
function LogsViewer({ restaurantId }: { restaurantId: string }) {
  const [direction, setDirection] = useState<'TOUS' | 'ENTRANT' | 'SORTANT'>('TOUS');
  const [statut, setStatut] = useState<'TOUS' | 'OK' | 'KO'>('TOUS');
  const [page, setPage] = useState(0);
  const detail = useDisclosure();
  const [selected, setSelected] = useState<IIntegrationLog | null>(null);

  const { data, isLoading, isFetching } = useIntegrationLogsQuery({
    restaurantId,
    direction: direction === 'TOUS' ? undefined : direction,
    succes: statut === 'TOUS' ? undefined : statut === 'OK',
    page,
    size: 10,
  });

  const logs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  function openDetail(log: IIntegrationLog) {
    setSelected(log);
    detail.onOpen();
  }

  return (
    <div>
      <SubTitle
        icon={<Radio className="w-4 h-4" />}
        action={
          isFetching ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Spinner size="sm" /> actualisation…
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              {data?.totalElements ?? 0} appel{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </span>
          )
        }
      >
        Journal des appels réseau
      </SubTitle>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Tabs
          size="sm"
          aria-label="Sens"
          selectedKey={direction}
          onSelectionChange={(k) => {
            setDirection(k as typeof direction);
            setPage(0);
          }}
        >
          <Tab key="TOUS" title="Tous" />
          <Tab key="ENTRANT" title="Entrants" />
          <Tab key="SORTANT" title="Sortants" />
        </Tabs>
        <Tabs
          size="sm"
          aria-label="Résultat"
          selectedKey={statut}
          onSelectionChange={(k) => {
            setStatut(k as typeof statut);
            setPage(0);
          }}
        >
          <Tab key="TOUS" title="Tous résultats" />
          <Tab key="OK" title="Succès" />
          <Tab key="KO" title="Échecs" />
        </Tabs>
      </div>

      <Table
        aria-label="Journal des appels réseau"
        removeWrapper
        isStriped
        bottomContent={
          totalPages > 1 ? (
            <div className="flex justify-center">
              <Pagination
                showControls
                size="sm"
                total={totalPages}
                page={page + 1}
                onChange={(p) => setPage(p - 1)}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>DATE</TableColumn>
          <TableColumn>SENS</TableColumn>
          <TableColumn>ÉVÈNEMENT</TableColumn>
          <TableColumn>STATUT</TableColumn>
          <TableColumn>RÉSULTAT</TableColumn>
          <TableColumn> </TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner />}
          emptyContent="Aucun appel réseau enregistré pour l'instant."
        >
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-xs text-gray-600">{fmtDate(log.createdAt)}</TableCell>
              <TableCell>
                {log.direction === 'ENTRANT' ? (
                  <Chip size="sm" color="primary" variant="flat" startContent={<ArrowDownLeft className="w-3 h-3" />}>
                    Entrant
                  </Chip>
                ) : (
                  <Chip size="sm" color="secondary" variant="flat" startContent={<ArrowUpRight className="w-3 h-3" />}>
                    Sortant
                  </Chip>
                )}
              </TableCell>
              <TableCell className="text-xs font-medium text-gray-700">{log.evenement}</TableCell>
              <TableCell className="text-xs text-gray-600">{log.reponseStatut ?? '—'}</TableCell>
              <TableCell>
                {log.succes ? (
                  <Chip size="sm" color="success" variant="flat" startContent={<CheckCircle2 className="w-3 h-3" />}>
                    Succès
                  </Chip>
                ) : (
                  <Chip size="sm" color="danger" variant="flat" startContent={<XCircle className="w-3 h-3" />}>
                    Échec
                  </Chip>
                )}
              </TableCell>
              <TableCell>
                <Tooltip content="Voir le détail (requête / réponse)">
                  <Button isIconOnly size="sm" variant="light" onPress={() => openDetail(log)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <LogDetailsModal log={selected} isOpen={detail.isOpen} onOpenChange={detail.onOpenChange} />
    </div>
  );
}

// ─── Section principale ────────────────────────────────────────────────────────
export default function IntegrationSection({ restaurantId }: { restaurantId: string }) {
  const { data: cleApi, isLoading: cleLoading } = useCleApiQuery(restaurantId);
  const { data: webhooks, isLoading: webhooksLoading } = useWebhooksQuery(restaurantId);
  const form = useDisclosure();
  const suppr = useSupprimerWebhookMutation(restaurantId);
  const [editing, setEditing] = useState<IWebhook | null>(null);

  const apiKey = cleApi?.apiKey ?? '';

  function openAdd() {
    setEditing(null);
    form.onOpen();
  }
  function openEdit(w: IWebhook) {
    setEditing(w);
    form.onOpen();
  }

  const webhookList = useMemo(() => webhooks ?? [], [webhooks]);

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-primary mb-1">Intégration</h2>
      <p className="text-sm text-gray-500 mb-6">
        Connectez la solution de ce partenaire à Turbo : clé d&apos;accès, endpoint de création de course,
        webhooks de suivi et journal complet des échanges réseau.
      </p>

      {/* ── Clé API ── */}
      <div className="mb-8">
        <SubTitle icon={<KeyRound className="w-4 h-4" />}>Clé API</SubTitle>
        <p className="text-xs text-gray-500 mb-2">
          Le partenaire l&apos;envoie dans l&apos;en-tête <code className="text-primary">X-API-KEY</code> de chaque
          requête. À communiquer de façon sécurisée.
        </p>
        {cleLoading ? (
          <Spinner size="sm" />
        ) : apiKey ? (
          <Snippet symbol="" variant="bordered" className="w-full" codeString={apiKey}>
            <span className="font-mono text-xs break-all">{apiKey}</span>
          </Snippet>
        ) : (
          <p className="text-xs text-gray-400">Aucune clé API pour ce partenaire.</p>
        )}
      </div>

      {/* ── Endpoint entrant (documentation) ── */}
      <div className="mb-8">
        <SubTitle icon={<ArrowDownLeft className="w-4 h-4" />}>Endpoint de création de course (entrant)</SubTitle>
        <p className="text-xs text-gray-500 mb-2">
          Le partenaire crée une course en envoyant un <b>POST</b> à cette URL, avec sa clé API en en-tête.
        </p>
        <Snippet symbol="POST " variant="bordered" className="w-full" codeString={ENDPOINT_ENTRANT}>
          <span className="font-mono text-xs break-all">{ENDPOINT_ENTRANT}</span>
        </Snippet>
      </div>

      {/* ── Webhooks ── */}
      <div className="mb-8">
        <SubTitle
          icon={<Webhook className="w-4 h-4" />}
          action={
            <Button size="sm" color="primary" variant="flat" startContent={<Plus className="w-4 h-4" />} onPress={openAdd}>
              Ajouter
            </Button>
          }
        >
          Webhooks (sortant)
        </SubTitle>
        <p className="text-xs text-gray-500 mb-3">
          À chaque évènement de course (créée, récupérée, en route, livrée, annulée), Turbo envoie une notification
          <b> POST</b> à ces URL. Sans webhook configuré, aucune notification n&apos;est envoyée.
        </p>

        {webhooksLoading ? (
          <Spinner size="sm" />
        ) : webhookList.length === 0 ? (
          <div className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4 text-center">
            Aucun webhook configuré.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {webhookList.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-4 py-2.5 bg-gray-50/50"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-gray-700 truncate">{w.url}</p>
                  {w.description && <p className="text-xs text-gray-400 truncate">{w.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip content="Modifier">
                    <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(w)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Supprimer" color="danger">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      isLoading={suppr.isPending && suppr.variables === w.id}
                      onPress={() => suppr.mutate(w.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
        restaurantId={restaurantId}
        webhook={editing}
        isOpen={form.isOpen}
        onOpenChange={form.onOpenChange}
      />
    </section>
  );
}
