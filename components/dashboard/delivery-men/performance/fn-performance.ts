import { BirdPerformance } from "@/types/slot";
import { Progress } from "@/components/heroui"

const fnPerformance = (item:LivreurPerformanceBirdEndTorubo) => {

    if(item.performance <= 20) {
        return "Faible"
    }
    
    if(item.performance >= 21 &&item.performance <= 50) {
        return "Moyenne"
    }

    if( item.performance>=51 && item.performance < 100 ){
        return "Forte";
    }

    if(item.performance == 100) {
        return "Très Forte";
    }

    return 'null'
}    

export default fnPerformance