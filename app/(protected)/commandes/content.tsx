"use client";

import Orders from "./components/orders";
import { title } from "@/components/primitives";
import { Restaurant, Order, PageResponse, OrderStats } from "@/types/models";

type ContentProps = {
    commandesInitiales: PageResponse<Order> | null;
    restaurants: Restaurant[];
    stats: OrderStats | null;
};

export default function Content({ commandesInitiales, restaurants, stats }: ContentProps) {
    
    return (
        <div className="w-full h-full flex flex-col gap-6 mb-4 p-2">
            <div className="flex items-center">
                <h5 className={title({ size: "h5", class: "text-primary" })}>Mes Commandes</h5>
            </div>          
            <Orders commandesInitiales={commandesInitiales} restaurants={restaurants} stats={stats} />
        </div>
    );
}
