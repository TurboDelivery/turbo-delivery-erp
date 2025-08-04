
import { Paginations } from "@/components/commons/paginations";
import { useListeRestaurantController } from "@/components/dashboard/trafic/file-attente/liste-restaurant.controller";
import { FilleAttenteVM, ILocalDataTime } from "@/types/file-attente.model";
import Link from "next/link";

interface Props {
    datas?: FilleAttenteVM[];
}

function toTimeString(heure?: ILocalDataTime | string): string {
    if (typeof heure === 'string') return heure;
    if (!heure || typeof heure !== 'object') return '00:00';

    const h = heure.hour?.toString().padStart(2, '0') ?? '00';
    const m = heure.minute?.toString().padStart(2, '0') ?? '00';
    return `${h}:${m}`;
}
  
export function ListeRestaurants({ datas }: Props) {
    const ctrl = useListeRestaurantController({ datas })

    return (
        <>
            <div className="container mx-auto  overflow-auto">
                <div className="w-[500px] lg:w-full xl:w-full md:w-full mt-4 bg-white rounded-lg p-4 overflow-auto">
                    <div className="grid grid-cols-4 font-semibold text-gray-500 p-2 border-b">
                        <span>Rang</span>
                        <span>Nom et prénoms</span>
                        <span>Date</span>
                    </div>
                    {
                        ctrl.paginationDatas && ctrl.paginationDatas.length > 0 &&
                            [...ctrl.paginationDatas]
                                .filter((item, index, self) =>
                                    index === self.findIndex(other =>
                                        (item.nomComplet ?? '').trim().toLowerCase() === (other.nomComplet ?? '').trim().toLowerCase() &&
                                        (item.position ?? 0) === (other.position ?? 0) &&
                                        (item.dateJour ?? '') === (other.dateJour ?? '') &&
                                        toTimeString(item.heureJour) === toTimeString(other.heureJour)
                                    )
                                )
                                .sort((a, b) => {
                                    const posA = a.position ?? 0;
                                    const posB = b.position ?? 0;
                                    if (posA !== posB) return posA - posB;
                                
                                    const heureA = toTimeString(a.heureJour);
                                    const heureB = toTimeString(b.heureJour);
                                    if (heureA !== heureB) return heureA.localeCompare(heureB);
                                
                                    return (a.nomComplet ?? '').localeCompare(b.nomComplet ?? '');
                                })
                                .map((item: FilleAttenteVM, index: number) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-4 items-center gap-4 p-3 border-b cursor-pointer hover:bg-gray-200"
                                >
                                    <span className="px-3 py-1 rounded-lg border-3 hover:border-white card text-sm">
                                        {index + 1}
                                    </span>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full" />
                                        <span className="font-semibold">{item.nomComplet}</span>
                                    </div>
                                    <span className="text-red-500 font-bold">
                                        {item.dateJour} {toTimeString(item.heureJour)}
                                    </span>
                                    <Link href={`/trafic/file-attente/${item.id}`}>
                                        <span className="text-blue-500 text-right">Ajourner</span>
                                    </Link>
                                </div>
                            ))
                    }                        
                </div>
            </div>
            <Paginations currentPage={ctrl.currentPage} setCurrentPage={ctrl.setCurrentPage}
                prevPage={ctrl.prevPage} datas={datas} className="mt-3" />
        </>

    )
}
