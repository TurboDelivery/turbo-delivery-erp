'use client';
import { LivreurBird } from '@/types/creneau-bird';
// import DropDownAction from './dropDownAction';
// import CreneauxDetail from './progression-details/creneaux-detail';
// import progresseBare from '../delivery-men/progression/progression-barre';
import { IconPointFilled } from '@tabler/icons-react';
import DropDownAction from './dropDownAction';
import progresseBare from '../progression/progression-barre';
import { Avatar } from '@/components/heroui';
import { createUrlFile } from '@/utils/createUrlFile';
import { formatDate } from '@/utils/date-formate';

interface props {
    turboy: LivreurBird;
}
export default function UserListeModel1({ turboy }: props) {
    const dispoIndicator = (
        <span className="relative flex items-center">
            {turboy.disponibilite ? <IconPointFilled color="#16B84E" size={30} /> : <IconPointFilled color="#FF0000" size={30} />}
            {turboy.disponibilite ? (
                <span className="absolute top-[-3px] inline-flex h-full w-full animate-ping duration-3000 rounded-full bg-success/50 opacity-75 ltr:left-[-3px] rtl:right-[-3px]"></span>
            ) : (
                ''
            )}
        </span>
    );

    return (
        <>
            {/* Ligne dense — desktop uniquement (≥ md) */}
            <div className="hidden md:block overflow-x-auto overflow-y-hidden hide-scrollbar">
                <div key={turboy.id} className="bg-surface w-full min-w-[1000px] flex items-center border-2 rounded-md">
                    <div className="shrink-0 py-2 px-4 flex-1 flex lg:justify-between gap-2 items-center rounded-md">
                        <div className="max-w-[300px] flex items-center w-1/2 gap-2">
                            <Avatar isBordered radius="full" size="md" src={turboy?.avatar ? createUrlFile(turboy?.avatar ?? '', 'backend') : 'assets/images/avatar.png'} />
                            <p className="font-semibold">{turboy.nomComplet}</p>
                        </div>
                        <p className="w-1/2 text-sm text-muted">Inscrit le : {turboy.dateInscrit ? formatDate(turboy.dateInscrit, 'DD/MM/YYYY') : '-'}</p>
                    </div>

                    <div className="shrink-0 pr-8 flex-1 flex lg:justify-between items-center">
                        <p className="text-sm text-muted mr-3">Défini le : {turboy.dateDefiniEmploiTemps ? formatDate(turboy.dateDefiniEmploiTemps, 'DD/MM/YYYY') : '-'}</p>
                        <div className="relative flex gap-2">
                            {progresseBare(turboy)}
                            <span className="relative flex items-end mt-6">{dispoIndicator}</span>
                        </div>

                        <span className='pl-16 lg:pl-0'>
                            <DropDownAction id={turboy.id} />
                        </span>
                    </div>
                </div>
            </div>

            {/* Carte tactile — mobile (< md), mêmes données / handlers que la ligne */}
            <div className="md:hidden bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Avatar isBordered radius="full" size="sm" src={turboy?.avatar ? createUrlFile(turboy?.avatar ?? '', 'backend') : 'assets/images/avatar.png'} />
                        <p className="font-semibold truncate">{turboy.nomComplet}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {dispoIndicator}
                        <DropDownAction id={turboy.id} />
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted shrink-0">Inscrit le</span>
                    <span className="text-sm text-foreground text-right">{turboy.dateInscrit ? formatDate(turboy.dateInscrit, 'DD/MM/YYYY') : '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted shrink-0">Défini le</span>
                    <span className="text-sm text-foreground text-right">{turboy.dateDefiniEmploiTemps ? formatDate(turboy.dateDefiniEmploiTemps, 'DD/MM/YYYY') : '-'}</span>
                </div>
                <div className="pt-1">{progresseBare(turboy)}</div>
            </div>
        </>
    );
}
