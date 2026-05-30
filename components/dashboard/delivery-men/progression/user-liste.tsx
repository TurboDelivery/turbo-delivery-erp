import { BirdPerformance } from '@/types/slot';
import { Pagination, Progress } from '@heroui/react';
import progresseBare2 from './progression-barre2';

const UserListe = ({ initialData }: { initialData: CreneauProgressionBird[] }) => {
  
  
    return (
    <div className="panel mt-5 overflow-hidden border-0 p-0">
      {/* Table — desktop uniquement (≥ md) */}
      <div className="table-responsive hidden md:block">
        <table className='table-striped table-hover'>
            <thead>
                <tr >
                    <th >Nom du coursier</th>
                    <th >Progression</th>
                    <th >Jour</th>
                    <th>Début</th>
                    <th >Fin</th>
                </tr>
            </thead>

          <tbody>
            {initialData.map((item) => {
              return (
                <tr key={item.id}>
                  <td>{item.nomComplet}</td>
                  <td>{progresseBare2(item)}</td>
                  <td>{item.jour.jourNonTravaille}/{item.jour.jourTravaille}</td>
                  <td>{item.creneauVM.jourDebut}</td>
                  <td>{item.creneauVM.jourFin}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile — cartes tactiles (mêmes données que le tableau) */}
      <div className="md:hidden space-y-3 p-4">
        {initialData.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
            <p className="text-sm font-semibold text-gray-900">{item.nomComplet}</p>
            <div>{progresseBare2(item)}</div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400 shrink-0">Jour</span>
              <span className="text-sm text-gray-700 text-right">{item.jour.jourNonTravaille}/{item.jour.jourTravaille}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400 shrink-0">Début</span>
              <span className="text-sm text-gray-700 text-right">{item.creneauVM.jourDebut}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400 shrink-0">Fin</span>
              <span className="text-sm text-gray-700 text-right">{item.creneauVM.jourFin}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default UserListe;
