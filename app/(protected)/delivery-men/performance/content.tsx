'use client'
import { PaginatedResponse } from "@/types";
import useContentCtx from "./useContentCtx";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import UserListPerformanceBird from "@/components/dashboard/delivery-men/performance/user-list-performance-bird";

interface Props {
    initialData: PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null;
}

export default function Content({ initialData }: Props) {
    const { data } = useContentCtx({ initialData })

    if (!data || data.length == 0) {
        return <EmptyDataTable title="Aucun livreur" />
    }

    return ( <UserListPerformanceBird data={data} /> )
}