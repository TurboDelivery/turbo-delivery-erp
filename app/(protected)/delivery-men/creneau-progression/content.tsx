'use client'
import TableCreneau from "./tableCreneau";
import useContentCtx from "./useContentCtx";
import { PaginatedResponse } from "@/types";
import EmptyDataTable from "@/components/commons/EmptyDataTable";

interface props {
    initialData: PaginatedResponse<CreneauProgressionBird> | null
}

export default function Content({ initialData }: props) {
    const { data } = useContentCtx({ initialData })

    if (!data || data.content.length == 0) {
        return <EmptyDataTable />
    }

    return (
        <TableCreneau initialData={data} />
    )
}