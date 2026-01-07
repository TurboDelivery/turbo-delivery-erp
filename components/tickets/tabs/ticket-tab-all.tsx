// import React, { useState } from 'react';
// import { Input } from '@heroui/react';
// import { CheckSquare, Pen, Search, X } from 'lucide-react';
// import Select from 'react-select';
// import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
// import useTickets from '@/features/tickets/hooks/use-tickets';
// import { Ticket } from '@/types/bon-livraison.model';
// import { toast } from 'react-toastify';
//
// function TicketTabAll() {
//   const { filters, setFilter, ticketsData, isLoading, infiniteState } = useTickets();
//   const [newTickets, setNewTickets] = useState<Ticket[]>([]);
//   const [tickets, setTickets] = useState<Ticket[]>([]);
//   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
//
//   const handleSelectAll = () => {
//     if (selectedRows.size > 0 && ticketsData.length && ticketsData.length > 0) {
//       setSelectedRows(new Set());
//     } else {
//       setSelectedRows(new Set(ticketsData.map((t) => t.id)));
//     }
//   };
//
//   const handleRowSelect = (id: string) => {
//     const newSelected = new Set(selectedRows);
//     if (newSelected.has(id)) {
//       newSelected.delete(id);
//     } else {
//       newSelected.add(id);
//     }
//     setSelectedRows(newSelected);
//   };
//
//   return (
//     <div className="p-4">
//       {/* Search and Filters */}
//       <div className="mb-6">
//         <Input className="mb-4" startContent={<Search />} value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Code check" />
//
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
//           <div>
//             <label className="block text-xs font-medium mb-1">Filtrer par Livreur</label>
//             <Select
//               options={livreurOptions}
//               value={livreurOptions.find((o) => o.value === filters.livreurId) ?? null}
//               onChange={(opt) => setFilter('livreurId', opt?.value ?? '')}
//               placeholder="Tous les livreurs"
//               isClearable
//               className="text-xs"
//               classNamePrefix="react-select"
//             />
//           </div>
//
//           <div>
//             <label className="block text-xs font-medium mb-1">Filtrer par Restaurant</label>
//             <Select
//               options={restaurantOptions}
//               value={restaurantOptions.find((o) => o.value === filters.restaurantId) ?? null}
//               onChange={(opt) => setFilter('restaurantId', opt?.value ?? '')}
//               placeholder="Tous les restaurants"
//               isClearable
//               className="text-xs"
//               classNamePrefix="react-select"
//             />
//           </div>
//
//           <div className="sm:col-span-2 lg:col-span-1">
//             <label className="block text-xs font-medium mb-1">Filtrer par Date</label>
//             <div className="flex gap-2">
//               <input
//                 type="date"
//                 value={filters.debut.toISOString().split('T')[0]}
//                 onChange={(e) => setFilter('debut', e.target.value)}
//                 className="flex-1 h-9 p-2 border border-gray-200 rounded text-xs outline-none"
//               />
//               <input
//                 type="date"
//                 value={filters.fin.toISOString().split('T')[0]}
//                 onChange={(e) => setFilter('fin', e.target.value)}
//                 className="flex-1 h-9 p-2 border border-gray-200 rounded text-xs outline-none"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//       <p className="text-xs sm:text-sm text-gray-600 mb-4">Total: {infiniteState.totalItems} ticket(s)</p>
//
//       {/* Table */}
//       <div className="overflow-x-auto -mx-4 sm:mx-0">
//         <div className="max-h-[420px] overflow-y-auto border border-gray-200 rounded-lg">
//           <div className="inline-block min-w-full align-middle">
//             <div className="w-full overflow-x-auto">
//               <table className="min-w-[1600px] border border-gray-200">
//                 <thead className="bg-orange-50 sticky top-0 z-2">
//                   <tr>
//                     <th className="p-2 sm:p-3 text-left sticky left-0 z-2">
//                       <input type="checkbox" checked={selectedRows.size === ticketsData.length && ticketsData.length > 0} onChange={handleSelectAll} className="w-4 h-4" />
//                     </th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Code Check</th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap min-w-[260px]">Livreur</th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap min-w-[320px]">Partner</th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Montant de Livraison</th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Montant de Commande</th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Commission</th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Date</th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">Heure</th>
//                     <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">
//                       <span className="sr-only">Actions</span>
//                     </th>
//                   </tr>
//                 </thead>
//                 {!isLoading && (
//                   <tbody>
//                     {newTickets.map((ticket) => (
//                       <tr key={ticket.id} className={`${selectedRows.has(ticket.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
//                         {/* Checkbox */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 sticky left-0 bg-inherit z-2">
//                           <input type="checkbox" disabled checked={selectedRows.has(ticket.id)} onChange={() => handleRowSelect(ticket.id)} className="w-4 h-4" />
//                         </td>
//
//                         {/* Numéro */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           <input
//                             type="text"
//                             value={ticket.code}
//                             onChange={(e) => {
//                               const newCode = e.target.value;
//                               setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, code: newCode } : t)));
//                             }}
//                             className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
//                             placeholder="Code CHECK"
//                           />
//                         </td>
//
//                         {/* Livreur */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[260px]">
//                           <Select
//                             options={livreurList}
//                             value={livreurList.find((o) => o.value === ticket.livreurId) ?? null}
//                             onChange={(option) => handleNewTicketChange(ticket.id, 'livreurId', option?.value ?? '')}
//                             placeholder="Sélectionner un livreur"
//                             isClearable
//                             className="text-xs rounded px-2 py-1"
//                             classNamePrefix="react-select"
//                           />
//                         </td>
//
//                         {/* Restaurant */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[320px]">
//                           <Select
//                             options={restaurantList}
//                             value={restaurantList.find((o) => o.value === ticket.restaurantId) ?? null}
//                             onChange={(option) => handleNewTicketChange(ticket.id, 'restaurantId', option?.value ?? '')}
//                             placeholder="Sélectionner un restaurant"
//                             isClearable
//                             className="text-xs rounded px-2 py-1"
//                             classNamePrefix="react-select"
//                           />
//                         </td>
//
//                         {/* Montant Livraison */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             value={ticket.montantLivraison}
//                             onChange={(e) => handleNewTicketChange(ticket.id, 'montantLivraison', e.target.value)}
//                             placeholder="0 CFA"
//                             disabled={!ticket.restaurantId}
//                             className={`w-full h-9 px-2 py-1 text-xs border rounded ${!ticket.restaurantId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
//                           />
//                         </td>
//
//                         {/* Montant Commande */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           <input
//                             value={ticket.montantCommande}
//                             onChange={(e) => handleNewTicketChange(ticket.id, 'montantCommande', e.target.value)}
//                             className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
//                             placeholder="0 CFA"
//                           />
//                         </td>
//
//                         {/* Commission */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           <input type="number" value={ticket.coutLivraison} readOnly placeholder="0 CFA" className="w-full h-9 px-2 py-1 text-xs text-right border border-gray-300 rounded" />
//                         </td>
//
//                         {/* Date */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           <input
//                             type="date"
//                             value={ticket.date}
//                             onChange={(e) => handleNewTicketChange(ticket.id, 'date', e.target.value)}
//                             className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
//                           />
//                         </td>
//
//                         {/* Heure */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           <input
//                             type="time"
//                             value={ticket.heure}
//                             onChange={(e) => handleNewTicketChange(ticket.id, 'heure', e.target.value)}
//                             className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
//                           />
//                         </td>
//
//                         {/* Actions */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 whitespace-nowrap">
//                           <div className="flex gap-2">
//                             <button onClick={() => handleSaveRow(ticket.id)} className="px-2 py-1 h-9 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center">
//                               <CheckSquare className="w-4 h-4" />
//                             </button>
//                             <button onClick={() => handleCancelEditRow(ticket.id)} className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center">
//                               <X className="w-4 h-4" />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                     {ticketsData.map((ticket) => (
//                       <tr key={ticket.id} className={`${selectedRows.has(ticket.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
//                         {/* Checkbox */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 sticky left-0 bg-inherit z-2">
//                           <input type="checkbox" checked={selectedRows.has(ticket.id)} onChange={() => handleRowSelect(ticket.id)} className="w-4 h-4" />
//                         </td>
//
//                         {/* Numéro */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           {ticket.isEditing ? (
//                             <input
//                               type="text"
//                               value={ticket.code}
//                               onChange={(e) => {
//                                 const newCode = e.target.value;
//                                 setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, code: newCode } : t)));
//                               }}
//                               className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
//                               placeholder="Code CHECK"
//                             />
//                           ) : (
//                             ticket.code
//                           )}
//                         </td>
//
//                         {/* Livreur */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[260px]">
//                           {ticket.isNew || ticket.isEditing ? (
//                             <Select
//                               options={livreurList}
//                               value={livreurList.find((o) => o.value === ticket.livreurId) ?? null}
//                               onChange={(option) => handleNewTicketChange(ticket.id, 'livreurId', option?.value ?? '')}
//                               placeholder="Sélectionner un livreur"
//                               isClearable
//                               className="text-xs rounded px-2 py-1"
//                               classNamePrefix="react-select"
//                             />
//                           ) : (
//                             ticket.livreur
//                           )}
//                         </td>
//
//                         {/* Restaurant */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap min-w-[320px]">
//                           {ticket.isNew || ticket.isEditing ? (
//                             <Select
//                               options={restaurantList}
//                               value={restaurantList.find((o) => o.value === ticket.restaurantId) ?? null}
//                               onChange={(option) => handleNewTicketChange(ticket.id, 'restaurantId', option?.value ?? '')}
//                               placeholder="Sélectionner un restaurant"
//                               isClearable
//                               className="text-xs rounded px-2 py-1"
//                               classNamePrefix="react-select"
//                             />
//                           ) : (
//                             ticket.restaurant
//                           )}
//                         </td>
//
//                         {/* Montant Livraison */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           {ticket.isNew || ticket.isEditing ? (
//                             <input
//                               type="number"
//                               min={0}
//                               step="0.01"
//                               value={ticket.montantLivraison}
//                               onChange={(e) => handleNewTicketChange(ticket.id, 'montantLivraison', e.target.value)}
//                               placeholder="0 CFA"
//                               disabled={!ticket.restaurantId}
//                               className={`w-full h-9 px-2 py-1 text-xs border rounded ${!ticket.restaurantId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
//                             />
//                           ) : (
//                             formatCFA(ticket.montantLivraison)
//                           )}
//                         </td>
//
//                         {/* Montant Commande */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           {ticket.isNew || ticket.isEditing ? (
//                             <input
//                               value={ticket.montantCommande}
//                               onChange={(e) => handleNewTicketChange(ticket.id, 'montantCommande', e.target.value)}
//                               className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
//                               placeholder="0 CFA"
//                             />
//                           ) : (
//                             formatCFA(ticket.montantCommande)
//                           )}
//                         </td>
//
//                         {/* Commission */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           {ticket.isNew || ticket.isEditing ? (
//                             <input type="number" value={ticket.coutLivraison} readOnly placeholder="0 CFA" className="w-full h-9 px-2 py-1 text-xs text-right border border-gray-300 rounded" />
//                           ) : (
//                             formatCFA(calculateCommission(ticket.restaurantId, Number(ticket.montantCommande)))
//                           )}
//                         </td>
//
//                         {/* Date */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           {ticket.isNew || ticket.isEditing ? (
//                             <input
//                               type="date"
//                               value={ticket.date}
//                               onChange={(e) => handleNewTicketChange(ticket.id, 'date', e.target.value)}
//                               className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
//                             />
//                           ) : (
//                             formatDateFR(ticket.date)
//                           )}
//                         </td>
//
//                         {/* Heure */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 text-xs whitespace-nowrap">
//                           {ticket.isNew || ticket.isEditing ? (
//                             <input
//                               type="time"
//                               value={ticket.heure}
//                               onChange={(e) => handleNewTicketChange(ticket.id, 'heure', e.target.value)}
//                               className="w-full h-9 border border-gray-300 rounded px-2 py-1 text-xs"
//                             />
//                           ) : (
//                             formatHoursMinutes(ticket.heure)
//                           )}
//                         </td>
//
//                         {/* Actions */}
//                         <td className="px-2 py-1 border-t border-b border-gray-200 whitespace-nowrap">
//                           {ticket.isNew ? (
//                             <div className="flex gap-2">
//                               <button onClick={() => handleSaveNewTicket(ticket.id)} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center">
//                                 <CheckSquare className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => handleCancelNewTicket(ticket.id)}
//                                 className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
//                               >
//                                 <X className="w-4 h-4" />
//                               </button>
//                             </div>
//                           ) : ticket.isEditing ? (
//                             <div className="flex gap-2">
//                               <button onClick={() => handleSaveRow(ticket.id)} className="px-2 py-1 h-9 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center">
//                                 <CheckSquare className="w-4 h-4" />
//                               </button>
//                               <button onClick={() => handleCancelEditRow(ticket.id)} className="px-2 py-1 h-9 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center">
//                                 <X className="w-4 h-4" />
//                               </button>
//                             </div>
//                           ) : (
//                             <button onClick={() => handleEditRow(ticket.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center">
//                               <Pen className="w-4 h-4" />
//                             </button>
//                           )}
//                         </td>
//                       </tr>
//                     ))}
//                     <tr ref={observerTarget} className="h-0.5 flex items-center justify-center mt-4">
//                       {infiniteState.isFetchingNextPage && (
//                         <td colSpan={10} className="text-xs text-gray-500">
//                           Chargement des données...
//                         </td>
//                       )}
//                     </tr>
//                   </tbody>
//                 )}
//                 {isLoading && (
//                   <tbody>
//                     <tr>
//                       <td colSpan={10} className="p-4 text-center text-gray-500">
//                         Chargement des tickets...
//                       </td>
//                     </tr>
//                   </tbody>
//                 )}
//                 {!isLoading && ticketsData.length === 0 && (
//                   <tbody>
//                     <tr>
//                       <td colSpan={10} className="p-4 text-center text-gray-500">
//                         Aucun ticket trouvé.
//                       </td>
//                     </tr>
//                   </tbody>
//                 )}
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
//
// export default TicketTabAll;