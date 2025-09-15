import { PaginatedResponse } from "@/types";
import { BirdPerformance } from "@/types/slot";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";


interface props {
    initialData: PaginatedResponse<CreneauProgressionBird> | null
}

export default function useContentCtx({ initialData }: props) {

    const searchParams = useSearchParams();
    const textParam = searchParams.get('text');
    const [search, setSearch] = useState<string | null>(null)
    const [data, setData] = useState<PaginatedResponse<CreneauProgressionBird> | null>(initialData);

    useEffect(() => {
        // Initialiser search à partir de textParam
        setSearch(textParam);

        // Si search n'est pas vide, filtrer les données
        if (search !== null && search.trim() !== "") {
            
        } else {
            // Si search est vide, restaurer la liste initiale
            setData(initialData);
        }

    }, [search, textParam, initialData]);



    return { data }
}