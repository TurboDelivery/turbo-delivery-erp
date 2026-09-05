import { ProgressBar, Label } from '@heroui-v3/react';
// import { Livreur } from "@/types/creneau-bird"
import { BirdPerformance } from "@/types/slot";

// :{turboys:Livreur}
  const progresseBare2 =(turboys:CreneauProgressionBird)=>{

            // Le REMPLISSAGE valait un palier forfaitaire (100, 65 ou 20) alors que
            // l'etiquette affichait, elle, le vrai pourcentage : un livreur a 82 %
            // voyait une barre remplie a 65 % sous l'etiquette « 82% ». La couleur par
            // palier reste (c'est un choix de lecture), le remplissage suit la donnee.
            const valeur = Math.min(100, Math.max(0, turboys.progression));

            if(turboys.progression>=100){
              return <ProgressBar color="success" className="max-w-md" value={valeur}><Label>{turboys.progression +'%'}</Label><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
            }
            if(turboys.progression<100 && turboys.progression>=65){
                return <ProgressBar color="warning" className="max-w-md" value={valeur}><Label>{turboys.progression +'%'}</Label><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
                }

            // Dernier cas, sans condition : la version precedente testait `< 65` puis
            // retombait sur la CHAINE 'null' si rien ne matchait — ce qui arrivait des
            // que `progression` depassait 100.
            return <ProgressBar color="danger" className="max-w-md" value={valeur}><Label>{turboys.progression +'%'}</Label><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>

        }

        
        


export default progresseBare2