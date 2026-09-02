import { ProgressBar } from '@/components/heroui';
// import { Livreur } from "@/types/creneau-bird"
import { BirdPerformance } from "@/types/slot";

// :{turboys:Livreur}
  const progresseBarePerformance =(item:Progression)=>{

            if(item.heure==8){
            return <ProgressBar color="success" className="max-w-[100px]" value={100}><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
            }
            if(item.heure==7){
                return <ProgressBar color="warning" className="max-w-[100px]" value={85}><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
                }
            if(item.heure<7&& item.heure>0 ){
              return <ProgressBar color="warning" className="max-w-[100px]" value={item.progression}><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
              }
            if(item.heure==0){
                
                return <ProgressBar color="danger" className="max-w-[100px]" value={5}><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
                }

          

              return <ProgressBar color="danger" className="max-w-[100px]" value={0}><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>

        }

        
        


export default progresseBarePerformance