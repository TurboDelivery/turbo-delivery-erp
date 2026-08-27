'use client';

import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconListCheck from '@/components/icon/icon-list-check';
import IconSearch from '@/components/icon/icon-search';
import React, { useState } from 'react';
import { User } from '@/types/models';
import { PaginatedResponse } from '@/types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import UsersAdd from './users-add';
import UsersTools from './users-tools';
import UsersEmailPrimaryToggle from './users-email-primary-toggle';
import { Chip } from '@/components/heroui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PaginationBlock from '@/components/pagination-block';
import { Can } from '@/components/auth/Can';

const UsersList = ({ users }: { users: PaginatedResponse<User> | null }) => {
  const [value, setValue] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  // Filtrer les utilisateurs selon la recherche
  const filteredItems = users?.content.filter((user) => user.nom.toLowerCase().includes(search.toLowerCase()) || user.prenoms.toLowerCase().includes(search.toLowerCase())) || [];

  // Calculer les informations de pagination pour les données filtrées
  const totalFilteredItems = filteredItems.length;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFilteredItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary">Utilisateurs : {totalFilteredItems} (Page {currentPage + 1} sur {totalPages})</h2>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex gap-3">
            <Can I="create" a="Utilisateur">
              <div>
                <UsersAdd />
              </div>
            </Can>
            <div>
              <button type="button" className={`btn btn-outline-primary p-2 ${value === 'list' && 'bg-primary text-white'}`} onClick={() => setValue('list')}>
                <IconListCheck />
              </button>
            </div>
            <div>
              <button type="button" className={`btn btn-outline-primary p-2 ${value === 'grid' && 'bg-primary text-white'}`} onClick={() => setValue('grid')}>
                <IconLayoutGrid />
              </button>
            </div>
          </div>
          <div className="relative">
            <input type="text" placeholder="Rechercher des utilisateurs" className="peer form-input py-2 ltr:pr-11 rtl:pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]" disabled>
              <IconSearch className="mx-auto" />
            </button>
          </div>
        </div>
      </div>
      {value === 'list' && (
        <div className="mt-5 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nom d&apos;utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                {/* 2026-05 — Bascule "Reçoit les emails de notifs". Permet de
                    désigner 1-2 destinataires email primaires par rôle pour
                    éviter de saturer le quota SMTP Hostinger 50/h. L'in-app
                    est toujours diffusée à tous les users du rôle. */}
                <TableHead className="text-center">Emails de notif</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary text-sm font-semibold text-white flex items-center justify-center">{user.nom[0]}</div>
                      <div>{`${user.nom} ${user.prenoms}`}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role.libelle}</TableCell>
                  <TableCell>{user.status === 1 ? <Chip color="success">Actif</Chip> : <Chip color="warning">Inactif</Chip>}</TableCell>
                  <TableCell className="text-center">
                    <UsersEmailPrimaryToggle user={user} />
                  </TableCell>
                  <TableCell>
                    <UsersTools user={user} value="list" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile — une carte par utilisateur (remplace le tableau « liste » < md) */}
      {value === 'list' && (
        <div className="mt-5 space-y-3 md:hidden">
          {paginatedItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Aucun utilisateur trouvé</p>
          ) : (
            paginatedItems.map((user: User) => (
              <div key={user.id} className="space-y-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{user.nom[0]}</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{`${user.nom} ${user.prenoms}`}</p>
                      <p className="truncate text-xs text-gray-500">{user.role.libelle}</p>
                    </div>
                  </div>
                  {user.status === 1 ? <Chip color="success">Actif</Chip> : <Chip color="warning">Inactif</Chip>}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Email</span>
                  <span className="truncate text-right text-sm text-gray-700">{user.email}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Nom d&apos;utilisateur</span>
                  <span className="truncate text-right text-sm text-gray-700">{user.username}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Emails de notif</span>
                  <UsersEmailPrimaryToggle user={user} />
                </div>

                <div className="flex justify-end pt-1">
                  <UsersTools user={user} value="list" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {value === 'grid' && (
        <div className="mt-5 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {paginatedItems.map((user: User) => {
            return (
              <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={user.id}>
                <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
                  <div className="rounded-t-md bg-white/40 bg-[url('/assets/images/notification-bg.png')] bg-cover bg-center p-6 pb-0">
                    <div className="mx-auto h-20 w-20 rounded-full bg-primary text-3xl font-bold text-white flex items-center justify-center">{user.nom[0]}</div>
                  </div>
                  <div className="relative -mt-10 px-6 pb-24">
                    <div className="rounded-md bg-white px-2 py-4 shadow-md dark:bg-gray-900">
                      <div className="text-xl">{`${user.nom} ${user.prenoms}`}</div>
                      <div className="text-white-dark">{user.role.libelle}</div>
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <div className="flex-auto">
                          <div className="text-info">{user.email}</div>
                          <div>Email</div>
                        </div>
                        <div className="flex-auto">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">Département :</div>
                          <div className="">{user.departement || '-'}</div>
                        </div>
                        <div className="flex-auto">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">Salaire :</div>
                          <div className="">{user.salaire ? formatCFA(user.salaire) : '-'}</div>
                        </div>
                        <div className="flex-auto">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">Date d&apos;entrée :</div>
                          <div className="">{user.dateEntree ? new Date(user.dateEntree).toLocaleDateString('fr-FR') : '-'}</div>
                        </div>
                      </div>
                      <div className="mt-4"></div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                      <div className="flex items-center">
                        <div className="flex-none ltr:mr-2 rtl:ml-2">Nom d&apos;utilisateur :</div>
                        <div className="">{user.username}</div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-none ltr:mr-2 rtl:ml-2">Statut :</div>
                        <div className="">{user.status === 1 ? <Chip color="success">Actif</Chip> : <Chip color="warning">Inactif</Chip>}</div>
                      </div>
                    </div>
                  </div>
                  <UsersTools user={user} value="grid" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <PaginationBlock 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default UsersList;
