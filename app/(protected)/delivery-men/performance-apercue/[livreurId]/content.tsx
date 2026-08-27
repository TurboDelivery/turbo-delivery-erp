'use client'

import ButtonRetour from "@/components/commons/bouton-retour";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import SectionHeaderRetour from "@/components/commons/section-header-retour";
import TableCreneau from './table-creneau'
import { PerformanceCreneauId } from "@/types/performance-creneauId";
import { Card } from "@/components/heroui";
import ListPerformanceApercu from "@/components/dashboard/delivery-men/performance-apercu/list-performance";
import { LivreurDetail } from "@/types/livreur";
import { IconChevronDown } from "@tabler/icons-react";

interface Props {
  data: PerformanceCreneauId;
  infoUser:LivreurDetail

  // PerformanceCreneauId
    
}

export default function Content({data,infoUser}:Props){
  
  
    return (
      <>
          <div>
              <div className="flex items-center pb-5">
                <ButtonRetour/>
                <h1 className="text-2xl font-bold text-primary">Aperçu Performance</h1>
               </div>
               <div className="pb-7">
                 <div className="font-semibold flex items-center justify-between max-w-sm bg-slate-100 px-2 py-2 border-2 rounded-xl">
                  <p className="text-slate-500 text-[18px]">{infoUser.nom} {infoUser.prenoms}</p>
                  <IconChevronDown stroke={2} />
                 </div>
               </div>
               
                <ListPerformanceApercu data={data} infoUser={infoUser} />          
          </div>
      </>
    )
}