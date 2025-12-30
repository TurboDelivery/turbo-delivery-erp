"use client";

import React, { useState, useMemo } from 'react';
import { Search, Package, Ticket, ChevronDown, FileText, Clipboard, X, File, Trash, Trash2, Scissors, Copy, CheckSquare, Plus, Pen } from 'lucide-react';
import Select from 'react-select';

type ExportFormat = 'csv' | 'excel' | 'pdf';

interface Ticket {
    id: string;
    livreur: string;
    restaurant: string;
    montantCommande: string;
    montantLivraison: string;
    coutLivraison: string;
    date: string;
    heure: string;
    isNew?: boolean;    // déjà existant
    isEditing?: boolean; // nouveau champ
}

interface LivreurStat {
    count: number;
    totalCommandes: number;
    totalLivraisons: number;
    commission: number;
    tickets: Ticket[];
}

export default function Content() {
    const [insertCount, setInsertCount] = useState<number>(1);

    const [activeTab, setActiveTab] = useState('tous');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [clipboard, setClipboard] = useState<Ticket[]>([]);

    const [filterLivreur, setFilterLivreur] = useState('');
    const [filterRestaurant, setFilterRestaurant] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLivreur, setSelectedLivreur] = useState('');

    const [exportOpen, setExportOpen] = useState(false);


    const [tickets, setTickets] = useState<Ticket[]>([
        { id: '0130346', livreur: 'ATANDA GANIOU', restaurant: 'CHICKEN NATION', montantCommande: '1,500 CFA', montantLivraison: '1,000 CFA', coutLivraison: '500 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '0139981', livreur: 'ATANDA GANIOU', restaurant: 'HOT BAYTS', montantCommande: '2,000 CFA', montantLivraison: '2,000 CFA', coutLivraison: '1,000 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '0139146', livreur: 'ATANDA GANIOU', restaurant: 'LE PETIT CAFÉ', montantCommande: '1,500 CFA', montantLivraison: '1,500 CFA', coutLivraison: '750 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '0139148', livreur: 'ATANDA GANIOU', restaurant: 'LE PETIT CAFÉ', montantCommande: '1,000 CFA', montantLivraison: '1,000 CFA', coutLivraison: '500 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '0139143', livreur: 'ATANDA GANIOU', restaurant: 'LE PETIT CAFÉ', montantCommande: '1,000 CFA', montantLivraison: '1,000 CFA', coutLivraison: '500 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '1375694', livreur: 'MAGLII CONSETANT', restaurant: 'AGHA', montantCommande: '1,500 CFA', montantLivraison: '1,500 CFA', coutLivraison: '750 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '1375413', livreur: 'MAGLII CONSETANT', restaurant: 'AGHA', montantCommande: '1,000 CFA', montantLivraison: '1,000 CFA', coutLivraison: '500 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '1375415', livreur: 'MAGLII CONSETANT', restaurant: 'AGHA', montantCommande: '5,000 CFA', montantLivraison: '5,000 CFA', coutLivraison: '2,500 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '2234561', livreur: 'AKA Jean', restaurant: 'PIZZA PALACE', montantCommande: '3,000 CFA', montantLivraison: '3,000 CFA', coutLivraison: '1,500 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '2234562', livreur: 'AKA Jean', restaurant: 'BURGER KING', montantCommande: '2,500 CFA', montantLivraison: '2,500 CFA', coutLivraison: '1,250 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '3345671', livreur: 'YANO FRANCK', restaurant: 'SUSHI BAR', montantCommande: '4,000 CFA', montantLivraison: '4,000 CFA', coutLivraison: '2,000 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '3345672', livreur: 'YANO FRANCK', restaurant: 'TACO BELL', montantCommande: '1,800 CFA', montantLivraison: '1,800 CFA', coutLivraison: '900 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '3345673', livreur: 'YANO FRANCK', restaurant: 'PASTA HOUSE', montantCommande: '2,200 CFA', montantLivraison: '2,200 CFA', coutLivraison: '1,100 CFA', date: '2025-01-12', heure: '00:00:00' },
        { id: '3345674', livreur: 'YANO FRANCK', restaurant: 'STEAK HOUSE', montantCommande: '3,500 CFA', montantLivraison: '3,500 CFA', coutLivraison: '1,750 CFA', date: '2025-01-12', heure: '00:00:00' },
    ]);

    const livreurs = useMemo(() => [...new Set(tickets.map(t => t.livreur))], [tickets]);
    const restaurants = useMemo(() => [...new Set(tickets.map(t => t.restaurant))], [tickets]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const matchLivreur = !filterLivreur || ticket.livreur === filterLivreur;
            const matchRestaurant = !filterRestaurant || ticket.restaurant === filterRestaurant;
            const matchDateStart = !dateStart || ticket.date >= dateStart;
            const matchDateEnd = !dateEnd || ticket.date <= dateEnd;
            const matchSearch = !searchTerm ||
                ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.livreur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.restaurant.toLowerCase().includes(searchTerm.toLowerCase());

            return matchLivreur && matchRestaurant && matchDateStart && matchDateEnd && matchSearch;
        });
    }, [tickets, filterLivreur, filterRestaurant, dateStart, dateEnd, searchTerm]);

    const livreurStats = useMemo<Record<string, LivreurStat>>(() => {
        const stats: Record<string, LivreurStat> = {};

        tickets.forEach(ticket => {
            if (!stats[ticket.livreur]) {
                stats[ticket.livreur] = {
                    count: 0,
                    totalCommandes: 0,
                    totalLivraisons: 0,
                    commission: 0,
                    tickets: []
                };
            }

            stats[ticket.livreur].count++;
            stats[ticket.livreur].totalCommandes += Number(ticket.montantCommande.replace(/\D/g, ''));
            stats[ticket.livreur].totalLivraisons += Number(ticket.montantLivraison.replace(/\D/g, ''));
            stats[ticket.livreur].commission += Number(ticket.coutLivraison.replace(/\D/g, ''));
            stats[ticket.livreur].tickets.push(ticket);
        });

        return stats;
    }, [tickets]);

    const livreurOptions = useMemo(
        () => livreurs.map(l => ({ value: l, label: l })),
        [livreurs]
    );

    const restaurantOptions = useMemo(
        () => restaurants.map(r => ({ value: r, label: r })),
        [restaurants]
    );

    const filteredLivreurTickets = useMemo(() => {
        if (!selectedLivreur) return [];
        return livreurStats[selectedLivreur]?.tickets || [];
    }, [selectedLivreur, livreurStats]);

    const handleSelectAll = () => {
        if (selectedRows.size === filteredTickets.length && filteredTickets.length > 0) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredTickets.map(t => t.id)));
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

    const handleCopy = () => {
        if (selectedRows.size === 0) {
            alert('Aucune ligne sélectionnée');
            return;
        }
        const selectedTickets = tickets.filter(t => selectedRows.has(t.id));
        setClipboard(selectedTickets);
        alert(`${selectedTickets.length} ligne(s) copiée(s)`);
    };

    const handleCut = () => {
        if (selectedRows.size === 0) {
            alert('Aucune ligne sélectionnée');
            return;
        }
        const selectedTickets = tickets.filter(t => selectedRows.has(t.id));
        setClipboard(selectedTickets);
        setTickets(tickets.filter(t => !selectedRows.has(t.id)));
        setSelectedRows(new Set());
        alert(`${selectedTickets.length} ligne(s) coupée(s)`);
    };

    // const handlePaste = () => {
    //     if (clipboard.length === 0) {
    //         alert('Presse-papiers vide');
    //         return;
    //     }
    //     const newTickets = clipboard.map(t => ({
    //         ...t,
    //         id: Math.random().toString(36).substr(2, 9).toUpperCase()
    //     }));
    //     setTickets([...newTickets, ...tickets]);
    //     alert(`${clipboard.length} ligne(s) collée(s)`);
    // };

    const handlePaste = () => {
        if (clipboard.length === 0) {
            alert('Presse-papiers vide');
            return;
        }
    
        if (selectedRows.size === 0) {
            // Pas de sélection, on ajoute simplement les tickets copiés/coupés
            const newTickets = clipboard.map(t => ({
                ...t,
                id: Math.random().toString(36).substr(2, 9).toUpperCase(),
                isNew: true // Pour rendre éditable
            }));
            setTickets([...newTickets, ...tickets]);
            alert(`${clipboard.length} ligne(s) collée(s)`);
            return;
        }
    
        // Copier/coller dans les lignes sélectionnées
        setTickets(prev => prev.map(t => {
            if (selectedRows.has(t.id)) {
                const copiedTicket = clipboard.shift(); // on prend la première ligne du clipboard
                if (!copiedTicket) return t; // plus rien à coller
                return {
                    ...t,
                    livreur: copiedTicket.livreur,
                    restaurant: copiedTicket.restaurant,
                    montantCommande: copiedTicket.montantCommande,
                    montantLivraison: copiedTicket.montantLivraison,
                    coutLivraison: copiedTicket.coutLivraison,
                    date: copiedTicket.date,
                    heure: copiedTicket.heure
                };
            }
            return t;
        }));
    
        alert(`${clipboard.length} ligne(s) collée(s) dans les lignes sélectionnées`);
    };

    const handleClearContent = () => {
        if (selectedRows.size === 0) {
            alert('Aucune ligne sélectionnée');
            return;
        }
        const updatedTickets = tickets.map(t => {
            if (selectedRows.has(t.id)) {
                return { ...t, montantCommande: '0 CFA', montantLivraison: '0 CFA', coutLivraison: '0 CFA' };
            }
            return t;
        });
        setTickets(updatedTickets);
        alert('Contenu effacé');
    };

    const handleDeleteRows = () => {
        if (selectedRows.size === 0) {
            alert('Aucune ligne sélectionnée');
            return;
        }
        const count = selectedRows.size;
        setTickets(tickets.filter(t => !selectedRows.has(t.id)));
        setSelectedRows(new Set());
        alert(`${count} ligne(s) supprimée(s)`);
    };

    const handleExport = (format: ExportFormat) => {
        const dataToExport = activeTab === 'tous' ? filteredTickets : filteredLivreurTickets;

        if (dataToExport.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        if (format === 'csv') {
            const headers = ['Numéro', 'Livreur', 'Restaurant', 'Montant Commande', 'Montant Livraison', 'Coût Livraison', 'Date', 'Heure'];
            const csvContent = [
                headers.join(','),
                ...dataToExport.map(t => [
                    t.id,
                    `"${t.livreur}"`,
                    `"${t.restaurant}"`,
                    t.montantCommande,
                    t.montantLivraison,
                    t.coutLivraison,
                    t.date,
                    t.heure
                ].join(','))
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
            const headers = ['Numéro', 'Livreur', 'Restaurant', 'Montant Commande', 'Montant Livraison', 'Coût Livraison', 'Date', 'Heure'];
            const csvContent = [
                headers.join('\t'),
                ...dataToExport.map(t => [
                    t.id,
                    t.livreur,
                    t.restaurant,
                    t.montantCommande,
                    t.montantLivraison,
                    t.coutLivraison,
                    t.date,
                    t.heure
                ].join('\t'))
            ].join('\n');

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
                <th>Numéro</th>
                <th>Livreur</th>
                <th>Restaurant</th>
                <th>Mt. Commande</th>
                <th>Mt. Livraison</th>
                <th>Coût Livraison</th>
                <th>Date</th>
                <th>Heure</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport.map(t => `
                <tr>
                  <td>${t.id}</td>
                  <td>${t.livreur}</td>
                  <td>${t.restaurant}</td>
                  <td>${t.montantCommande}</td>
                  <td>${t.montantLivraison}</td>
                  <td>${t.coutLivraison}</td>
                  <td>${t.date}</td>
                  <td>${t.heure}</td>
                </tr>
              `).join('')}
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
                alert(
                    `${dataToExport.length} ligne(s) prêtes pour export PDF. Utilisez "Enregistrer en PDF" dans la boîte de dialogue d'impression.`
                );
            }, 250);

        }
    };

    const totalRevenu = useMemo(() => {
        return filteredTickets.reduce((sum, t) => sum + parseFloat(t.montantLivraison.replace(/[^0-9]/g, '')), 0);
    }, [filteredTickets]);

    const handleInsert = () => {
        if (insertCount <= 0) return;

        const newTickets: Ticket[] = Array.from({ length: insertCount }).map(() => ({
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            livreur: '',
            restaurant: '',
            montantCommande: '',
            montantLivraison: '',
            coutLivraison: '',
            date: new Date().toISOString().split('T')[0],
            heure: new Date().toLocaleTimeString('fr-FR'),
            isNew: true
        }));

        setTickets(prev => [...newTickets, ...prev]);
    };

    const handleNewTicketChange = (id: string, field: keyof Ticket, value: string) => {
        setTickets(prev =>
            prev.map(t =>
                t.id === id ? { ...t, [field]: value } : t
            )
        );
    };

    const handleSaveNewTicket = (id: string) => {
        setTickets(prev =>
            prev.map(t =>
                t.id === id ? { ...t, isNew: false } : t
            )
        );
    };

    const handleCancelNewTicket = (id: string) => {
        setTickets(prev => prev.filter(t => t.id !== id));
    };

    const handleEditRow = (id: string) => {
        setTickets(prev =>
            prev.map(t =>
                t.id === id ? { ...t, isEditing: true } : t
            )
        );
    };

    const handleSaveRow = (id: string) => {
        setTickets(prev =>
            prev.map(t =>
                t.id === id ? { ...t, isEditing: false } : t
            )
        );
    };

    const handleCancelEditRow = (id: string) => {
        setTickets(prev =>
            prev.map(t =>
                t.id === id ? { ...t, isEditing: false } : t
            )
        );
    };

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
                <div className="flex items-center gap-4">
                    {/* <span className="text-sm text-gray-500">01</span> */}
                    <input
                        type="number"
                        min={1}
                        value={insertCount}
                        onChange={(e) => setInsertCount(Number(e.target.value))}
                        className="w-14 px-2 py-1 text-sm text-center border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button onClick={handleInsert} className="bg-green-500 text-white px-2 py-1 rounded flex items-center gap-1 text-xs hover:bg-green-600">
                        <Plus className="w-3 h-3" />
                        Insérer
                    </button>
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
                    <p className="text-2xl sm:text-3xl font-bold">{livreurs.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">Partenaires</p>
                    <p className="text-2xl sm:text-3xl font-bold">7</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('tous')}
                        className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'tous' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}>
                        Tous les Tickets
                    </button>
                    <button
                        onClick={() => setActiveTab('livreur')}
                        className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'livreur' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}>
                        Par Livreur
                    </button>
                </div>

                {activeTab === 'tous' && (
                    <div className="p-4">
                        {/* Search and Filters */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4 p-1.5 border border-gray-200 rounded-lg">
                                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 outline-none text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Filtrer par Livreur</label>
                                    <select
                                        value={filterLivreur}
                                        onChange={(e) => setFilterLivreur(e.target.value)}
                                        className="w-full p-1.5 border border-gray-200 rounded-lg text-xs outline-none"
                                    >
                                        <option value="">Tous les livreurs</option>
                                        {livreurs.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">Filtrer par Restaurant</label>
                                    <select
                                        value={filterRestaurant}
                                        onChange={(e) => setFilterRestaurant(e.target.value)}
                                        className="w-full p-1.5 border border-gray-200 rounded-lg text-xs outline-none"
                                    >
                                        <option value="">Tous les restaurants</option>
                                        {restaurants.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>

                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-xs font-medium mb-1">Filtrer par Date</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dateStart}
                                            onChange={(e) => setDateStart(e.target.value)}
                                            className="flex-1 p-1.5 border border-gray-200 rounded-lg text-xs outline-none"
                                        />
                                        <input
                                            type="date"
                                            value={dateEnd}
                                            onChange={(e) => setDateEnd(e.target.value)}
                                            className="flex-1 p-1.5 border border-gray-200 rounded-lg text-xs outline-none"
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
                                    <table className="min-w-full border border-gray-200">
                                        <thead className="bg-orange-50 sticky top-0 z-20">
                                            <tr>
                                                <th className="p-2 sm:p-3 text-left sticky left-0 bg-orange-50 z-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRows.size === filteredTickets.length && filteredTickets.length > 0} onChange={handleSelectAll}
                                                        className="w-4 h-4" />
                                                </th>
                                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Code Check</th>
                                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Livreur</th>
                                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Partner</th>
                                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Montant de Livraison</th>
                                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Montant de Commande</th>
                                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Commission</th>
                                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Date</th>
                                                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Heure</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTickets.map((ticket) => (
                                                <tr
                                                    key={ticket.id}
                                                    className={`${selectedRows.has(ticket.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                                    {/* Checkbox */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 sticky left-0 bg-inherit z-10">
                                                        {!ticket.isNew && (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRows.has(ticket.id)}
                                                                onChange={() => handleRowSelect(ticket.id)}
                                                                className="w-4 h-4"
                                                            />
                                                        )}
                                                    </td>

                                                    {/* Numéro */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">{ticket.id}</td>

                                                    {/* Livreur */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                                        {(ticket.isNew || ticket.isEditing) ? (
                                                            <Select
                                                                options={livreurOptions}
                                                                value={livreurOptions.find(o => o.value === ticket.livreur) ?? null}
                                                                onChange={(option) =>
                                                                    handleNewTicketChange(ticket.id, 'livreur', option?.value ?? '')
                                                                }
                                                                placeholder="Sélectionner un livreur"
                                                                isClearable
                                                                className="text-xs"
                                                                classNamePrefix="react-select"
                                                            />
                                                        ) : (
                                                            ticket.livreur
                                                        )}
                                                    </td>

                                                    {/* Restaurant */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                                        {(ticket.isNew || ticket.isEditing) ? (
                                                            <Select
                                                                options={restaurantOptions}
                                                                value={restaurantOptions.find(o => o.value === ticket.restaurant) ?? null}
                                                                onChange={(option) =>
                                                                    handleNewTicketChange(ticket.id, 'restaurant', option?.value ?? '')
                                                                }
                                                                placeholder="Sélectionner un restaurant"
                                                                isClearable
                                                                className="text-xs"
                                                                classNamePrefix="react-select"
                                                            />
                                                        ) : (
                                                            ticket.restaurant
                                                        )}
                                                    </td>

                                                    {/* Montant Livraison */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                                        {(ticket.isNew || ticket.isEditing) ? (
                                                            <input
                                                                value={ticket.montantLivraison}
                                                                onChange={(e) => handleNewTicketChange(ticket.id, 'montantLivraison', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                                                                placeholder="0 CFA"
                                                            />
                                                        ) : (
                                                            ticket.montantLivraison
                                                        )}
                                                    </td>

                                                    {/* Montant Commande */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                                        {(ticket.isNew || ticket.isEditing) ? (
                                                            <input
                                                                value={ticket.montantCommande}
                                                                onChange={(e) => handleNewTicketChange(ticket.id, 'montantCommande', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                                                                placeholder="0 CFA"
                                                            />
                                                        ) : (
                                                            ticket.montantCommande
                                                        )}
                                                    </td>

                                                    {/* Coût Livraison */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                                        {(ticket.isNew || ticket.isEditing) ? (
                                                            <input
                                                                value={ticket.coutLivraison}
                                                                onChange={(e) => handleNewTicketChange(ticket.id, 'coutLivraison', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                                                                placeholder="0 CFA"
                                                            />
                                                        ) : (
                                                            ticket.coutLivraison
                                                        )}
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                                        {(ticket.isNew || ticket.isEditing) ? (
                                                            <input
                                                                type="date"
                                                                value={ticket.date}
                                                                onChange={(e) => handleNewTicketChange(ticket.id, 'date', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                                                            />
                                                        ) : (
                                                            ticket.date
                                                        )}
                                                    </td>

                                                    {/* Heure */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
                                                        {(ticket.isNew || ticket.isEditing) ? (
                                                            <input
                                                                type="time"
                                                                value={ticket.heure}
                                                                onChange={(e) => handleNewTicketChange(ticket.id, 'heure', e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                                                            />
                                                        ) : (
                                                            ticket.heure
                                                        )}
                                                    </td>


                                                    {/* Actions */}
                                                    <td className="px-2 py-1 border-t border-b border-gray-200 whitespace-nowrap">
                                                        {ticket.isNew ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSaveNewTicket(ticket.id)}
                                                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center">
                                                                    <CheckSquare className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelNewTicket(ticket.id)}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : ticket.isEditing ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSaveRow(ticket.id)}
                                                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center">
                                                                    <CheckSquare className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelEditRow(ticket.id)}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleEditRow(ticket.id)}
                                                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center">
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
                )}

                {activeTab === 'livreur' && (
                    <div className="p-4 sm:p-6">
                        <div className="mb-6">
                            <label className="block text-xs font-medium mb-2">Sélectionner un livreur</label>
                            <select
                                value={selectedLivreur}
                                onChange={(e) => setSelectedLivreur(e.target.value)}
                                className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm outline-none"
                            >
                                <option value="">Tous les livreurs</option>
                                {livreurs.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>

                        {selectedLivreur && livreurStats[selectedLivreur] && (
                            <div className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
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
                                            <p className="text-xl sm:text-2xl font-bold text-orange-500 break-words">{livreurStats[selectedLivreur].totalCommandes.toLocaleString()} CFA</p>
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-blue-500">Total Livraisons</p>
                                            <p className="text-xl sm:text-2xl font-bold text-blue-500 break-words">{livreurStats[selectedLivreur].totalLivraisons.toLocaleString()} CFA</p>
                                        </div>
                                    </div>

                                    <p className="text-xs sm:text-sm font-medium mb-3">Total pour 2025-01-12 • {livreurStats[selectedLivreur].totalLivraisons.toLocaleString()} CFA</p>

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
                                                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{ticket.heure}</td>
                                                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-blue-500 whitespace-nowrap">{ticket.restaurant}</td>
                                                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-right whitespace-nowrap">{ticket.montantLivraison}</td>
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
                                                <span className="text-gray-600">{stats.count} ticket(s) • <span className="font-bold">{stats.commission.toLocaleString()} CFA</span></span>
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
                    <button onClick={handleSelectAll} className="px-2 py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" /> Sélectionner
                    </button>
                    <button onClick={handleCopy} className="px-2 py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copier
                    </button>
                    <button onClick={handleCut} className="px-2 py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1">
                        <Scissors className="w-3 h-3" /> Couper
                    </button>
                    <button onClick={handleClearContent} className="px-2 py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Effacer contenu
                    </button>
                    <button onClick={handleDeleteRows} className="px-2 py-1 border border-red-300 text-red-500 rounded-full text-xs sm:text-sm hover:bg-red-50 flex items-center gap-1">
                        <Trash className="w-3 h-3" /> Supprimer
                    </button>
                    <button onClick={() => setSelectedRows(new Set())} className="px-2 py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1">
                        <X className="w-3 h-3" /> Désélectionner
                    </button>

                    {/* Spacer pour pousser les boutons à droite */}
                    <div className="ml-auto flex gap-2 items-center">
                        <button
                            onClick={handlePaste} disabled={clipboard.length === 0}
                            className={`px-2 py-1 border rounded-full text-xs sm:text-sm flex items-center gap-1
                                ${clipboard.length === 0 ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                            <Clipboard className="w-3 h-3" /> Coller
                        </button>

                        {/* Dropdown Export */}
                        <div className="relative">
                            <button
                                onClick={() => setExportOpen((v) => !v)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs sm:text-sm hover:bg-green-600">
                                <FileText className="w-3 h-3" /> Exporter
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {exportOpen && (
                                <ul className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <li>
                                        <button
                                            onClick={() => { handleExport('pdf'); setExportOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2">
                                            <File className="w-3 h-3" /> Exporter la sélection en PDF
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => { handleExport('excel'); setExportOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2">
                                            <File className="w-3 h-3" /> Exporter la sélection en Excel
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => { handleExport('csv'); setExportOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2">
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
};
