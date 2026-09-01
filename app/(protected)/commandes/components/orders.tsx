"use client";

import { EyeIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { getAllOrders, getOrdersStats } from "@/src/actions/commandes.actions";
import { SelectField } from "@/components/commons/form/select-field";
import EtatErreur from "@/components/commons/EtatErreur";
import { CalendarDate, DateRangePicker, RangeValue } from "@/components/heroui";
import { Order, OrderStats, PageResponse, Restaurant } from "@/types/models";

type OrdersProps = {
    commandesInitiales: PageResponse<Order> | null;
    restaurants: Restaurant[];
    stats: OrderStats | null;
};

export default function OrdersPage({ commandesInitiales, restaurants, stats }: OrdersProps) {
    const [commandes, setCommandes] = useState<PageResponse<Order> | null>(commandesInitiales);
    const [currentPage, setCurrentPage] = useState<number>(commandesInitiales?.number ?? 0);

    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loadingPage, setLoadingPage] = useState(false);
    // Les trois chargements de cet ecran laissaient filer l'exception de l'action
    // en rejet non gere : rien ne bougeait a l'ecran, ce qui se lit comme "il n'y
    // a aucune commande" alors que la lecture avait echoue.
    const [erreur, setErreur] = useState(false);

    // Filtres
    const [dates, setDates] = useState<RangeValue<CalendarDate> | null>(null);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

    const [orderStats, setOrderStats] = useState<OrderStats | null>(stats);

    useEffect(() => {
        setCommandes(commandesInitiales);
        setCurrentPage(commandesInitiales?.number ?? 0);
        // Une charge serveur reussie efface l'echec precedent, sinon l'ecran
        // resterait sur l'erreur alors que la donnee est de nouveau la.
        setErreur(false);
    }, [commandesInitiales]);


    const statusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-50 text-yellow-800 border-yellow-400";
            case "COMPLETED":
                return "bg-green-50 text-green-800 border-green-400";
            case "CANCELLED":
                return "bg-red-50 text-red-800 border-red-400";
            default:
                return "bg-gray-50 text-gray-800 border-gray-300";
        }
    };

    const currency = (value?: number) => (value == null ? "0" : new Intl.NumberFormat("fr-FR").format(value));

    const openDetail = (order: Order) => {
        setDetailOrder(order);
        setShowModal(true);
    };

    const closeDetail = () => {
        setShowModal(false);
        setDetailOrder(null);
    };

    const handlePagination = async (page: number) => {
        if (page < 0 || (commandes && page >= commandes.totalPages)) return;

        setLoadingPage(true);
        setErreur(false);
        try {
            const startStr = dates?.start
                ? new Date(dates.start.year, dates.start.month - 1, dates.start.day)
                    .toISOString()
                    .split("T")[0]
                : null;

            const endStr = dates?.end
                ? new Date(dates.end.year, dates.end.month - 1, dates.end.day)
                    .toISOString()
                    .split("T")[0]
                : null;

            const res = await getAllOrders(page, 10, selectedRestaurantId, startStr, endStr);
            if (res) {
                setCommandes(res);
                setCurrentPage(res.number);
            }
        } catch (error) {
            // Le try/finally sans catch laissait l'exception filer en rejet non gere :
            // le bouton se reactivait et la page affichee ne changeait pas.
            console.error('Erreur lors du chargement de la page de commandes', error);
            setErreur(true);
        } finally {
            setLoadingPage(false);
        }
    };

    // 🔹 Gère le changement de date
    const handleDateChange = async (value: RangeValue<CalendarDate>) => {
        setDates(value);
       

        const startStr = value?.start
            ? new Date(value.start.year, value.start.month - 1, value.start.day).toISOString().split("T")[0]
            : null;
        const endStr = value?.end
            ? new Date(value.end.year, value.end.month - 1, value.end.day).toISOString().split("T")[0]
            : null;

        setErreur(false);
        try {
            const res = await getAllOrders(0, 10, selectedRestaurantId, startStr, endStr);
            const statsRes = await getOrdersStats(selectedRestaurantId, startStr, endStr);
            setCommandes(res);
            setCurrentPage(res?.number ?? 0);
            setOrderStats(statsRes);
        } catch (error) {
            // Sans catch, la periode changeait dans le champ mais la liste et les
            // cartes restaient sur la periode precedente, sans rien signaler.
            console.error('Erreur lors du filtrage des commandes par periode', error);
            setErreur(true);
        }
    };

    // 🔹 Gère le changement de restaurant
    const handleChangeRestaurant = async (restaurantId: string) => {
        setSelectedRestaurantId(restaurantId);
        const startStr = dates?.start
            ? new Date(dates.start.year, dates.start.month - 1, dates.start.day).toISOString().split("T")[0]
            : null;
        const endStr = dates?.end
            ? new Date(dates.end.year, dates.end.month - 1, dates.end.day).toISOString().split("T")[0]
            : null;
            
        setErreur(false);
        try {
            const res = await getAllOrders(0, 10, restaurantId, startStr, endStr);
            const statsRes = await getOrdersStats(restaurantId, startStr, endStr);

            setOrderStats(statsRes);
            setCommandes(res);
            setCurrentPage(res?.number ?? 0);
        } catch (error) {
            // Sans catch, le restaurant selectionne changeait mais l'ecran continuait
            // d'afficher les commandes du precedent, ou celles de tous.
            console.error('Erreur lors du filtrage des commandes par restaurant', error);
            setErreur(true);
        }
    };

    // Une nouvelle tentative rejoue commandes ET statistiques avec les filtres
    // courants : ne recharger que les commandes laisserait les cartes sur la
    // periode ou le restaurant precedents.
    const reessayer = async () => {
        setLoadingPage(true);
        setErreur(false);
        try {
            const startStr = dates?.start
                ? new Date(dates.start.year, dates.start.month - 1, dates.start.day).toISOString().split("T")[0]
                : null;
            const endStr = dates?.end
                ? new Date(dates.end.year, dates.end.month - 1, dates.end.day).toISOString().split("T")[0]
                : null;

            const res = await getAllOrders(currentPage, 10, selectedRestaurantId, startStr, endStr);
            const statsRes = await getOrdersStats(selectedRestaurantId, startStr, endStr);

            setCommandes(res);
            setCurrentPage(res?.number ?? 0);
            setOrderStats(statsRes);
        } catch (error) {
            console.error('Echec de la nouvelle tentative de chargement des commandes', error);
            setErreur(true);
        } finally {
            setLoadingPage(false);
        }
    };

    const statItems: { key: keyof OrderStats; label: string }[] = [
        { key: "total", label: "TOUTES" },
        { key: "pending", label: "EN COURS" },
        { key: "completed", label: "ACCEPTEE" },
        { key: "cancelled", label: "ANNULEE" }
    ];    

    return (
        <div className="p-2 w-full ">
            <div className="w-full bg-white border border-gray-200 shadow-xs rounded-md px-4 py-2 mb-2 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {/* Filtre période */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold font-medium text-gray-700">Rechercher par période</label>
                        <DateRangePicker
                            aria-label="Période"
                            className="w-full"
                            onChange={(value) => handleDateChange(value as RangeValue<CalendarDate>)}
                        />
                    </div>

                    {/* Filtre restaurant */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold font-medium text-gray-700">Sélectionnez un restaurant</label>
                        <SelectField
                            options={restaurants}
                            optionLabel="nomEtablissement"
                            optionValue="id"
                            label="nomEtablissement"
                            setValue={handleChangeRestaurant}
                        />
                    </div>
                </div>
            </div>

            {/* Sur un echec, ni cartes ni liste : une carte a 0 et une liste vide se
                lisent exactement comme "aucune commande", ce qui est faux ici. */}
            {erreur && <EtatErreur quoi="les commandes" onReessayer={reessayer} enCours={loadingPage} />}

            {/* STATISTICS */}
            {!erreur && orderStats && (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {
                    statItems.map(({ key, label }) => {
                        const stat = orderStats[key];

                        return (
                            <div
                                key={label}
                                className={`p-3 rounded-lg border-l-4 shadow-xs flex flex-col items-center justify-center ${statusColor(key.toUpperCase())}`}
                            >
                                <div className="text-2xl font-bold">{stat?.nbre ?? 0}</div>
                                <div className="text-xs text-gray-700 mt-1 truncate">{label}</div>
                                <span className="text-sm mt-1">
                                    {new Intl.NumberFormat("fr-FR").format(stat?.amount ?? 0)} Fcfa
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* LIST */}
            {!erreur && (
            <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {commandes?.content?.map((cmd) => (
                        <article key={cmd.id} className={`bg-white rounded-lg shadow-xs border ${statusColor(cmd.orderState)} overflow-hidden w-full`}>
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                                            {cmd.id.slice(0, 4).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm truncate">Commande #{cmd.numero}</div>
                                            <div className="text-xs text-gray-500 truncate">{new Date(cmd.dateCreation ?? "").toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-2 text-xs text-gray-600 flex-wrap">
                                        <div className="flex items-center gap-2 truncate">
                                            <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2C8 2 4 5 4 9c0 6 8 13 8 13s8-7 8-13c0-4-4-7-8-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span className="truncate">{cmd.adresseM?.libelle ?? "Adresse inconnue"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 truncate">
                                            <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none">
                                                <path d="M3 12h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                                <path d="M6 6h.01M6 18h.01M12 6h.01M12 18h.01M18 6h.01M18 18h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                            </svg>
                                            <span className="truncate">{cmd.paymentMethod ?? "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 truncate">
                                            <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none">
                                                <path d="M3 3h18v18H3z" stroke="currentColor" strokeWidth="1.2" />
                                            </svg>
                                            <span className="truncate">{currency(cmd.totalAmount)} Fcfa</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    {/* Bouton Détails */}
                                    <button
                                        onClick={() => openDetail(cmd)}
                                        className="p-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                                        title="Détails"
                                    >
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="border-t px-4 py-3 bg-gray-50">
                                <div className="flex items-center justify-between text-xs text-gray-600 flex-wrap">
                                    <div>{cmd.orderItemM?.length ?? 0} article(s)</div>
                                    <div>Frais: {currency(cmd.deliveryFee)} Fcfa</div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                    <button
                        onClick={() => handlePagination(currentPage - 1)}
                        disabled={currentPage === 0 || loadingPage}
                        className="px-3 py-2 rounded border bg-white disabled:opacity-50">
                        Précédent
                    </button>
                    <div className="text-sm text-gray-700">
                        Page {(commandes?.number ?? 0) + 1} / {commandes?.totalPages ?? 1}
                    </div>
                    <button
                        onClick={() => handlePagination(currentPage + 1)}
                        disabled={currentPage + 1 >= (commandes?.totalPages ?? 1) || loadingPage}
                        className="px-3 py-2 rounded border bg-white disabled:opacity-50"
                    >
                        Suivant
                    </button>
                </div>
            </div>
            )}

            {/* DETAILS MODAL */}
            {showModal && detailOrder && (
                <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />
                    <div className="relative w-full max-w-full sm:max-w-3xl max-h-[90vh] overflow-auto bg-white rounded-lg shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b gap-2 sm:gap-0">
                            <div>
                                <div className="font-semibold">Détails commande #{detailOrder.id.slice(0, 8)}</div>
                                <div className="text-xs text-gray-500">{new Date(detailOrder.dateCreation ?? "").toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className={`px-2 py-1 rounded text-xs font-medium border ${statusColor(detailOrder.orderState)}`}>
                                    {detailOrder.orderState}
                                </div>
                                <button onClick={closeDetail} className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 rounded-md border">
                                    Fermer
                                </button>
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: items */}
                            <div>
                                <h4 className="font-semibold mb-2">Produits</h4>
                                <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                                    {detailOrder.orderItemM?.map((it) => (
                                        <div key={it.id} className="flex items-start gap-3 p-3 rounded border flex-wrap">
                                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                                                Img
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <div className="font-medium text-sm truncate">{`Produit ${it.platId.slice(0, 6)}`}</div>
                                                    <div className="text-sm font-semibold">{currency(it.price)} Fcfa</div>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 truncate">
                                                    Qté: {it.quantity} {it.optionValues?.length ? ` • Options: ${it.optionValues.join(", ")}` : ""}
                                                </div>
                                                {it.accompIds?.length ? (
                                                    <div className="text-xs text-gray-500 mt-1 truncate">Accompagnements: {it.accompIds.join(", ")}</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-3 border rounded bg-gray-50">
                                    <div className="flex justify-between text-sm">
                                        <span>Sous-total</span>
                                        <span>{currency(detailOrder.totalAmount - (detailOrder.deliveryFee ?? 0) - (detailOrder.serviceFee ?? 0))} Fcfa</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span>Frais livraison</span>
                                        <span>{currency(detailOrder.deliveryFee)} Fcfa</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span>Frais service</span>
                                        <span>{currency(detailOrder.serviceFee)} Fcfa</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold mt-2">
                                        <span>Total</span>
                                        <span>{currency(detailOrder.totalAmount)} Fcfa</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: adresse + client */}
                            <div>
                                <h4 className="font-semibold mb-2">Livraison & client</h4>
                                <div className="mb-3 p-3 rounded border bg-white">
                                    <div className="text-sm font-medium truncate">{detailOrder.recipientName ?? detailOrder.userM?.nom}</div>
                                    <div className="text-xs text-gray-500 truncate">{detailOrder.recipientPhone ?? detailOrder.userM?.telephone}</div>
                                    <div className="text-xs text-gray-600 mt-2 truncate">{detailOrder.adresseM?.libelle ?? "Adresse non fournie"}</div>
                                    {(detailOrder.adresseM?.etage || detailOrder.adresseM?.numeroPorte) && (
                                        <div className="text-xs text-gray-500 mt-1 truncate">
                                            {detailOrder.adresseM?.batName ? `${detailOrder.adresseM.batName} • ` : ""}
                                            {detailOrder.adresseM?.etage ? `Etage ${detailOrder.adresseM.etage} • ` : ""}
                                            {detailOrder.adresseM?.numeroPorte ? `Porte ${detailOrder.adresseM.numeroPorte}` : ""}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 text-xs text-gray-600">
                                    <div>Mode paiement: <strong>{detailOrder.paymentMethod ?? "—"}</strong></div>
                                    <div className="mt-1">Commande créée: {new Date(detailOrder.dateCreation ?? "").toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
