"use client"

import LivraisonAnalyseChart from "./graph"
import LastLivraison from "./last-livraison/last-livraison"
import { ILivraison } from "@/feature-finance/revenus/types/livraison.types"

export default function LivraisonAnalyse({livraison}: {livraison: ILivraison[]}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
            <div className="lg:col-span-2 mt-4">
                <LivraisonAnalyseChart livraison={livraison} />
            </div>
            <div className="lg:col-span-1">
                <LastLivraison lastlivraisons={livraison}/>
            </div>
        </div>
    )
}