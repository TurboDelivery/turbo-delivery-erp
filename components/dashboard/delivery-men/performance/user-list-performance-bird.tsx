'use client';
import { useState, useMemo } from 'react';
import { Avatar, Button } from '@/components/heroui';
import fnPerformance from './fn-performance';
import DropDownActionPerformance from './drop-down-action-performance';
import fnProgressionPerformance from './fn-progressive-performance';
import { createUrlFile } from '@/utils/createUrlFile';

interface props {
    data: LivreurPerformanceBirdEndTorubo[];
}

export default function UserListPerformanceBird({ data }: props) {
    // fonction mois abrégé
    const fnMois = (mois: string) => {
        switch (mois) {
            case '01': return 'Janv';
            case '02': return 'Fév';
            case '03': return 'Mars';
            case '04': return 'Avril';
            case '05': return 'Mai';
            case '06': return 'Juin';
            case '07': return 'Juil';
            case '08': return 'Août';
            case '09': return 'Sept';
            case '10': return 'Oct';
            case '11': return 'Nov';
            case '12': return 'Déc';
            default: return '';
        }
    };

    // on regroupe les livreurs par créneau
    const groupesParCreneau = data.reduce((acc: any, livreur) => {
        const key = livreur.creneau.debut + '-' + livreur.creneau.fin;
        if (!acc[key]) {
            acc[key] = { creneau: livreur.creneau, livreurs: [] };
        }
        acc[key].livreurs.push(livreur);
        return acc;
    }, {});

    const groupes: { 
        creneau: LivreurPerformanceBirdEndTorubo["creneau"]; 
        livreurs: LivreurPerformanceBirdEndTorubo[] 
    }[] = Object.values(groupesParCreneau);

    // Trouver le créneau courant
    const today = new Date();
    const currentIndex = groupes.findIndex((group: any) => {
        const debut = new Date(group.creneau.debut);
        const fin = new Date(group.creneau.fin);
        return today >= debut && today <= fin;
    });

    // Index actif global (onglet semaine)
    const [activeIndex, setActiveIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

    // --- Pagination interne au groupe actif ---
    const [page, setPage] = useState(0);
    const itemsPerPage = 5; // 🔥 configurable

    const livreursActifs = groupes[activeIndex]?.livreurs || [];
    const totalPages = Math.ceil(livreursActifs.length / itemsPerPage);

    const paginatedLivreurs = useMemo(() => {
        const start = page * itemsPerPage;
        return livreursActifs.slice(start, start + itemsPerPage);
    }, [page, livreursActifs]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    // reset pagination quand on change de semaine
    const handleTabChange = (idx: number) => {
        setActiveIndex(idx);
        setPage(0);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Tabs horizontales scrollables */}
            <div className="overflow-x-auto">
                <div className="flex space-x-2 min-w-max">
                    {groupes.map((group, idx) => {
                        const jourDebut = group.creneau.debut?.substring(8, 10);
                        const jourFin = group.creneau.fin?.substring(8, 10);
                        const moiDebut = group.creneau.debut?.substring(5, 7);
                        const moiFin = group.creneau.fin?.substring(5, 7);

                        return (
                            <button
                                key={group.creneau.debut + '-' + group.creneau.fin}
                                onClick={() => handleTabChange(idx)}
                                className={`px-4 py-2 rounded-md whitespace-nowrap text-sm font-medium transition-colors ${
                                    activeIndex === idx
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Semaine du {jourDebut} - {jourFin} {fnMois(moiDebut || moiFin || '')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Contenu du tab actif */}
            {activeIndex !== -1 && (
                <div
                    key={groupes[activeIndex].creneau.debut + '-' + groupes[activeIndex].creneau.fin}
                    className="flex flex-col gap-2"
                >
                    {paginatedLivreurs.map((item) => {
                        const creneauLabel = `Créneau du : ${item.creneau.debut?.substring(8, 10)} - ${item.creneau.fin?.substring(8, 10)} ${fnMois(item.creneau.debut?.substring(5, 7) || '')}`;
                        const dayButtons = item.etats.map((etat, idx) => {
                            const lettre = etat.jour[0];
                            const style =
                                etat.statut === 'VALIDE'
                                    ? 'success' : (etat.statut === 'EN_COURS'
                                        ? 'warning' : (etat.statut === 'MANQUE' ? 'danger' : 'default'));
                            return (
                                <Button key={idx} isIconOnly size="sm" className="rounded-md" color={style}>
                                    {lettre}
                                </Button>
                            );
                        });
                        return (
                        <div key={item.id}>
                            {/* Ligne dense — desktop uniquement (≥ md) */}
                            <div className="hidden md:flex overflow-hidden">
                                <div className="relative w-full overflow-x-auto overflow-y-hidden px-3 py-3 hide-scrollbar flex flex-nowrap gap-2 border-2 rounded-md space-x-4 flex-1">
                                {/* avatar + nom */}
                                <div className="shrink-0 flex items-center w-1/6">
                                    <Avatar
                                        isBordered
                                        radius="full"
                                        size="md"
                                        className="mr-3"
                                        src={
                                            item?.avatarUrl
                                                ? createUrlFile(item.avatarUrl ?? "", "backend")
                                                : "assets/images/avatar.png"
                                        }
                                    />
                                    <p className="font-semibold text-slate-500">{item.nomComplet}</p>
                                </div>

                                {/* date / statut */}
                                <div className="shrink-0 bg-red-500 flex items-center rounded-md text-white py-2 px-2">
                                    {creneauLabel}
                                </div>

                                {/* boutons jours */}
                                <div className="shrink-0 w-[350px] flex items-center gap-2">
                                    <span>En cours</span>
                                    {dayButtons}
                                </div>

                                {/* progression */}
                                <div className="shrink-0 w-1/6 flex gap-2 items-center">
                                    {fnProgressionPerformance(item)}
                                    <span>Performance {fnPerformance(item)}</span>
                                </div>

                                {/* commission */}
                                <div className="shrink-0 w-1/12">
                                    <h3>Commission</h3>
                                    <h4 className="text-lg">{item.commission}</h4>
                                </div>

                                {/* prime */}
                                <div className="shrink-0 w-1/12">
                                    <h3>Prime</h3>
                                    <h4 className="text-lg">{item.prime}</h4>
                                </div>
                                </div>

                                {/* action */}
                                <div className="bg-stone-100 w-[50px] rounded-r-md flex items-center justify-center relative -left-3">
                                    <DropDownActionPerformance id={item.id} />
                                </div>
                            </div>

                            {/* Carte tactile — mobile (< md), mêmes données / handlers que la ligne */}
                            <div className="md:hidden bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Avatar
                                            isBordered
                                            radius="full"
                                            size="sm"
                                            src={item?.avatarUrl ? createUrlFile(item.avatarUrl ?? "", "backend") : "assets/images/avatar.png"}
                                        />
                                        <p className="font-semibold text-slate-500 truncate">{item.nomComplet}</p>
                                    </div>
                                    <DropDownActionPerformance id={item.id} />
                                </div>

                                <div className="inline-flex bg-red-500 items-center rounded-md text-white text-xs py-1.5 px-2">
                                    {creneauLabel}
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs text-gray-400">En cours</span>
                                    <div className="flex flex-wrap items-center gap-2">{dayButtons}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {fnProgressionPerformance(item)}
                                    <span className="text-sm">Performance {fnPerformance(item)}</span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-xs text-gray-400">Commission</h3>
                                        <h4 className="text-lg">{item.commission}</h4>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-xs text-gray-400">Prime</h3>
                                        <h4 className="text-lg">{item.prime}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}

                    {/* Pagination UI */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 space-x-2">
                            <button
                                disabled={page === 0}
                                onClick={() => handlePageChange(page - 1)}
                                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
                            >
                                Précédent
                            </button>

                            <span className="px-4 py-2 bg-white border rounded">
                                Page {page + 1} / {totalPages}
                            </span>

                            <button
                                disabled={page === totalPages - 1}
                                onClick={() => handlePageChange(page + 1)}
                                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
