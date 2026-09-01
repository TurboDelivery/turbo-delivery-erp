// import { Livreur } from "@/types/creneau-bird"
import { BirdPerformance } from "@/types/slot";
import { Progress } from "@/components/heroui"

// :{turboys:Livreur}
  const progresseBare2 =(turboys:CreneauProgressionBird)=>{

            // Le REMPLISSAGE valait un palier forfaitaire (100, 65 ou 20) alors que
            // l'etiquette affichait, elle, le vrai pourcentage : un livreur a 82 %
            // voyait une barre remplie a 65 % sous l'etiquette « 82% ». La couleur par
            // palier reste (c'est un choix de lecture), le remplissage suit la donnee.
            const valeur = Math.min(100, Math.max(0, turboys.progression));

            if(turboys.progression>=100){
              return <Progress label={turboys.progression +'%'}   color="success" className="max-w-md"  value={valeur} />
            }
            if(turboys.progression<100 && turboys.progression>=65){
                return <Progress label={turboys.progression +'%'}   color="warning" className="max-w-md"  value={valeur} />
                }

            // Dernier cas, sans condition : la version precedente testait `< 65` puis
            // retombait sur la CHAINE 'null' si rien ne matchait — ce qui arrivait des
            // que `progression` depassait 100.
            return <Progress label={turboys.progression +'%'}   color="danger" className="max-w-md"  value={valeur} />

        }

        
        


export default progresseBare2