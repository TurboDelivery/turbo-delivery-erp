"use client"

import { IDepense } from "../../types/depense.type";
import DepenseQuotidienne from "./graph_mansuel"
import { RepartionPieDonutDepense } from "./repartion-pie-depense"


interface depensesProps {
    depenses: IDepense[];
}
export default function RepartitionDepense({ depenses }: depensesProps) {
    return (
        <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4 justify-center items-stretch">
          <div className="min-h-[300px] sm:min-h-[350px]">
            <RepartionPieDonutDepense depenses={depenses} />
          </div>
          <div className="min-h-[300px] sm:min-h-[350px]">
            <DepenseQuotidienne depenses={depenses} />
          </div>
        </div>
      </div> 
    )
}       