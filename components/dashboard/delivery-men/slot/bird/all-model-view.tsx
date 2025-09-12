import { IconLayoutGrid, IconListCheck } from "@tabler/icons-react"
// import UserListeModel2 from "./user-liste-model-2"
// import UserListeModel1 from "./user-liste-model-1"
import { LivreurBird } from "@/types/creneau-bird"
import UserListeModel1 from "../user-liste-model-1";
import UserListeModel2 from "../user-liste-model-2";
import EmptyDataTable from "@/components/commons/EmptyDataTable";

interface props {
    value: 'list' | 'grid',
    birdNotCreneau: LivreurBird[],
    setValue: (value: 'list' | 'grid') => void;
}

export default function AllModelViewNotCreneau({ value, birdNotCreneau, setValue }: props) {

    if (!birdNotCreneau || birdNotCreneau.length == 0) {
        return (
            <div className="mt-16">
                <h2 className="text-2xl ">Turboys sans créneaux</h2>
                <EmptyDataTable />
            </div>
        )
    }

    const style1 = 'bg-white flex flex-col gap-1 rounded-lg  overflow-x-auto'
    const style2 = ' grid gap-6 md:grid-cols-2 lg:grid-cols-3'

    return (
        <div className="mb-6 bg">
            <div className="flex gap-60 pb-5">
                <h2 className="text-xl">Turboys sans créneaux</h2>
            </div>

            <div className={`${value === 'list' && style1}${value === 'grid' && style2}`}>
                {birdNotCreneau.map((turboy, index) => {
                        if (value == 'list') return <UserListeModel1 key={index} turboy={turboy} />
                        if (value == 'grid') return <UserListeModel2 key={index} turboy={turboy} />
                    }
                )}
            </div>
        </div>
    )
}