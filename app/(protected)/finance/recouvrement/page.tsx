import { PretList } from "@/feature-finance/revenus/components/recouvrement/prets/pret-list";
import { prefetchPretListQuery } from "@/feature-finance/revenus/queries/prets/pret-list.query";
import { RecouvrementList } from "@/feature-finance/revenus/components/recouvrement/recouvrement-pret/recouvrement-list";
import { prefetchRecouvrementListQuery } from "@/feature-finance/revenus/queries/recouvrement/recouvrement-list.query";
import RecouvrementGraphs from "@/feature-finance/revenus/components/recouvrement/recouvrement";

export default function Recouvrement() {
    prefetchPretListQuery({
        page: 1,
        limit: 10,
    })
    prefetchRecouvrementListQuery({
        page: 1,
        limit: 10,
    })
    return (
        <div>
            <RecouvrementGraphs />
            <PretList/>
            <RecouvrementList/>
        </div>
    )
}