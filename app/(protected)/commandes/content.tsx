"use client";

import { useState } from "react";
import { Order } from "@/types/models";
import Orders from "./components/orders";
import { title } from "@/components/primitives";

type ContentProps = {
    commandesInitiales: PageResponse<Order> | null;
};

export interface Pageable {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
}

export interface PageResponse<T> {
    content: T[];
    pageable: Pageable;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    empty: boolean;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
}

export default function Content({ commandesInitiales }: ContentProps) {
    const [commandes, setCommandes] = useState(commandesInitiales);
    return (
        <div className="w-full h-full flex flex-col gap-6 mb-4 p-2">
            <div className="flex items-center">
                <h5 className={title({ size: "h5", class: "text-primary" })}>Mes Commandes</h5>
            </div>                     
            <Orders commandesInitiales={commandes} />
        </div>
    );
}
