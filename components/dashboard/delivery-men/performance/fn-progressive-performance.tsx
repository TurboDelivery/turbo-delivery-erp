// import { Livreur } from "@/types/creneau-bird"
import { BirdPerformance } from "@/types/slot";
import { CircularProgress } from "@/components/heroui"

// :{turboys:Livreur}
  const fnProgressionPerformance =(item:LivreurPerformanceBirdEndTorubo)=>{

            if(item.performance<=35){
                return <CircularProgress color="danger" showValueLabel={true} size="lg" value={item.performance} />

                }
            if(item.performance>35&&item.performance<=70){
                return <CircularProgress color="warning" showValueLabel={true} size="lg" value={item.performance} />

                }
            /*
             * `if (item.performance = 100)` — une AFFECTATION, pas une comparaison.
             *
             * L'expression valait 100, donc toujours vraie : toute performance superieure
             * a 70 tombait dans cette branche. Et comme l'affectation MODIFIE l'objet,
             * la valeur rendue devenait 100 elle aussi : un livreur a 72 % s'affichait
             * en anneau vert plein, et l'objet restait corrompu pour tout ce qui le
             * lisait ensuite dans le meme rendu.
             */
            if(item.performance>70){
                return <CircularProgress color="success" showValueLabel={true} size="lg" value={item.performance} />

                }

              // Performance absente ou hors bornes : on ne rend rien plutot qu'un anneau
              // qui affirmerait une valeur. `'null'` renvoyait la chaine, pas le vide.
              return null

        }

        
        


export default fnProgressionPerformance