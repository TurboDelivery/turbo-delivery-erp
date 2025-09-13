import { useState, useEffect } from "react";
import { IconLayoutGrid, IconListCheck, IconSearch } from "@tabler/icons-react";
import UserListeModel2 from "../user-liste-model-2";
import UserListeModel1 from "../user-liste-model-1";
import { LivreurBird } from "@/types/creneau-bird";
import EmptyDataTable from "@/components/commons/EmptyDataTable";

interface Props {
    value: 'list' | 'grid';
    birdCreneau: LivreurBird[];
    birdNotCreneau: LivreurBird[];
    setValue: (value: 'list' | 'grid') => void;
    onSearch: (text: string) => void; // 👈 ajout
}
  
export default function AllModelView({ value, birdCreneau, birdNotCreneau, setValue, onSearch }: Props) {
    const [search, setSearch] = useState<string>("");
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(search);
    };

    // Si aucune donnée
    if ((!birdCreneau || birdCreneau.length === 0) && (!birdNotCreneau || birdNotCreneau.length === 0)) {
        return (
            <div className="mb-6">
                {/* Recherche + List/Grid */}
                <div className="flex items-center gap-4 mb-4">
                    {/* Zone recherche (input + bouton) */}
                    <form 
                        onSubmit={handleSubmit} 
                        className="flex items-center flex-1 gap-2"
                    >
                        <input
                        type="text"
                        placeholder="Rechercher un livreur par son nom ou son prenom..."
                        value={search}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                        <button 
                        type="submit" 
                        className="p-2 bg-primary text-white rounded flex items-center justify-center"
                        >
                            <IconSearch size={18} />
                        </button>
                    </form>

                    {/* Boutons de switch list/grid */}
                    <div className="flex gap-2">
                        <button
                        type="button"
                        className={`btn btn-outline-primary p-1 ${value === 'list' ? 'bg-primary text-white' : ''}`}
                        onClick={() => setValue('list')}
                        >
                        <IconListCheck />
                        </button>

                        <button
                        type="button"
                        className={`btn btn-outline-primary p-1 ${value === 'grid' ? 'bg-primary text-white' : ''}`}
                        onClick={() => setValue('grid')}
                        >
                        <IconLayoutGrid />
                        </button>
                    </div>
                </div>
                <EmptyDataTable />
            </div>
        );
    }

    const styleList = 'flex flex-col gap-1 rounded-lg overflow-x-auto';
    const styleGrid = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';

    return (
        <div className="mb-6">
            {/* Recherche + List/Grid */}
            <div className="flex items-center gap-4 mb-4">
                {/* Zone recherche (input + bouton) */}
                <form 
                    onSubmit={handleSubmit} 
                    className="flex items-center flex-1 gap-2"
                >
                    <input
                    type="text"
                    placeholder="Rechercher un livreur par son nom ou son prenom..."
                    value={search}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <button 
                    type="submit" 
                    className="p-2 bg-primary text-white rounded flex items-center justify-center"
                    >
                        <IconSearch size={18} />
                    </button>
                </form>

                {/* Boutons de switch list/grid */}
                <div className="flex gap-2">
                    <button
                    type="button"
                    className={`btn btn-outline-primary p-1 ${value === 'list' ? 'bg-primary text-white' : ''}`}
                    onClick={() => setValue('list')}
                    >
                    <IconListCheck />
                    </button>

                    <button
                    type="button"
                    className={`btn btn-outline-primary p-1 ${value === 'grid' ? 'bg-primary text-white' : ''}`}
                    onClick={() => setValue('grid')}
                    >
                    <IconLayoutGrid />
                    </button>
                </div>
            </div>

            {/* TURBOYS AVEC CRENEAU */}
            <h2 className="text-lg font-semibold bg-white text-center w-full rounded-md shadow py-2 mb-2">
                TURBOYS AVEC CRENEAU HORAIRE
            </h2>
            <div className={`mb-4 ${value === 'list' ? styleList : styleGrid}`}>
                {birdCreneau.length > 0 ? (
                    birdCreneau.map((turboy, index) =>
                        value === 'list' ? <UserListeModel1 key={turboy.id ?? index} turboy={turboy} /> :
                        <UserListeModel2 key={turboy.id ?? index} turboy={turboy} />
                    )
                ) : (
                    <p className="text-center py-4 text-gray-500 col-span-full">Aucun livreur trouvé</p>
                )}
            </div>

            {/* TURBOYS SANS CRENEAU */}
            {birdNotCreneau.length > 0 && (
                <>
                    <h2 className="text-lg font-semibold bg-white text-center w-full rounded-md shadow py-2 mt-10 mb-2">
                        TURBOYS SANS CRENEAU HORAIRE
                    </h2>
                    <div className={`${value === 'list' ? styleList : styleGrid}`}>
                        {birdNotCreneau.map((turboy, index) =>
                            value === 'list' ? <UserListeModel1 key={turboy.id ?? index} turboy={turboy} /> :
                            <UserListeModel2 key={turboy.id ?? index} turboy={turboy} />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
