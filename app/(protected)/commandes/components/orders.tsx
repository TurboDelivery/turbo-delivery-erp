"use client";

import { Order } from "@/types/models";
import { toast } from "react-toastify";
import React, { useEffect, useMemo, useState } from "react";
import { CheckIcon, EyeIcon, XCircle } from "lucide-react";
import { accepterCommande, annulerCommande, getAllOrders } from "@/src/actions/commandes.actions";

export type PageResponse<T> = {
    content: T[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first?: boolean;
    last?: boolean;
    pageable?: any;
    numberOfElements?: number;
    sort?: any;
};

type OrdersProps = {
    commandesInitiales: PageResponse<Order> | null;
};

export default function OrdersPage({ commandesInitiales }: OrdersProps) {
    const [commandes, setCommandes] = useState<PageResponse<Order> | null>(commandesInitiales);
    const [selectedCategory, setSelectedCategory] = useState<string>("TOUTES");
    const [currentPage, setCurrentPage] = useState<number>(commandesInitiales?.number ?? 0);

    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loadingPage, setLoadingPage] = useState(false);

    useEffect(() => {
        setCommandes(commandesInitiales);
        setCurrentPage(commandesInitiales?.number ?? 0);
    }, [commandesInitiales]);

    const filtered = useMemo(() => {
        if (!commandes) return [];
        if (selectedCategory === "TOUTES") return commandes.content;
        return commandes.content.filter(cmd => (cmd.orderState ?? "").toUpperCase() === selectedCategory);
    }, [commandes, selectedCategory]);

    const statusTotals = useMemo(() => {
        const totals: Record<string, number> = { TOUTES: 0 };
        (commandes?.content ?? []).forEach(c => {
            const amount = c.totalAmount ?? 0;
            totals["TOUTES"] += amount;
            const status = c.orderState ?? "UNKNOWN";
            totals[status] = (totals[status] ?? 0) + amount;
        });
        return totals;
    }, [commandes]);


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
        try {
            const res = await getAllOrders(page, commandes?.size ?? 10);
            if (res) {
                setCommandes(res);
                setCurrentPage(res.number);
            }
        } finally {
            setLoadingPage(false);
        }
    };

    const statusBuckets = useMemo(() => {
        const content = commandes?.content ?? [];
        const counts: Record<string, number> = {};
        counts["TOUTES"] = content.length;
        content.forEach((c) => {
            const s = c.orderState ?? "UNKNOWN";
            counts[s] = (counts[s] ?? 0) + 1;
        });
        return counts;
    }, [commandes]);

    return (
        <div className="p-2 w-full max-w-7xl mx-auto">
            {/* STATISTICS */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {["TOUTES", "PENDING", "COMPLETED", "CANCELLED"].map((label) => (
                    <div
                        key={label}
                        className={`p-3 rounded-lg border-l-4 shadow-sm flex flex-col items-center justify-center ${statusColor(label)}`}
                    >
                        <div className="text-2xl font-bold">{statusBuckets[label] ?? 0}</div>
                        <div className="text-xs text-gray-700 mt-1 truncate">{label.replaceAll("_", " ")}</div>
                        <span className="text-sm mt-1">
                            {new Intl.NumberFormat("fr-FR").format(statusTotals[label] ?? 0)} Fcfa
                        </span>
                    </div>
                ))}
            </div>

            {/* LIST */}
            <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {filtered.map((cmd) => (
                        <article key={cmd.id} className={`bg-white rounded-lg shadow-sm border-l-4 ${statusColor(cmd.orderState)} overflow-hidden w-full`}>
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
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2C8 2 4 5 4 9c0 6 8 13 8 13s8-7 8-13c0-4-4-7-8-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span className="truncate">{cmd.adresseM?.libelle ?? "Adresse inconnue"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 truncate">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                                <path d="M3 12h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                                <path d="M6 6h.01M6 18h.01M12 6h.01M12 18h.01M18 6h.01M18 18h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                            </svg>
                                            <span className="truncate">{cmd.paymentMethod ?? "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 truncate">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
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
                                {detailOrder.orderState === "PENDING" && (
                                    <button
                                        onClick={async () => {
                                            if (!detailOrder) return;
                                            try {
                                                const updated = await accepterCommande(detailOrder.id);
                                                if (updated) {
                                                    setCommandes((prev) => {
                                                        if (!prev) return prev;
                                                        const newContent = prev.content.map((c) => (c.id === updated.id ? updated : c));
                                                        return { ...prev, content: newContent };
                                                    });
                                                    setDetailOrder(updated);
                                                }
                                            } catch (err) {
                                                console.error("Erreur lors de l'acceptation :", err);
                                            }
                                        }}
                                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                                    >
                                        Accepter
                                    </button>
                                )}
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
