import { ProgressBar, Label } from '@/components/heroui';
import { Livreur } from "@/types/creneau-turbo";

// :{turboys:Livreur}
const progresseBare = (turboys: Livreur) => {

    const fnData = () => {
        const mois = turboys.creneauVM.jourDebut?.substring(5, 7);
        const jourDebut = turboys.creneauVM.jourDebut?.substring(8, 10);
        const jourFin = turboys.creneauVM.jourFin?.substring(8, 10);

        let moi

        const fnMois = () => {
            switch (mois) {
                case "01":
                    return moi = "Janv"
                    break;
                case "02":
                    return moi = "Fev"
                    break;
                case "03":
                    return moi = "Mars"
                    break;
                case '04':
                    return moi = "Avril"
                    break;
                case '05':
                    return moi = "Mais"
                    break;
                case "06":
                    return moi = "Juin"
                    break;
                case "07":
                    return moi = "Jull"
                    break;
                case "08":
                    return moi = "Aout"
                    break;
                case "09":
                    return moi = "Sept"
                    break;
                case "10":
                    return moi = "Oct"
                    break;
                case "11":
                    return moi = "Nov"
                    break;
                case "12":
                    return moi = "Des"
                    break;
                default:
            }
        }

        fnMois()

        return `${jourDebut}-${jourFin} ${moi} (${turboys.jour.jourTravaille}/7jours)`
    }


    if (turboys.creneauVM?.jourDebut && turboys.creneauVM?.jourFin) {

        // Meme correctif que sur progression-barre2 : l'etiquette annonce « x/7jours »
        // et le remplissage valait 100, 65 ou 20 sans rapport avec x. 5 jours sur 7,
        // soit 71 %, donnait la meme barre que 4 sur 7, soit 57 %.
        const valeur = Math.min(100, Math.max(0, (turboys.jour.jourTravaille / 7) * 100));

        if (turboys.jour.jourTravaille === 7) {
            return <ProgressBar color="success" className="max-w-md text-sm flex-none" value={valeur}><Label>{fnData()}</Label><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
        }
        if (turboys.jour.jourTravaille < 7 && turboys.jour.jourTravaille > 3) {
            return <ProgressBar color="warning" className="max-w-md text-sm flex-none" value={valeur}><Label>{fnData()}</Label><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
        }
        if (turboys.jour.jourTravaille <= 3) {

            return <ProgressBar color="danger" className="max-w-md text-sm flex-none" value={valeur}><Label>{fnData()}</Label><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
        }
    } else {
        return <ProgressBar className="max-w-md text-sm" value={0}><Label>Date créneau vide</Label><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
    }
}

export default progresseBare