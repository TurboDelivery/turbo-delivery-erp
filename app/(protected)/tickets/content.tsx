'use client';

import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@heroui/react';
import { toast } from 'react-toastify';
import React, { useMemo, useState } from 'react';
import { Restaurant, User } from '@/types/models';
import { Ticket } from '@/types/bon-livraison.model';
import StatsSection from '@/components/tickets/stats-section';
import useTickets from '@/features/tickets/hooks/use-tickets';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import PriceListSelect from '@/components/tickets/price-list-select';
import TicketTabLivreur from '@/components/tickets/tabs/ticket-tab-livreur';
import { generatePdfTemplate, generateXlsTickets } from '@/features/tickets/utils/ticket-export.utils';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { CheckSquare, ChevronDown, File, FileText, Loader2, Package, Pen, Plus, Search, Trash, X } from 'lucide-react';

type ExportFormat = 'csv' | 'excel' | 'pdf';
interface ContentProps {
  restaurants: Restaurant[];
  profile: User | null;
}

export default function Content({ restaurants, profile }: ContentProps) {
  const {
    filters,
    setFilter,
    ticketsData,
    isLoading,
    infiniteState,
    mutations: { createBonLivraisonMutation, isCreatingBonLivraison, deleteBonLivraisonMutation, isDeletingBonLivraison, updateBonLivraisonMutation, isUpdatingBonLivraison },
    state: { handleEditRow, editingIds, handleCancelEditRow, editedTickets, setEditedTickets },
  } = useTickets();
  const { livreurs } = useLivreurs();

  const [exportOpen, setExportOpen] = useState(false);
  const [newTickets, setNewTickets] = useState<Ticket[]>([]);
  const [insertCount, setInsertCount] = useState<number>(1);
  const [insertLivreurId, setInsertLivreurId] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [insertRestaurantId, setInsertRestaurantId] = useState<string>('');
  const [insertDate, setInsertDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const observerTarget = useInfiniteScroll(infiniteState.fetchNextPage, infiniteState.hasNextPage);

  const activeTab = filters.tab;

  // Filtrage unique des livreurs valides
  const validLivreurs = useMemo(() => livreurs.filter((l) => l.prenoms && l.nom), [livreurs]);
  const livreurList = useMemo(() => validLivreurs.filter((l) => l.prenoms && l.nom).map((l) => ({ value: l.id, label: `${l.prenoms} ${l.nom}` })), [validLivreurs]);
  const restaurantList = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  const livreurOptions = useMemo(() => validLivreurs.map((l) => ({ value: l.id, label: `${l.prenoms} ${l.nom}` })), [validLivreurs]);
  const restaurantOptions = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  // ⚡ Définition des permissions selon le rôle
  const role = profile?.role?.libelle?.toLowerCase();
  const permissions = useMemo(() => {
    const isRestrictedRole = role === 'standard' || role === "centrale d'appel" || role === 'comptable';
    return {
      canCreate: true, // ils peuvent créer
      canUpdate: !isRestrictedRole, // interdiction de modifier si rôle restreint
      canDelete: !isRestrictedRole, // interdiction de supprimer si rôle restreint
      canSeeExternal: isRestrictedRole, // pour l'affichage des courses externes
    };
  }, [role]);

  const handleSelectAll = () => {
    if (selectedRows.size > 0 && ticketsData.length && ticketsData.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(ticketsData.map((t) => t.id)));
    }
  };

  const handleRowSelect = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleDeleteRows = async () => {
    if (selectedRows.size === 0) {
      toast.warning('Aucune ligne sélectionnée');
      return;
    }

    const confirm = window.confirm(`Supprimer ${selectedRows.size} ticket(s) ?`);
    if (!confirm) return;

    const idsToDelete = Array.from(selectedRows);

    try {
      for (const id of idsToDelete) {
        deleteBonLivraisonMutation(id);
      }

      setNewTickets((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
      setSelectedRows(new Set());
    } catch (error) {
      console.error(error);
      toast.error('La suppression a échoué — aucune modification appliquée');
    }
  };

  const handleExport = (format: ExportFormat) => {
    const dataToExport = ticketsData;

    if (dataToExport.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    if (format === 'csv') {
      const headers = ['Code Check', 'Livreur', 'Partner', 'Montant de Livraison', 'Montant de Commande', 'Commission', 'Date', 'Heure'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map((t) => [t.id, `"${t.livreur}"`, `"${t.restaurant}"`, t.montantLivraison, t.montantCommande, t.coutLivraison, t.date, t.heure].join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`${dataToExport.length} ligne(s) exportée(s) en CSV`);
    }
    else if (format === 'excel') {
      // Simulation d'export Excel (création d'un CSV compatible Excel)
      const xlsxData = generateXlsTickets(dataToExport);

      const blob = new Blob([xlsxData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();

      window.URL.revokeObjectURL(url);

      toast.success(`${dataToExport.length} ligne(s) exportée(s) en Excel`);
    }
    else if (format === 'pdf') {
      // Création d'un document HTML pour impression PDF
      const htmlContent = generatePdfTemplate(dataToExport);

      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        toast.error('Impossible d’ouvrir la fenêtre d’impression. Veuillez autoriser les pop-ups.');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        toast.success(`${dataToExport.length} ligne(s) prêtes pour export PDF. Utilisez "Enregistrer en PDF" dans la boîte de dialogue d'impression.`);
      }, 250);
    }
  };

  const handleInsert = () => {
    if (insertCount <= 0) return;

    const newTickets: Ticket[] = Array.from({ length: insertCount }).map(() => {
      const id = uuidv4();
      const livreurOption = livreurList.find((l) => l.value === insertLivreurId);
      const restaurantOption = restaurantList.find((r) => r.value === insertRestaurantId);

      return {
        id,
        reference: '',
        livreurId: insertLivreurId,
        livreur: livreurOption?.label ?? '',
        restaurantId: insertRestaurantId,
        restaurant: restaurantOption?.label ?? '',
        montantCommande: '',
        montantLivraison: '',
        coutLivraison: '',
        date: insertDate || new Date().toISOString().split('T')[0],
        heure: new Date().toLocaleTimeString('fr-FR'),
        isNew: true,
        isEditing: true,
        statut: 'TERMINE',
      };
    });

    setNewTickets((prev) => [...newTickets, ...prev]);
  };

  const handleSaveNewTicket = async (id: string) => {
    const ticket = newTickets.find((t) => t.id === id);
    if (!ticket) {
      console.warn(`Aucun ticket trouvé pour l'id: ${id}`);
      return;
    }

    createBonLivraisonMutation(ticket, {
      onSuccess: () => {
        setNewTickets((prev) => prev.filter((t) => t.id !== id));
      },
    });
  };

  const handleSaveRow = async (id: string) => {
    const ticket = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
    if (!ticket) return;

    updateBonLivraisonMutation(
      { ticketId: id, ticket },
      {
        onSuccess: () => {
          setEditedTickets((prev) => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
          });
          handleCancelEditRow(id);
        },
      },
    );
  };

  const calculateCommission = (restaurantId: string, montantCommande: number) => {
    const restaurant = restaurants.find((r) => r.id === restaurantId);
    if (!restaurant || !montantCommande) return 0;

    const commission = Number(restaurant.commission ?? 0);
    if (restaurant.typeCommission == 'POURCENTAGE') {
      const net = montantCommande * (commission / 100);
      return Number(net.toFixed(2));
    }

    return null;
  };

  const updateTicketField = (ticket: Ticket, field: keyof Ticket, value: string): Ticket => {
    const updatedTicket = { ...ticket, [field]: value };
    if (field === 'restaurantId') {
      const rest = restaurants.find((r) => r.id === value);
      if (rest) {
        updatedTicket.typeCommission = rest.typeCommission;
      }
    }
    // Recalcul automatique de la commission
    if (field === 'montantCommande' || field === 'restaurantId') {
      const montant = Number(updatedTicket.montantCommande || 0);
      const commission = calculateCommission(updatedTicket.restaurantId, montant);

      if (commission) {
        updatedTicket.coutLivraison = commission.toString();
      }
    }

    return updatedTicket;
  };

  const applyTicketPatch = (ticket: Ticket, patch: Partial<Ticket>, restaurants: Restaurant[]): Ticket => {
    const updated: Ticket = { ...ticket, ...patch };

    if (patch.restaurantId) {
      const rest = restaurants.find((r) => r.id === patch.restaurantId);
      if (rest) {
        updated.typeCommission = rest.typeCommission;
      }
    }

    const shouldRecalculateCommission = patch.montantCommande !== undefined || patch.restaurantId !== undefined;

    if (shouldRecalculateCommission) {
      const montant = Number(updated.montantCommande || 0);
      const commission = calculateCommission(updated.restaurantId, montant);

      if (commission !== null && commission !== undefined) {
        updated.coutLivraison = commission.toString();
      }
    }

    return updated;
  };

  const updateTicket = (id: string, patch: Partial<Ticket>) => {
    const isNewTicket = newTickets.some((t) => t.id === id);

    if (isNewTicket) {
      setNewTickets((prev) => prev.map((t) => (t.id === id ? applyTicketPatch(t, patch, restaurants) : t)));
      return;
    }

    setEditedTickets((prev) => {
      const base = prev.get(id) ?? ticketsData.find((t) => t.id === id);

      if (!base) return prev;

      const updated = applyTicketPatch(base, patch, restaurants);
      return new Map(prev).set(id, updated);
    });
  };

  const handleTicketChange = (id: string, field: keyof Ticket, value: string) => {
    const isNewTicket = newTickets.some((t) => t.id === id);

    if (isNewTicket) {
      setNewTickets((prev) => prev.map((t) => (t.id === id ? updateTicketField(t, field, value) : t)));
    } else {
      const currentTicket = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
      if (currentTicket) {
        const updated = updateTicketField(currentTicket, field, value);
        setEditedTickets((prev) => new Map(prev).set(id, updated));
      }
    }
  };

  const getTicketValue = (ticket: Ticket) => {
    return editedTickets.get(ticket.id) ?? ticket;
  };

  const handleCancelNewTicket = (id: string) => setNewTickets((prev) => prev.filter((t) => t.id != id));

  return (
    <div className="min-h-screen p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Mes tickets</h1>
            <p className="text-xs sm:text-sm text-gray-500">Système de suivi des tickets de livraison</p>
          </div>
        </div>
      </div>
      <div className="w-full my-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Restaurant */}
          <div className="w-full">
            <label className="block text-xs mb-1">Restaurant</label>
            <Select
              options={restaurantList}
              value={restaurantList.find((o) => o.value === insertRestaurantId) ?? null}
              onChange={(opt) => setInsertRestaurantId(opt?.value ?? '')}
              placeholder="Restaurant"
              isClearable
              className="text-xs w-full"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '36px',
                  height: '36px',
                  width: '100%',
                }),
                valueContainer: (base) => ({
                  ...base,
                  height: '36px',
                  padding: '0 8px',
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: '36px',
                }),
              }}
            />
          </div>

          {/* Livreur */}
          <div className="w-full">
            <label className="block text-xs mb-1">Livreur</label>
            <Select
              options={livreurList}
              value={livreurList.find((o) => o.value === insertLivreurId) ?? null}
              onChange={(opt) => setInsertLivreurId(opt?.value ?? '')}
              placeholder="Livreur"
              isClearable
              className="text-xs w-full"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, minHeight: '36px', height: '36px', width: '100%' }),
                valueContainer: (base) => ({ ...base, height: '36px', padding: '0 8px' }),
                indicatorsContainer: (base) => ({ ...base, height: '36px' }),
              }}
            />
          </div>

          {/* Date */}
          <div className="w-full">
            <label className="block text-xs mb-1">Date</label>
            <input type="date" value={insertDate} onChange={(e) => setInsertDate(e.target.value)} className="h-9 w-full px-2 text-xs border border-gray-300 rounded-md" />
          </div>

          {/* Nb lignes */}
          <div className="w-full">
            <label className="block text-xs mb-1">Nb lignes</label>
            <input
              type="number"
              min={1}
              value={insertCount}
              onChange={(e) => setInsertCount(Number(e.target.value))}
              className="h-9 w-full px-2 text-xs text-center border border-gray-300 rounded-md"
            />
          </div>

          {/* Bouton */}
          <div className="w-full">
            <label className="block text-xs mb-1 invisible">Action</label>
            <button disabled={!permissions.canCreate} onClick={handleInsert} className="h-9 w-full bg-green-500 text-white rounded flex items-center justify-center gap-1 text-xs hover:bg-green-600">
              <Plus className="w-3 h-3" /> Insérer
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsSection />

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setFilter('tab', 'tous')}
            className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'tous' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}
          >
            Tous les Tickets
          </button>
          <button
            onClick={() => setFilter('tab', 'livreur')}
            className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'livreur' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}
          >
            Par Livreur
          </button>
        </div>

        {activeTab === 'tous' && (
          <div className="p-4">
            {/* Search and Filters */}
            <div className="mb-6">
              <Input className="mb-4" startContent={<Search />} value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Code check" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Filtrer par Livreur</label>
                  <Select
                    options={livreurOptions}
                    value={livreurOptions.find((o) => o.value === filters.livreurId) ?? null}
                    onChange={(opt) => setFilter('livreurId', opt?.value ?? '')}
                    placeholder="Tous les livreurs"
                    isClearable
                    className="text-xs"
                    classNamePrefix="react-select"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Filtrer par Restaurant</label>
                  <Select
                    options={restaurantOptions}
                    value={restaurantOptions.find((o) => o.value === filters.restaurantId) ?? null}
                    onChange={(opt) => setFilter('restaurantId', opt?.value ?? '')}
                    placeholder="Tous les restaurants"
                    isClearable
                    className="text-xs"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium mb-1">Filtrer par Date</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.debut.toISOString().split('T')[0]}
                      onChange={(e) => setFilter('debut', e.target.value)}
                      className="flex-1 h-9 p-2 border border-gray-200 rounded text-xs outline-none"
                    />
                    <input
                      type="date"
                      value={filters.fin.toISOString().split('T')[0]}
                      onChange={(e) => setFilter('fin', e.target.value)}
                      className="flex-1 h-9 p-2 border border-gray-200 rounded text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">Total: {infiniteState.totalItems} ticket(s)</p>

            {/* Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="max-h-[420px] overflow-y-auto border border-gray-200 rounded-lg">
                <div className="inline-block min-w-full align-middle">
                  <div className="w-full overflow-x-auto min-h-[220px]">
                    <table className="min-w-[1600px] border border-gray-200">
                      <thead className="bg-orange-50 sticky top-0 z-2">
                        <tr>
                          <th className="p-2 sm:p-3 text-left sticky left-0 z-2">
                            <input type="checkbox" checked={selectedRows.size === ticketsData.length && ticketsData.length > 0} onChange={handleSelectAll} className="w-4 h-4" />
                          </th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Code Check</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap min-w-[260px]">Livreur</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap min-w-[320px]">Partner</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap min-w-[260px]">Zone</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Montant de Livraison</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Montant de Commande</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Commission</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Date</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Heure</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">
                            <span className="sr-only">Action</span>
                          </th>
                        </tr>
                      </thead>
                      {!isLoading && (
                        <tbody>
                          {newTickets.map((ticket) => (
                            <tr key={ticket.id} className={`${selectedRows.has(ticket.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                              {/* Checkbox */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 sticky left-0 bg-inherit z-2">
                                <input type="checkbox" disabled checked={selectedRows.has(ticket.id)} onChange={() => handleRowSelect(ticket.id)} className="w-4 h-4" />
                              </td>

                              {/* Numéro */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                <input
                                  type="text"
                                  value={ticket.code}
                                  onChange={(e) => {
                                    const newCode = e.target.value;
                                    setNewTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, code: newCode } : t)));
                                  }}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                  placeholder="Code CHECKissa"
                                />
                              </td>

                              {/* Livreur */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[260px]">
                                <Select
                                  options={livreurList}
                                  value={livreurList.find((o) => o.value === ticket.livreurId) ?? null}
                                  onChange={(option) => handleTicketChange(ticket.id, 'livreurId', option?.value ?? '')}
                                  placeholder="Sélectionner un livreur"
                                  isClearable
                                  className="text-xs rounded px-2 py-1"
                                  classNamePrefix="react-select"
                                />
                              </td>

                              {/* Restaurant */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[320px]">
                                <Select
                                  options={restaurantList}
                                  value={restaurantList.find((o) => o.value === ticket.restaurantId) ?? null}
                                  onChange={(option) => handleTicketChange(ticket.id, 'restaurantId', option?.value ?? '')}
                                  placeholder="Sélectionner un restaurants"
                                  isClearable
                                  className="text-xs rounded px-2 py-1"
                                  classNamePrefix="react-select"
                                />
                              </td>
                              {/* Zone (PriceList) */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[320px]">
                                <PriceListSelect ticketId={ticket.id} restaurantID={ticket.restaurantId} handleChange={updateTicket} />
                              </td>

                              {/* Montant Livraison */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={ticket.montantLivraison}
                                  onChange={(e) => handleTicketChange(ticket.id, 'montantLivraison', e.target.value)}
                                  placeholder="0 CFA"
                                  disabled={!ticket.restaurantId}
                                  className={`w-full h-9 px-2 py-1 text-xs border rounded ${!ticket.restaurantId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                              </td>

                              {/* Montant Commande */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                <input
                                  value={ticket.montantCommande}
                                  onChange={(e) => handleTicketChange(ticket.id, 'montantCommande', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                  placeholder="0 CFA"
                                />
                              </td>

                              {/* Commission */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                <input type="number" value={ticket.coutLivraison} readOnly placeholder="0 CFA" className="w-full h-9 px-2 py-1 text-xs text-right border border-gray-300 rounded" />
                              </td>

                              {/* Date */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                <input
                                  type="date"
                                  value={ticket.date}
                                  onChange={(e) => handleTicketChange(ticket.id, 'date', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                />
                              </td>

                              {/* Heure */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                <input
                                  type="time"
                                  value={ticket.heure}
                                  onChange={(e) => handleTicketChange(ticket.id, 'heure', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                />
                              </td>

                              {/* Actions */}
                              <td className="px-2 py-1 border-t border-b border-gray-200 whitespace-nowrap">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveNewTicket(ticket.id)}
                                    disabled={isCreatingBonLivraison}
                                    className="px-2 py-1 h-9 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center"
                                  >
                                    {isCreatingBonLivraison && <Loader2 className="size-4 animate-spin" />}
                                    {!isCreatingBonLivraison && <CheckSquare className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleCancelNewTicket(ticket.id)}
                                    className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {ticketsData.map((ticket) => {
                            const displayTicket = getTicketValue(ticket);
                            return (
                              <tr key={displayTicket.id} className={`${selectedRows.has(displayTicket.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                {/* Checkbox */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 sticky left-0 bg-inherit z-2">
                                  <input type="checkbox" checked={selectedRows.has(displayTicket.id)} onChange={() => handleRowSelect(displayTicket.id)} className="w-4 h-4" />
                                </td>

                                {/* Numéro */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                  {editingIds.has(displayTicket.id) ? (
                                    <input
                                      type="text"
                                      value={displayTicket.code}
                                      onChange={(e) => {
                                        const newCode = e.target.value;
                                        handleTicketChange(displayTicket.id, 'code', newCode);
                                      }}
                                      className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                      placeholder="Code CHECK"
                                    />
                                  ) : (
                                    displayTicket.code
                                  )}
                                </td>

                                {/* Livreur */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[260px]">
                                  {displayTicket.isNew || editingIds.has(displayTicket.id) ? (
                                    <Select
                                      options={livreurList}
                                      value={livreurList.find((o) => o.value === displayTicket.livreurId) ?? null}
                                      onChange={(option) => handleTicketChange(displayTicket.id, 'livreurId', option?.value ?? '')}
                                      placeholder="Sélectionner un livreur"
                                      isClearable
                                      className="text-xs rounded px-2 py-1"
                                      classNamePrefix="react-select"
                                    />
                                  ) : (
                                    displayTicket.livreur
                                  )}
                                </td>

                                {/* Restaurant */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[320px]">
                                  {displayTicket.isNew || editingIds.has(displayTicket.id) ? (
                                    <Select
                                      options={restaurantList}
                                      value={restaurantList.find((o) => o.value === displayTicket.restaurantId) ?? null}
                                      onChange={(option) => handleTicketChange(displayTicket.id, 'restaurantId', option?.value ?? '')}
                                      placeholder="Sélectionner un restaurant"
                                      isClearable
                                      className="text-xs rounded px-2 py-1"
                                      classNamePrefix="react-select"
                                    />
                                  ) : (
                                    displayTicket.restaurant
                                  )}
                                </td>

                                {/* Zone (PriceList) */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                  {displayTicket.isNew || editingIds.has(displayTicket.id) ? (
                                    <PriceListSelect ticketId={displayTicket.id} restaurantID={displayTicket.restaurantId} handleChange={updateTicket} />
                                  ) : (
                                    <span>{displayTicket.nomZone ?? 'Inconnue'}</span>
                                  )}
                                </td>

                                {/* Montant Livraison */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                  {displayTicket.isNew || editingIds.has(displayTicket.id) ? (
                                    <input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={displayTicket.montantLivraison}
                                      onChange={(e) => handleTicketChange(displayTicket.id, 'montantLivraison', e.target.value)}
                                      placeholder="0 CFA"
                                      disabled={!displayTicket.restaurantId}
                                      className={`w-full h-9 px-2 py-1 text-xs border rounded ${!displayTicket.restaurantId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                                    />
                                  ) : (
                                    formatCFA(displayTicket.montantLivraison)
                                  )}
                                </td>

                                {/* Montant Commande */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                  {displayTicket.isNew || editingIds.has(displayTicket.id) ? (
                                    <input
                                      value={displayTicket.montantCommande}
                                      onChange={(e) => handleTicketChange(displayTicket.id, 'montantCommande', e.target.value)}
                                      className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                      placeholder="0 CFA"
                                    />
                                  ) : (
                                    formatCFA(displayTicket.montantCommande)
                                  )}
                                </td>

                                {/* Commission */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                  {displayTicket.isNew || editingIds.has(displayTicket.id) ? (
                                    <input
                                      type="number"
                                      value={displayTicket.coutLivraison}
                                      readOnly
                                      placeholder="0 CFA"
                                      className="w-full h-9 px-2 py-1 text-xs text-right border border-gray-300 rounded"
                                    />
                                  ) : (
                                    formatCFA(displayTicket?.commission ?? 0)
                                  )}
                                </td>

                                {/* Date */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                  {displayTicket.isNew || editingIds.has(displayTicket.id) ? (
                                    <input
                                      type="date"
                                      value={displayTicket.date}
                                      onChange={(e) => handleTicketChange(displayTicket.id, 'date', e.target.value)}
                                      className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                    />
                                  ) : (
                                    formatDateFR(displayTicket.date)
                                  )}
                                </td>

                                {/* Heure */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                  {displayTicket.isNew || editingIds.has(displayTicket.id) ? (
                                    <input
                                      type="time"
                                      value={displayTicket.heure}
                                      onChange={(e) => handleTicketChange(displayTicket.id, 'heure', e.target.value)}
                                      className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                    />
                                  ) : (
                                    formatHoursMinutes(displayTicket.heure)
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-2 py-1 border-t border-b border-gray-200 whitespace-nowrap">
                                  {displayTicket.isNew ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveNewTicket(displayTicket.id)}
                                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center"
                                      >
                                        <CheckSquare className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleCancelEditRow(displayTicket.id)}
                                        className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : editingIds.has(displayTicket.id) ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveRow(displayTicket.id)}
                                        disabled={!permissions.canUpdate || isUpdatingBonLivraison}
                                        className={`px-2 py-1 h-9 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center ${!permissions.canUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        {isUpdatingBonLivraison && <Loader2 className="size-4 animate-spin" />}
                                        {!isUpdatingBonLivraison && <CheckSquare className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={() => handleCancelEditRow(displayTicket.id)}
                                        className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    permissions.canUpdate && (
                                      <button
                                        onClick={() => handleEditRow(displayTicket.id)}
                                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center"
                                      >
                                        <Pen className="w-4 h-4" />
                                      </button>
                                    )
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="h-0.5" ref={observerTarget}>
                            {infiniteState.isFetchingNextPage && (
                              <td colSpan={10} className="text-xs text-gray-500 w-full text-center">
                                Chargement des données...
                              </td>
                            )}
                          </tr>
                        </tbody>
                      )}
                      {isLoading && (
                        <tbody>
                          <tr>
                            <td colSpan={10} className="p-4 text-center text-gray-500">
                              Chargement des tickets...
                            </td>
                          </tr>
                        </tbody>
                      )}
                      {!isLoading && ticketsData.length === 0 && (
                        <tbody>
                          <tr>
                            <td colSpan={10} className="p-4 text-center text-gray-500">
                              Aucun ticket trouvé.
                            </td>
                          </tr>
                        </tbody>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'livreur' && <TicketTabLivreur />}
      </div>

      {activeTab !== 'livreur' && (
        <div className="px-1 py-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={handleSelectAll} className="px-2  py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1">
              <CheckSquare className="w-3 h-3" /> Sélectionner
            </button>
            <button
              onClick={handleDeleteRows}
              disabled={!permissions.canDelete || selectedRows.size === 0 || isDeletingBonLivraison}
              className={`px-2 py-1 border rounded-full text-xs sm:text-sm flex items-center gap-1 ${!permissions.canDelete || selectedRows.size === 0 ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-red-300 text-red-500 hover:bg-red-50'}`}
            >
              {isDeletingBonLivraison && <Loader2 className="size-4 animate-spin" />}
              {!isDeletingBonLivraison && <Trash className="w-3 h-3" />} Supprimer
            </button>

            {selectedRows.size > 0 && (
              <button onClick={() => setSelectedRows(new Set())} className="px-2 py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1">
                <X className="w-3 h-3" /> Désélectionner
              </button>
            )}

            {/* Spacer pour pousser les boutons à droite */}
            <div className="ml-auto flex gap-2 items-center">
              {/* Dropdown Export */}
              <div className="relative">
                <button onClick={() => setExportOpen((v) => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs sm:text-sm hover:bg-green-600">
                  <FileText className="w-3 h-3" /> Exporter
                  <ChevronDown className="w-4 h-4" />
                </button>
                {exportOpen && (
                  <ul className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <li>
                      <button
                        onClick={() => {
                          handleExport('pdf');
                          setExportOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2"
                      >
                        <File className="w-3 h-3" /> Exporter la sélection en PDF
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handleExport('excel');
                          setExportOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2"
                      >
                        <File className="w-3 h-3" /> Exporter la sélection en Excel
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handleExport('csv');
                          setExportOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2"
                      >
                        <File className="w-3 h-3" /> Exporter la sélection en CSV
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
