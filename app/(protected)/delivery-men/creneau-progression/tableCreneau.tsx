'use client';

import React, { useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Avatar,
} from "@heroui/react";
import progresseBare2 from "@/components/dashboard/delivery-men/progression/progression-barre2";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import { createUrlFile } from "@/utils/createUrlFile";
import { PaginatedResponse } from "@/types";
import { getAllCreneauPerformanceBird } from "@/src/creneau-livreur/creneau-livreur.action";
import { IconSearch } from "@tabler/icons-react";
import { formatDate } from "@/utils/date-formate";

const columns = [
    { key: "nom", label: "Nom du coursier" },
    { key: "progression", label: "Progression" },
    { key: "jours", label: "Jours" },
    { key: "debut", label: "Début" },
    { key: "fin", label: "Fin" },
];

interface Props {
    initialData: PaginatedResponse<CreneauProgressionBird>;
}

export default function TableCreneau({ initialData }: Props) {
    const [page, setPage] = useState(initialData.number || 0);
    const [search, setSearch] = useState<string>("");
    const [data, setData] = useState<PaginatedResponse<CreneauProgressionBird> | null>(initialData);

    const renderCell = React.useCallback(
        (data: CreneauProgressionBird, columnKey: any) => {
            switch (columnKey) {
                case "nom":
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar
                                isBordered
                                radius="full"
                                size="md"
                                src={
                                    data?.avatar
                                        ? createUrlFile(data.avatar ?? "", "backend")
                                        : "assets/images/avatar.png"
                                }
                            />
                            <span>{data.nomComplet || "NON DEFINI"}</span>
                        </div>
                    );
                case "progression":
                    return <div className="flex flex-col">{progresseBare2(data)}</div>;
                case "jours":
                    return (
                        <div>
                            {data.jour
                                ? `${data.jour.jourTravaille}/7`
                                : "NON DEFINI"}
                        </div>
                    );
                case "debut":
                    return <div>{data.creneauVM?.jourDebut ? formatDate(data.creneauVM?.jourDebut, 'DD/MM/YYYY') : "NON DEFINI"}</div>;
                case "fin":
                    return <div>{data.creneauVM?.jourFin ? formatDate(data.creneauVM?.jourFin, 'DD/MM/YYYY') : "NON DEFINI"}</div>;
                default:
                    return null;
            }
        },
        []
    );

    const handlePageChange = async (newPage: number) => {
        const newData = await getAllCreneauPerformanceBird(newPage, 10); // 👈 appelle ton endpoint backend
        setData(newData);
        setPage(newPage);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleSearch = async (keysearch: string) => {
        setSearch(keysearch);
        const newData = await getAllCreneauPerformanceBird(0, 10, keysearch); // reset page à 0
        setData(newData);
        setPage(0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(search);
    };

    return (
        <div className="p-4 bg-gray-100 rounded-md">
            <div className="flex items-center gap-4 mb-4">
                {/* Zone recherche (input + bouton) */}
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center flex-1 gap-2"
                >
                    <input
                        type="text"
                        placeholder="Rechercher un livreur par son nom ou son prenom..."
                        value={search}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <button
                        type="submit"
                        className="p-2 bg-primary text-white rounded flex items-center justify-center"
                    >
                        <IconSearch size={18} /> RECHERCHE
                    </button>
                </form>
            </div>
            <Table aria-label="TABLEAU DE PROGRESSION DES BIRDS" className="rounded-md">
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody
                    items={data?.content}
                    emptyContent={<EmptyDataTable title="Aucun Livreur" />}
                >
                    {(item) => (
                        <TableRow key={String(item.id)}>
                            {(columnKey) => (
                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-center mt-6 space-x-2">
                <button
                    disabled={data?.first}
                    onClick={() => handlePageChange(page - 1)}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    Précédent
                </button>

                <span className="px-4 py-2 bg-white border rounded">
                    Page {page + 1} / {data?.totalPages}
                </span>

                <button
                    disabled={data?.last}
                    onClick={() => handlePageChange(page + 1)}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    Suivant
                </button>
            </div>
        </div>
    );
}
