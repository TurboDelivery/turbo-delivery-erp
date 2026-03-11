import { title } from '@/components/primitives';
import { formatNumber } from '@/utils/formatNumber';
import { Divider } from "@heroui/react";
import { ChevronRight } from 'lucide-react';

export default function DatabaseCards({ items }: { items: { label: string; value: number }[] }) {
    return (
        <div className="flex gap-4 overflow-auto py-8  ">
            {items.map((item, index) => (
                <div key={index} className="shrink-0   min-w-40 flex justify-between items-center gap-4">
                    <CardContent {...item} />
                    {(index != items.length - 1 || index == 0)}
                </div>
            ))}
        </div>
    );
}

export function CardContent({ label, value }: { label: string; value: number }) {
    // Cas spécial pour "Turboys" - disposition en deux colonnes
    if (label === 'Turboys') {
        return (
            <div className="flex items-center  gap-10 w-full">
                {/* Colonne gauche: Titre et valeur */}
                <div className="flex flex-col gap-12 ">
                    <h3 className={title({ size: 'h6', class: 'text-primary' })}>{label}</h3>
                    <p className={title({ size: 'h4' })}>{formatNumber(value ?? 0)}</p>
                </div>
                {/* Colonne droite: Deux accordéons superposés */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                    <div className=" text-gray-500 px-2 py-1 rounded text-base font-medium text-center">
                        Indépendants
                        <ChevronRight className="inline-block ml-1" size={14} />
                    </div>
                    <Divider />
                    <div className=" text-gray-500 text-base px-2 py-1 rounded font-medium text-center">
                        Journaliers
                        <ChevronRight className="inline-block ml-1" size={14} />
                    </div>
                </div>
            </div>
        );
    }
    
    // Cas par défaut - disposition normale
    return (
        <div>
            <div className="flex flex-col justify-between gap-12">
                <h3 className={title({ size: 'h6', class: 'text-primary' })}>{label}</h3>
                <p className={title({ size: 'h4' })}>{formatNumber(value ?? 0)}</p>
            </div>
        </div>
    );
}
