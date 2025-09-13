import EmptyDataTable from "@/components/commons/EmptyDataTable";
import { LivreurBird } from "@/types/creneau-bird";
import { formatDate } from "@/utils/date-formate";


export default function UserListBird({ birdNotCreneau }: { birdNotCreneau: LivreurBird[] }) {


    if (!birdNotCreneau || birdNotCreneau.length == 0) {
        return (
            <div>
                <h2 className="text-lg font-semibold bg-white text-center w-full rounded-md shadow py-2 mb-2">TURBOYS SANS CRENEAU HORAIRE</h2>
                <EmptyDataTable />
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-lg font-semibold bg-white text-center w-full rounded-md shadow py-2 mb-2">TURBOYS SANS CRENEAU HORAIRE</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {birdNotCreneau.map((turboy) => (
                    <div key={turboy.id} className="border-b border-gray-200 last:border-0">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                                <div>
                                    <p className="font-semibold">{turboy.nomComplet}</p>
                                    <p className="text-sm text-gray-500">Inscrit le : {turboy.dateInscrit ? formatDate(turboy.dateInscrit, 'DD/MM/YYYY') : '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <p className="text-sm text-gray-500 mr-3">Créé le : {turboy.dateNonDefini ? formatDate(turboy.dateNonDefini, 'DD/MM/YYYY') : '-'}</p>
                                <div className="relative"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}