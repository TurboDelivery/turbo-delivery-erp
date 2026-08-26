'use client'

import React, { useState, useEffect } from "react";
import TableCreneau from "./tableCreneau";
import { PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/button";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import { getAllCreneauPerformanceTurbo } from "@/src/creneau-livreur/creneau-livreur.action";
import { Avatar } from "@heroui/react";
import { createUrlFile } from "@/utils/createUrlFile";

interface Props {
    initialData: PaginatedResponse<RestaurantProgressionTurbo> | null;
}

export default function Content({ initialData }: Props) {
    const [page, setPage] = useState(initialData?.number || 0);
    const [data, setData] = useState<PaginatedResponse<RestaurantProgressionTurbo> | null>(initialData);

    if (!data || data.content.length === 0) {
        return <EmptyDataTable title="Aucun restaurant" />;
    }

    const handlePageChange = async (newPage: number) => {
        if (newPage < 0 || newPage >= (data?.totalPages || 1)) return;

        const newData = await getAllCreneauPerformanceTurbo(newPage); // récupère les données paginées
        setData(newData); // met à jour le state local
        setPage(newPage);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Pagination */}
            <div className="flex justify-center mt-6 space-x-2">
                <Button
                    disabled={data.first}
                    onClick={() => handlePageChange(page - 1)}
                >
                    Précédent
                </Button>
                <span className="px-4 py-2 bg-white border rounded">
                    Page {page + 1} / {data.totalPages}
                </span>
                <Button
                    disabled={data.last}
                    onClick={() => handlePageChange(page + 1)}
                >
                    Suivant
                </Button>
            </div>
            
            {data.content.map((item, index) => (
                <div key={index} className="border rounded-md">
                    <div className="flex items-center py-4 px-4 gap-3">
                        <Avatar
                            isBordered
                            radius="full"
                            size="md"
                            src={
                                item.logo
                                    ? createUrlFile(item.logo ?? "", "restaurant")
                                    : "assets/images/avatar.png"
                            }
                        />
                        <h2 className="text-xl font-semibold">{item.nomRestaurant}</h2>
                    </div>

                    <TableCreneau initialData={item.livreurs} />
                </div>
            ))}

            {/* Pagination */}
            <div className="flex justify-center mt-6 space-x-2">
                <Button
                    disabled={data.first}
                    onClick={() => handlePageChange(page - 1)}
                >
                    Précédent
                </Button>
                <span className="px-4 py-2 bg-white border rounded">
                    Page {page + 1} / {data.totalPages}
                </span>
                <Button
                    disabled={data.last}
                    onClick={() => handlePageChange(page + 1)}
                >
                    Suivant
                </Button>
            </div>
        </div>
    );
}
