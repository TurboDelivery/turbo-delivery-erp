'use client';

import { LivreurTrafic } from '@/types/models';
import { Avatar, Divider } from "@heroui/react";
import { createUrlFile } from '@/utils/createUrlFile';

interface LivreursListProps {
    title: string;
    data: LivreurTrafic[];
    handleCourierSelect: (courierId: string) => void;
}

export function LivreurTimeline({ title, data, handleCourierSelect }: LivreursListProps) {

    const handleClick = (id: string) => {
        handleCourierSelect(id);
    };

    return (
        <div className="w-full mx-auto mt-8">
            <h2 className="lg:text-xl font-bold text-primary mb-4">{ title }</h2>

            { data.length === 0 ? (
                <p className="text-gray-500 italic">Aucun livreur</p>
            ) : (
                <div className="flex gap-2 flex-nowrap overflow-auto scrollbar-thin">
                    { data.map((item, index) => (
                        <div onClick={() => handleClick(item.livreurId)} key={item.livreurId} className="shrink-0 flex items-center gap-2 cursor-pointer">
                            <Avatar src={createUrlFile(item.avatarUrl, 'backend')}
                                alt={item.nomComplet} className="w-8 h-8 border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                            />
                            <span className="text-xs font-medium text-gray-800 text-center">{item.nomComplet}</span>
                            {index !== data.length - 1 && ( <Divider orientation="vertical" /> )}
                        </div>
                    )) }
                </div>
            ) }
        </div>
    );
}

