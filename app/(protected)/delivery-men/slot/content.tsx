'use client'
import { useState } from "react";
import { PaginatedResponse } from "@/types";
import { LivreurBird } from "@/types/creneau-bird";
import AllModelView from "@/components/dashboard/delivery-men/slot/assignes/all-model-view";
import { getAllCreneauBird } from "@/src/creneau-livreur/creneau-livreur.action";
import EmptyDataTable from "@/components/commons/EmptyDataTable";

interface Props {
    initialData: PaginatedResponse<LivreurBird> | null;
}

export default function Content({ initialData }: Props) {
    const [page, setPage] = useState(initialData?.number || 0);
    const [data, setData] = useState(initialData);
    const [value, setValue] = useState<'list' | 'grid'>('list');
    const [search, setSearch] = useState<string>("");

    const handlePageChange = async (newPage: number) => {
        const newData = await getAllCreneauBird(newPage, 10, search);
        setData(newData);
        setPage(newPage);
    };

    const handleSearch = async (keysearch: string) => {
        setSearch(keysearch);
        const newData = await getAllCreneauBird(0, 10, keysearch); // reset page à 0
        setData(newData);
        setPage(0);
    };

    if (!data) return (
        <EmptyDataTable
            title="Aucune Livreur trouvé"
            message="Aucune livreur correspondant à vos critères de recherche ou de filtre."
        />
    );

    return (
        <div className="p-4 bg-gray-100 min-h-screen rounded-md">
            <AllModelView
                value={value}
                setValue={setValue}
                birdCreneau={data.content.filter(b => b.disponibiliteCreneau)}
                birdNotCreneau={data.content.filter(b => !b.disponibiliteCreneau)}
                onSearch={handleSearch} // 👈 nouveau prop
            />

            {/* Pagination */}
            <div className="flex justify-center mt-6 space-x-2">
                <button
                    disabled={data.first}
                    onClick={() => handlePageChange(page - 1)}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    Précédent
                </button>

                <span className="px-4 py-2 bg-white border rounded">
                    Page {page + 1} / {data.totalPages}
                </span>

                <button
                    disabled={data.last}
                    onClick={() => handlePageChange(page + 1)}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    Suivant
                </button>
            </div>
        </div>
    );
}
