"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Pagination } from "@heroui/react";
import { MoveUpRight, MoveDownRight } from "lucide-react";
import { useTableauDePaiController } from "./controller";
import { DetailFichePaieModal } from "../detail-fiche-de-paie/detail-fiche-paie-modal";
import { InfoParJour, PaieErpVM, PaieParLivreur } from "@/types/gestion-de-paie.model";


interface TableauDePaieProps {
    datas: PaieErpVM | null;
    periode?: string,
    searchKey?: string;
}

export function TableauDePaie({ datas, periode, searchKey }: TableauDePaieProps) {
    const ctrl = useTableauDePaiController(datas, searchKey);

    return (
        <div className="mt-4 bg-white  rounded-lg">
            <Table className="hidden md:table">
                <TableHeader>
                    <TableColumn className="text-md">Nom et prénoms</TableColumn>
                    <TableColumn className="text-md">Total réalisé</TableColumn>
                    <TableColumn className="text-md">Gain initial</TableColumn>
                    <TableColumn className="text-md">Jours de travail</TableColumn>
                    <TableColumn className="text-md">Week-end</TableColumn>
                    <TableColumn className="text-md">Taux d’intérêt</TableColumn>
                    <TableColumn className="text-md">Commission</TableColumn>
                    <TableColumn>{""}</TableColumn>
                    <TableColumn>{""}</TableColumn>
                </TableHeader>
                <TableBody>
                    {ctrl.data && ctrl.data.map((item: PaieParLivreur, index) => (
                        <TableRow key={index} className={"hover:bg-primary/10 cursor-pointer"} onClick={() => ctrl.openDetailModal(item)} >
                            <TableCell className="border-b-2">
                                <div className="flex items-center gap-4">
                                    <span className="w-7 h-7 rounded-full bg-gray-300"> </span>
                                    <div className="flex flex-col gap-1">{item.nomComplet} {ctrl.getStatusChip(item.type)}</div>
                                </div>
                            </TableCell>
                            <TableCell className="border-b-2 text-gray-500">{item.total}&nbsp;&nbsp; FCFA</TableCell>
                            <TableCell className="border-b-2 text-gray-500">{item.gain}&nbsp;&nbsp; FCFA</TableCell>
                            <TableCell className="border-b-2 text-gray-500">
                                {item.joursTravaille && item.joursTravaille?.map((jour: InfoParJour, index: number) => (
                                    <span key={index}>{ctrl.recupererStatutJours(jour)}</span>
                                ))}
                            </TableCell>
                            <TableCell className="border-b-2 text-gray-500">
                                {item.weekEnd && item.weekEnd?.map((weeek: InfoParJour, index: number) => (
                                    <span key={index}>{ctrl.recupererStatutJoursWeekend(weeek)}</span>
                                ))}
                            </TableCell>
                            <TableCell className="border-b-2 text-gray-500">{item.taux}</TableCell>
                            <TableCell className="border-b-2 text-gray-500">{item.commission}&nbsp;&nbsp; FCFA</TableCell>
                            <TableCell className=" border-b-2 text-gray-500">
                                {item?.prime && item?.prime > 0 ? <span className="ml-1 flex gap-1 text-green-500"><MoveUpRight className="text-green-500" size={16} /> + {item.prime}&nbsp;&nbsp; FCFA</span>
                                    : <span className="ml-1 flex gap-1 text-red-500"> <MoveDownRight className="text-red-500" size={16} /> + {item.prime}&nbsp;&nbsp;  FCFA</span>}
                            </TableCell>
                            <TableCell className="border-b-2">
                                {ctrl.conditionValidation(item)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Mobile — une carte par livreur (remplace le tableau < md) */}
            <div className="space-y-3 md:hidden">
                {(!ctrl.data || ctrl.data.length === 0) ? (
                    <p className="py-10 text-center text-sm text-gray-400">Aucune paie trouvée</p>
                ) : (
                    ctrl.data.map((item: PaieParLivreur, index) => (
                        <div
                            key={index}
                            onClick={() => ctrl.openDetailModal(item)}
                            className="cursor-pointer space-y-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm active:bg-primary/5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="h-8 w-8 shrink-0 rounded-full bg-gray-300" />
                                    <p className="truncate text-sm font-semibold text-gray-900">{item.nomComplet}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    {ctrl.getStatusChip(item.type)}
                                    {ctrl.conditionValidation(item)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-gray-400">Total réalisé</span>
                                <span className="text-sm text-gray-700">{item.total}&nbsp; FCFA</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-gray-400">Gain initial</span>
                                <span className="text-sm text-gray-700">{item.gain}&nbsp; FCFA</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-gray-400">Commission</span>
                                <span className="text-sm text-gray-700">{item.commission}&nbsp; FCFA</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-gray-400">Taux d’intérêt</span>
                                <span className="text-sm text-gray-700">{item.taux}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-gray-400">Prime</span>
                                {item?.prime && item?.prime > 0 ? (
                                    <span className="flex gap-1 text-sm text-green-500"><MoveUpRight className="text-green-500" size={16} /> + {item.prime}&nbsp; FCFA</span>
                                ) : (
                                    <span className="flex gap-1 text-sm text-red-500"><MoveDownRight className="text-red-500" size={16} /> + {item.prime}&nbsp; FCFA</span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <span className="shrink-0 text-xs text-gray-400">Jours de travail</span>
                                <span className="text-right">
                                    {item.joursTravaille && item.joursTravaille?.map((jour: InfoParJour, i: number) => (
                                        <span key={i}>{ctrl.recupererStatutJours(jour)}</span>
                                    ))}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <span className="shrink-0 text-xs text-gray-400">Week-end</span>
                                <span className="text-right">
                                    {item.weekEnd && item.weekEnd?.map((weeek: InfoParJour, i: number) => (
                                        <span key={i}>{ctrl.recupererStatutJoursWeekend(weeek)}</span>
                                    ))}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                <Pagination total={1} page={1} onChange={() => ""} showControls color="primary" variant="bordered" isDisabled={false} />
            </div>
            <DetailFichePaieModal onClose={ctrl.onClose} isOpen={ctrl.isOpen} details={ctrl.details} periode={periode} nonEligible={ctrl.nonEligible} />
        </div>
    );
};
