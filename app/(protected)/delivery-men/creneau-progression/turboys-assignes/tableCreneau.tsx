'use client';
import React from "react";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import progresseBare2 from "@/components/dashboard/delivery-men/progression/progression-barre2";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Avatar } from "@heroui/react";
import { createUrlFile } from "@/utils/createUrlFile";
import { formatDate } from "@/utils/date-formate";

const columns = [
    { key: "nom", label: "Nom du coursier" },
    { key: "progression", label: "Progression" },
    { key: "jours", label: "Jours" },
    { key: "debut", label: "Début" },
    { key: "fin", label: "Fin" },
];

interface Props {
    initialData: Livreur[];
}

export default function TableCreneau({ initialData }: Props) {
    const renderCell = React.useCallback(
        (data: Livreur, columnKey: string) => {
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
                    return <div>{data.jour ? `${data.jour.jourTravaille}/7` : "NON DEFINI"}</div>;
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

    if (!initialData || initialData.length === 0) {
        return <EmptyDataTable title="Aucun Livreur" />;
    }

    return (
        <div className="p-4 bg-gray-100 rounded-md">
            <Table aria-label="TABLEAU DE PROGRESSION DES TURBOYS" className="rounded-md">
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={initialData} emptyContent={<EmptyDataTable title="Aucun Livreur" />}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, String(columnKey))}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
