'use client';

import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconListCheck from '@/components/icon/icon-list-check';
import IconSearch from '@/components/icon/icon-search';
import React, { useState } from 'react';
import { User } from '@/types/models';
import { PaginatedResponse } from '@/types';
import { formatCfa } from '@/utils/format.utils';
import UsersAdd from './users-add';
import UsersTools from './users-tools';
import { Chip } from '@heroui/react';
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
        <h2 className="text-xl">Utilisateurs : {totalFilteredItems} (Page {currentPage + 1} sur {totalPages})</h2>
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
        <div className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nom d&apos;utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
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
                  <TableCell>
                    <UsersTools user={user} value="list" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                          <div className="">{user.salaire ? formatCfa(user.salaire) : '-'}</div>
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
