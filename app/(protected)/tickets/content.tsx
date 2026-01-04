'use client';
import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { DeliveryMan, Restaurant } from '@/types/models';
import React, { useMemo, useState } from 'react';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { LivreurStat, Ticket } from '@/types/bon-livraison.model';
import { createBonLivraison, deleteBonLivraison, updateBonLivraison } from '@/src/actions/bon-commande.action';
import { CheckSquare, ChevronDown, File, FileText, Package, Pen, Plus, Search, Trash, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { isAfter } from 'date-fns';
import useTickets from '@/features/tickets/hooks/useTickets';
import { useCreateBonLivraison } from '@/features/tickets/tickets.mutation';

type ExportFormat = 'csv' | 'excel' | 'pdf';
interface ContentProps {
  restaurants: Restaurant[];
  livreurs: DeliveryMan[];
}

export default function Content({ restaurants, livreurs }: ContentProps) {
  const router = useRouter();
  const { filters, setFilter, ticketsData } = useTickets();
  const [exportOpen, setExportOpen] = useState(false);
  const [newTickets, setNewTickets] = useState<Ticket[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [insertCount, setInsertCount] = useState<number>(1);
  const [selectedLivreur, setSelectedLivreur] = useState('');
  const [insertLivreurId, setInsertLivreurId] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [insertRestaurantId, setInsertRestaurantId] = useState<string>('');
  const [insertDate, setInsertDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const { mutateAsync: createBonLivraisonMutate, isPending: isCreating } = useCreateBonLivraison();

  const activeTab = filters.tab;
  console.log(ticketsData);
  // Filtrage unique des livreurs valides
  const validLivreurs = useMemo(() => livreurs.filter((l) => l.prenoms && l.nom), [livreurs]);
  const livreurList = useMemo(() => validLivreurs.filter((l) => l.prenoms && l.nom).map((l) => ({ value: l.id, label: `${l.prenoms} ${l.nom}` })), [validLivreurs]);
  const restaurantList = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filters.livreurId && ticket.livreur !== filters.livreurId) return false;
      if (filters.restaurantId && ticket.restaurant !== filters.restaurantId) return false;
      if (filters.debut && isAfter(ticket.date, filters.debut)) return false;
      if (filters.fin && isAfter(ticket.date, filters.fin)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!ticket.id.toLowerCase().includes(q) && !ticket.livreur.toLowerCase().includes(q) && !ticket.restaurant.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, filters]);

  const livreurStats = useMemo<Record<string, LivreurStat>>(() => {
    const stats: Record<string, LivreurStat> = {};

    ticketsData.forEach((ticket) => {
      if (!stats[ticket.livreur]) {
        stats[ticket.livreur] = {
          count: 0,
          totalCommandes: 0,
          totalLivraisons: 0,
          commission: 0,
          tickets: [],
        };
      }

      stats[ticket.livreur].count++;
      stats[ticket.livreur].totalCommandes += Number(ticket.montantCommande.replace(/\D/g, ''));
      stats[ticket.livreur].totalLivraisons += Number(ticket.montantLivraison.replace(/\D/g, ''));
      stats[ticket.livreur].commission += Number(ticket.coutLivraison.replace(/\D/g, ''));
      stats[ticket.livreur].tickets.push(ticket);
    });

    return stats;
  }, [ticketsData]);

  const filteredLivreurTickets = useMemo(() => {
    if (!selectedLivreur) return [];
    return livreurStats[selectedLivreur]?.tickets || [];
  }, [selectedLivreur, livreurStats]);

  const totalRevenu = useMemo(() => filteredTickets.reduce((sum, t) => sum + Number(t.montantLivraison ? t.montantLivraison.toString().replace(/[^0-9]/g, '') : 0), 0), [filteredTickets]);
  const livreurOptions = useMemo(() => validLivreurs.map((l) => ({ value: l.id, label: `${l.prenoms} ${l.nom}` })), [validLivreurs]);
  const restaurantOptions = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  const handleSelectAll = () => {
    if (selectedRows.size === filteredTickets.length && filteredTickets.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredTickets.map((t) => t.id)));
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

    const ids = Array.from(selectedRows);

    try {
      for (const id of ids) {
        await deleteBonLivraison(id);
      }

      // UI sync
      setTickets((prev) => prev.filter((t) => !selectedRows.has(t.id)));
      setNewTickets((prev) => prev.filter((t) => !selectedRows.has(t.id)));
      setSelectedRows(new Set());

      toast.success('Suppression réussie');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = (format: ExportFormat) => {
    const dataToExport = activeTab === 'tous' ? filteredTickets : filteredLivreurTickets;

    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter');
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
      alert(`${dataToExport.length} ligne(s) exportée(s) en CSV`);
    } else if (format === 'excel') {
      // Simulation d'export Excel (création d'un CSV compatible Excel)
      const headers = ['Code Check', 'Livreur', 'Partner', 'Montant de Livraison', 'Montant de Commande', 'Commission', 'Date', 'Heure'];
      const csvContent = [headers.join('\t'), ...dataToExport.map((t) => [t.id, t.livreur, t.restaurant, t.montantLivraison, t.montantCommande, t.coutLivraison, t.date, t.heure].join('\t'))].join(
        '\n',
      );

      const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      alert(`${dataToExport.length} ligne(s) exportée(s) en Excel`);
    } else if (format === 'pdf') {
      // Création d'un document HTML pour impression PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Export Tickets PDF</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ef4444; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #fed7aa; padding: 10px; text-align: left; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .stats { margin: 20px 0; padding: 15px; background: #fef3c7; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>📋 Rapport des Tickets de Livraison</h1>
          <div class="stats">
            <p><strong>Date d'export:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Nombre total de tickets:</strong> ${dataToExport.length}</p>
            <p><strong>Revenu total:</strong> ${dataToExport.reduce((sum, t) => sum + parseFloat(t.montantLivraison.replace(/[^0-9]/g, '')), 0).toLocaleString()} CFA</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Code Check</th>
                <th>Livreur</th>
                <th>Partner</th>
                <th>Montant de Livraison</th>
                <th>Montant de Commande</th>
                <th>Commission</th>
                <th>Date</th>
                <th>Heure</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport
                .map(
                  (t) => `
                <tr>
                  <td>${t.id}</td>
                  <td>${t.livreur}</td>
                  <td>${t.restaurant}</td>
                  <td>${t.montantLivraison}</td>
                  <td>${t.montantCommande}</td>
                  <td>${t.coutLivraison}</td>
                  <td>${t.date}</td>
                  <td>${t.heure}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        alert('Impossible d’ouvrir la fenêtre d’impression. Veuillez autoriser les pop-ups.');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        alert(`${dataToExport.length} ligne(s) prêtes pour export PDF. Utilisez "Enregistrer en PDF" dans la boîte de dialogue d'impression.`);
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

    const completeTicket: Ticket = {
      ...ticket,
      reference: ticket.code || Math.floor(100000000 + Math.random() * 900000000).toString(),
      statut: 'TERMINE',
    };

    console.log('Ticket complet envoyé:', completeTicket);

    try {
      const result = await createBonLivraison(completeTicket);

      if (!result) {
        throw new Error('Création échouée côté backend');
      }

      console.log('Résultat backend:', result);

      setNewTickets((prev) => prev.filter((t) => t.id !== id));
      toast.success('Ticket créé avec succès');
    } catch (error) {
      console.error('Erreur complète lors de la création:', error);
      toast.error('Erreur lors de la création du ticket');
    }
  };

  const handleSaveRow = async (id: string) => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;

    try {
      const updated = await updateBonLivraison(id, ticket);
      if (updated) {
        setTickets((prev) => prev.map((t) => (t.id === id ? { ...ticket, isEditing: false } : t)));
        toast.success('Ticket mis à jour avec succès');
      } else {
        toast.error('Erreur lors de la mise à jour du ticket');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise à jour du ticket');
    }
  };

  const calculateCommission = (restaurantId: string, montantCommande: number): number => {
    const restaurant = restaurants.find((r) => r.id === restaurantId);
    if (!restaurant || !montantCommande) return 0;

    const commission = Number(restaurant.commission ?? 0);

    if (restaurant.typeCommission === 'POURCENTAGE') {
      const net = montantCommande * (commission / 100);
      return Number(net.toFixed(2));
    }

    // Commission fixe
    return commission;
  };

  const handleNewTicketChange = (id: string, field: keyof Ticket, value: string) => {
    setNewTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updatedTicket = { ...t, [field]: value };

        // recalcul automatique si nécessaire
        if (field === 'montantCommande' || field === 'restaurantId') {
          const montant = Number(updatedTicket.montantCommande || 0);
          updatedTicket.coutLivraison = calculateCommission(updatedTicket.restaurantId, montant).toString();
        }

        return updatedTicket;
      }),
    );
  };

  const handleCancelNewTicket = (id: string) => setTickets((prev) => prev.filter((t) => t.id !== id));
  const handleEditRow = (id: string) => setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, isEditing: true } : t)));
  const handleCancelEditRow = (id: string) => setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, isEditing: false } : t)));

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
            <button onClick={handleInsert} className="h-9 w-full bg-green-500 text-white rounded flex items-center justify-center gap-1 text-xs hover:bg-green-600">
              <Plus className="w-3 h-3" /> Insérer
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-4">
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-4 sm:p-6 text-white">
          <p className="text-xs sm:text-sm opacity-90 mb-2">Revenu Total</p>
          <p className="text-2xl sm:text-3xl font-bold break-words">{totalRevenu.toLocaleString()} CFA</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 mb-2">Total Tickets</p>
          <p className="text-2xl sm:text-3xl font-bold">{tickets.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 mb-2">Livreurs</p>
          <p className="text-2xl sm:text-3xl font-bold">{livreurList.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 mb-2">Partenaires</p>
          <p className="text-2xl sm:text-3xl font-bold">{restaurantList.length}</p>
        </div>
      </div>

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
              <div className="flex items-center gap-2 mb-4 p-1.5 border border-gray-200 rounded-lg">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Rechercher" />
              </div>

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
            <p className="text-xs sm:text-sm text-gray-600 mb-4">Total: {filteredTickets.length} ticket(s)</p>

            {/* Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="max-h-[420px] overflow-y-auto border border-gray-200 rounded-lg">
                <div className="inline-block min-w-full align-middle">
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-[1600px] border border-gray-200">
                      <thead className="bg-orange-50 sticky top-0 z-2">
                        <tr>
                          <th className="p-2 sm:p-3 text-left sticky left-0 z-2">
                            <input type="checkbox" checked={selectedRows.size === filteredTickets.length && filteredTickets.length > 0} onChange={handleSelectAll} className="w-4 h-4" />
                          </th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Code Check</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap min-w-[260px]">Livreur</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap min-w-[320px]">Partner</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Montant de Livraison</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Montant de Commande</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Commission</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Date</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Heure</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {newTickets.map((ticket) => (
                          <tr key={ticket.id} className={`${selectedRows.has(ticket.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            {/* Checkbox */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 sticky left-0 bg-inherit z-2">
                              <input type="checkbox" checked={selectedRows.has(ticket.id)} onChange={() => handleRowSelect(ticket.id)} className="w-4 h-4" />
                            </td>

                            {/* Numéro */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isEditing ? (
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
                              ) : (
                                ticket.code
                              )}
                            </td>

                            {/* Livreur */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[260px]">
                              {ticket.isNew || ticket.isEditing ? (
                                <Select
                                  options={livreurList}
                                  value={livreurList.find((o) => o.value === ticket.livreurId) ?? null}
                                  onChange={(option) => handleNewTicketChange(ticket.id, 'livreurId', option?.value ?? '')}
                                  placeholder="Sélectionner un livreur"
                                  isClearable
                                  className="text-xs rounded px-2 py-1"
                                  classNamePrefix="react-select"
                                />
                              ) : (
                                ticket.livreur
                              )}
                            </td>

                            {/* Restaurant */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[320px]">
                              {ticket.isNew || ticket.isEditing ? (
                                <Select
                                  options={restaurantList}
                                  value={restaurantList.find((o) => o.value === ticket.restaurantId) ?? null}
                                  onChange={(option) => handleNewTicketChange(ticket.id, 'restaurantId', option?.value ?? '')}
                                  placeholder="Sélectionner un restaurant"
                                  isClearable
                                  className="text-xs rounded px-2 py-1"
                                  classNamePrefix="react-select"
                                />
                              ) : (
                                ticket.restaurant
                              )}
                            </td>

                            {/* Montant Livraison */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={ticket.montantLivraison}
                                  onChange={(e) => handleNewTicketChange(ticket.id, 'montantLivraison', e.target.value)}
                                  placeholder="0 CFA"
                                  disabled={!ticket.restaurantId}
                                  className={`w-full h-9 px-2 py-1 text-xs border rounded ${!ticket.restaurantId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                              ) : (
                                formatCFA(ticket.montantLivraison)
                              )}
                            </td>

                            {/* Montant Commande */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input
                                  value={ticket.montantCommande}
                                  onChange={(e) => handleNewTicketChange(ticket.id, 'montantCommande', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                  placeholder="0 CFA"
                                />
                              ) : (
                                formatCFA(ticket.montantCommande)
                              )}
                            </td>

                            {/* Commission */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input type="number" value={ticket.coutLivraison} readOnly placeholder="0 CFA" className="w-full h-9 px-2 py-1 text-xs text-right border border-gray-300 rounded" />
                              ) : (
                                formatCFA(calculateCommission(ticket.restaurantId, Number(ticket.montantCommande)))
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input
                                  type="date"
                                  value={ticket.date}
                                  onChange={(e) => handleNewTicketChange(ticket.id, 'date', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                />
                              ) : (
                                formatDateFR(ticket.date)
                              )}
                            </td>

                            {/* Heure */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input
                                  type="time"
                                  value={ticket.heure}
                                  onChange={(e) => handleNewTicketChange(ticket.id, 'heure', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                />
                              ) : (
                                formatHoursMinutes(ticket.heure)
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 whitespace-nowrap">
                              {ticket.isNew ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveNewTicket(ticket.id)}
                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center"
                                  >
                                    <CheckSquare className="w-4 h-4 " />
                                  </button>
                                  <button
                                    onClick={() => handleCancelNewTicket(ticket.id)}
                                    className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : ticket.isEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveRow(ticket.id)}
                                    className="px-2 py-1 h-9 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelEditRow(ticket.id)}
                                    className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => handleEditRow(ticket.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center">
                                  <Pen className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {ticketsData.map((ticket) => (
                          <tr key={ticket.id} className={`${selectedRows.has(ticket.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            {/* Checkbox */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 sticky left-0 bg-inherit z-2">
                              <input type="checkbox" checked={selectedRows.has(ticket.id)} onChange={() => handleRowSelect(ticket.id)} className="w-4 h-4" />
                            </td>

                            {/* Numéro */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isEditing ? (
                                <input
                                  type="text"
                                  value={ticket.code}
                                  onChange={(e) => {
                                    const newCode = e.target.value;
                                    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, code: newCode } : t)));
                                  }}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                  placeholder="Code CHECKoo"
                                />
                              ) : (
                                ticket.code
                              )}
                            </td>

                            {/* Livreur */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[260px]">
                              {ticket.isNew || ticket.isEditing ? (
                                <Select
                                  options={livreurList}
                                  value={livreurList.find((o) => o.value === ticket.livreurId) ?? null}
                                  onChange={(option) => handleNewTicketChange(ticket.id, 'livreurId', option?.value ?? '')}
                                  placeholder="Sélectionner un livreur"
                                  isClearable
                                  className="text-xs rounded px-2 py-1"
                                  classNamePrefix="react-select"
                                />
                              ) : (
                                ticket.livreur
                              )}
                            </td>

                            {/* Restaurant */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[320px]">
                              {ticket.isNew || ticket.isEditing ? (
                                <Select
                                  options={restaurantList}
                                  value={restaurantList.find((o) => o.value === ticket.restaurantId) ?? null}
                                  onChange={(option) => handleNewTicketChange(ticket.id, 'restaurantId', option?.value ?? '')}
                                  placeholder="Sélectionner un restaurant"
                                  isClearable
                                  className="text-xs rounded px-2 py-1"
                                  classNamePrefix="react-select"
                                />
                              ) : (
                                ticket.restaurant
                              )}
                            </td>

                            {/* Montant Livraison */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={ticket.montantLivraison}
                                  onChange={(e) => handleNewTicketChange(ticket.id, 'montantLivraison', e.target.value)}
                                  placeholder="0 CFA"
                                  disabled={!ticket.restaurantId}
                                  className={`w-full h-9 px-2 py-1 text-xs border rounded ${!ticket.restaurantId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                              ) : (
                                formatCFA(ticket.montantLivraison)
                              )}
                            </td>

                            {/* Montant Commande */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input
                                  value={ticket.montantCommande}
                                  onChange={(e) => handleNewTicketChange(ticket.id, 'montantCommande', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                  placeholder="0 CFA"
                                />
                              ) : (
                                formatCFA(ticket.montantCommande)
                              )}
                            </td>

                            {/* Commission */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input type="number" value={ticket.coutLivraison} readOnly placeholder="0 CFA" className="w-full h-9 px-2 py-1 text-xs text-right border border-gray-300 rounded" />
                              ) : (
                                formatCFA(calculateCommission(ticket.restaurantId, Number(ticket.montantCommande)))
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input
                                  type="date"
                                  value={ticket.date}
                                  onChange={(e) => handleNewTicketChange(ticket.id, 'date', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                />
                              ) : (
                                formatDateFR(ticket.date)
                              )}
                            </td>

                            {/* Heure */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                              {ticket.isNew || ticket.isEditing ? (
                                <input
                                  type="time"
                                  value={ticket.heure}
                                  onChange={(e) => handleNewTicketChange(ticket.id, 'heure', e.target.value)}
                                  className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
                                />
                              ) : (
                                formatHoursMinutes(ticket.heure)
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-2 py-1 border-t border-b border-gray-200 whitespace-nowrap">
                              {ticket.isNew ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveNewTicket(ticket.id)}
                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelNewTicket(ticket.id)}
                                    className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : ticket.isEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveRow(ticket.id)}
                                    className="px-2 py-1 h-9 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelEditRow(ticket.id)}
                                    className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => handleEditRow(ticket.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center">
                                  <Pen className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'livreur' && (
          <div className="p-4 sm:p-6">
            <div className="mb-6">
              <label className="block text-xs font-medium mb-2">Sélectionner un livreur</label>
              <Select
                options={livreurOptions}
                value={livreurOptions.find((o) => o.value === filters.livreurId) ?? null}
                onChange={(opt) => setFilter('livreurId', opt?.value ?? '')}
                placeholder="Tous les livreurs"
                isClearable
                className="text-xsbg-amber-400"
                classNamePrefix="react-select"
              />
            </div>

            {selectedLivreur && livreurStats[selectedLivreur] && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <h3 className="text-base sm:text-lg font-bold">{selectedLivreur}</h3>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {livreurStats[selectedLivreur].count} ticket(s) • Commission: {livreurStats[selectedLivreur].commission.toLocaleString()} CFA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Total Tickets</p>
                      <p className="text-xl sm:text-2xl font-bold">{livreurStats[selectedLivreur].count}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-orange-500">Total Commandes</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-500 break-words">{formatCFA(livreurStats[selectedLivreur].totalCommandes.toLocaleString())}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-blue-500">Total Livraisons</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-500 break-words">{formatCFA(livreurStats[selectedLivreur].totalLivraisons.toLocaleString())}</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-medium mb-3">Total • {formatCFA(livreurStats[selectedLivreur].totalLivraisons.toLocaleString())}</p>

                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full min-w-full">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Heure</th>
                          <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Restaurant</th>
                          <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLivreurTickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b border-gray-100">
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{ticket.heure.slice(0, 5)}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-blue-500 whitespace-nowrap">{ticket.restaurant}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-right whitespace-nowrap">{formatCFA(ticket.montantLivraison)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {!selectedLivreur && (
              <div className="space-y-4">
                {Object.entries(livreurStats).map(([livreur, stats]) => (
                  <div key={livreur} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLivreur(livreur)}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base">{livreur}</h3>
                      <div className="flex items-center justify-between sm:justify-end gap-4 text-xs sm:text-sm">
                        <span className="text-gray-600">
                          {stats.count} ticket(s) • <span className="font-bold">{formatCFA(stats.commission.toLocaleString())}</span>
                        </span>
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-1 py-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={handleSelectAll} className="px-2  py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1">
            <CheckSquare className="w-3 h-3" /> Sélectionner
          </button>
          <button
            onClick={handleDeleteRows}
            disabled={selectedRows.size === 0}
            className={`px-2 py-1 border rounded-full text-xs sm:text-sm flex items-center gap-1
    ${selectedRows.size === 0 ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-red-300 text-red-500 hover:bg-red-50'}`}
          >
            <Trash className="w-3 h-3" /> Supprimer
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
    </div>
  );
}
