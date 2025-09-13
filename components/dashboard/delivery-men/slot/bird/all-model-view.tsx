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
            <div className="mt-6">
                <h2 className="text-lg font-semibold bg-white text-center w-full rounded-md shadow py-2 mb-2">TURBOYS SANS CRENEAU HORAIRE</h2>
                <EmptyDataTable />
            </div>
        )
    }

    const style1 = 'flex flex-col gap-1 rounded-lg  overflow-x-auto'
    const style2 = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'

    return (
        <div className="mb-10">
            <div className="flex gap-60">
                <h2 className="text-lg font-semibold bg-white text-center w-full rounded-md shadow py-2 mb-2">TURBOYS SANS CRENEAU HORAIRE</h2>
            </div>

            <div className={value === 'list' ? style1 : style2}>
                {birdNotCreneau.map((turboy, index) => {
                    return value === 'list' ? (
                        <UserListeModel1 key={turboy.id ?? index} turboy={turboy} />
                    ) : (
                        <UserListeModel2 key={turboy.id ?? index} turboy={turboy} />
                    )
                })}
            </div>
        </div>
    )
}