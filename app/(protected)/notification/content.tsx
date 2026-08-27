'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Pagination,
  Spinner,
  Chip,
} from '@/components/heroui';
import { Bell, Search, CheckCheck, ExternalLink } from 'lucide-react';
import { CardHeader } from '@/components/commons/card-header';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { PageWrapper } from '@/components/commons/page-wrapper';
import EtatErreur from '@/components/commons/EtatErreur';
import {
  useNotificationsListQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type NotificationVm,
} from '@/features/notifications';

/**
 * Page /notification refactorée V44 :
 * - TanStack Query (au lieu du fetch SSR figé)
 * - Filtres : recherche texte, statut (lu/non-lu/tous), type
 * - Pagination client-side (les notifs sont <= 100 typiquement)
 * - Mark-as-read par card (click sur le bouton ✓)
 * - Mark-all-as-read globale (CTA en header)
 */
const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { key: 'all', label: 'Toutes' },
  { key: 'unread', label: 'Non lues' },
  { key: 'read', label: 'Lues' },
];

// Tous les types possibles (alignés sur l'enum backend TypeNotification V44)
const TYPE_GROUPS = [
  { key: 'all', label: 'Tous types' },
  { key: 'TICKET_AUTHENTIFIE', label: 'Tickets — à valider V1' },
  { key: 'TICKET_V1_VALIDE', label: 'Tickets — à valider V2' },
  { key: 'TICKET_V2_VALIDE', label: 'Tickets — validés V2' },
  { key: 'CHARGE_A_VISER_DGA', label: 'Dépenses — à viser DGA' },
  { key: 'CHARGE_A_APPROUVER_DG', label: 'Dépenses — à approuver DG' },
  { key: 'CHARGE_A_DECAISSER', label: 'Dépenses — à décaisser' },
  { key: 'CHARGE_DECAISSEE', label: 'Dépenses — décaissées' },
  { key: 'CHARGE_REJETEE', label: 'Dépenses — rejetées' },
  { key: 'NOUVELLE_COURSE', label: 'Livraison — nouvelle course' },
  { key: 'ACCEPTATION_COURSE', label: 'Livraison — course acceptée' },
];

function prettyType(type: string): string {
  return type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function NotificationContent() {
  const session = useSession();
  const userId = session.data?.user?.id;

  const { data = [], isLoading, isFetching, isError, refetch } = useNotificationsListQuery(userId);
  const markOneMut = useMarkAsReadMutation(userId);
  const markAllMut = useMarkAllAsReadMutation(userId);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [type, setType] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = data.filter((n: NotificationVm) => n.titre || n.message);
    if (status === 'unread') list = list.filter((n) => !n.lu);
    if (status === 'read') list = list.filter((n) => n.lu);
    if (type !== 'all') list = list.filter((n) => n.type === type);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          (n.titre || '').toLowerCase().includes(q) ||
          (n.message || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, search, status, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const unreadCount = data.filter((n) => !n.lu).length;

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <CardHeader title="Liste des notifications" />
        <div className="flex items-center gap-3">
          <Chip color={unreadCount > 0 ? 'danger' : 'default'} variant="flat">
            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
          </Chip>
          <Button
            size="sm"
            color="primary"
            variant="bordered"
            startContent={<CheckCheck className="w-4 h-4" />}
            onPress={() => markAllMut.mutate()}
            isDisabled={unreadCount === 0 || markAllMut.isPending}
            isLoading={markAllMut.isPending}
          >
            Tout marquer lu
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            className="flex-1 min-w-[200px]"
            placeholder="Rechercher dans le titre ou le message..."
            startContent={<Search className="text-gray-400 w-4 h-4 shrink-0" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            variant="bordered"
            size="sm"
          />
          <Select
            label="Statut"
            className="w-full sm:w-[180px]"
            size="sm"
            variant="bordered"
            selectedKeys={new Set([status])}
            onSelectionChange={(keys) => {
              const k = Array.from(keys as Set<string>)[0] as 'all' | 'unread' | 'read';
              setStatus(k || 'all');
              setPage(1);
            }}
            disallowEmptySelection
          >
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.key}>{o.label}</SelectItem>
            ))}
          </Select>
          <Select
            label="Type"
            className="w-full sm:w-[260px]"
            size="sm"
            variant="bordered"
            selectedKeys={new Set([type])}
            onSelectionChange={(keys) => {
              const k = Array.from(keys as Set<string>)[0];
              setType(k || 'all');
              setPage(1);
            }}
            disallowEmptySelection
          >
            {TYPE_GROUPS.map((o) => (
              <SelectItem key={o.key}>{o.label}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Liste. `data = []` par defaut : un echec produisait une liste vide, donc
          « Aucune notification » — le message exact d'une boite reellement vide.
          L'erreur ouvre desormais la chaine. */}
      {isError ? (
        <EtatErreur quoi="les notifications" onReessayer={() => refetch()} enCours={isFetching} />
      ) : isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner color="primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-primary font-bold text-xl">
          <EmptyDataTable title="Aucune notification" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map((notification) => (
              <Card key={notification.id} className={notification.lu ? '' : 'border-l-4 border-l-red-500'}>
                <CardBody className="p-2 w-full hover:bg-primary/5">
                  <div className="flex items-center px-4 py-2">
                    <div className="flex w-full justify-between ml-2 flex-wrap sm:flex-nowrap gap-3">
                      <div className="h-10 w-10 rounded-full mr-3 flex items-center justify-center bg-red-50 text-red-500 shrink-0">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className={notification.lu ? 'font-medium' : 'font-bold'}>
                          {notification.titre}
                        </h6>
                        {notification.message && (
                          <p className={`text-sm text-gray-600 ${!notification.lu && 'font-medium'}`}>
                            {notification.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {notification.lien && (
                            <Link href={notification.lien}>
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                endContent={<ExternalLink className="w-3 h-3" />}
                              >
                                {prettyType(notification.type)}
                              </Button>
                            </Link>
                          )}
                          <Link href={`/notification/${notification.id}`} className="text-xs text-blue-500 hover:underline">
                            Détail
                          </Link>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-gray-500">{notification.tempsPasse}</span>
                        {!notification.lu && (
                          <Button
                            size="sm"
                            variant="light"
                            color="success"
                            startContent={<CheckCheck className="w-3 h-3" />}
                            onPress={() => markOneMut.mutate({ notificationId: notification.id })}
                          >
                            Lu
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setPage}
                color="primary"
                showControls
                variant="bordered"
              />
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-3">
            {filtered.length} notification{filtered.length > 1 ? 's' : ''}
            {filtered.length !== data.length && ` (filtrées sur ${data.length})`}
          </p>
        </>
      )}
    </PageWrapper>
  );
}
