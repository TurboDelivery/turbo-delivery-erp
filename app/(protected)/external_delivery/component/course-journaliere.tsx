'use client';

import React from 'react';
import Link from 'next/link';
import { Restaurant } from '@/types/models';



interface CourseJournaliereProps {
    restaurant: Restaurant;
}

const CourseJournaliere: React.FC<CourseJournaliereProps> = ({ restaurant: r }) => {
    // 🔹 Détermination automatique du statut
    let status: 'danger' | 'success' | 'neutral' = 'neutral';
    if (r.coursesEnCours >= 1) status = 'danger';
    else if (r.coursesTerminees >= 1 && r.coursesEnCours === 0) status = 'success';

    return (
        <div
            key={r.restaurantId}
            className={`
        rounded-2xl shadow-md flex flex-col justify-between items-center 
        bg-gray-50 border border-gray-200 
        transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
      `}
        >
            {/* Zone d’état (icônes / alertes) */}
            <div className="grid grid-cols-4 gap-2 m-4 justify-items-center flex-1">
                {/* Pastilles jaunes pour les courses en cours */}
                {r.coursesEnCours > 0 &&
                    Array.from({ length: r.coursesEnCours }).map((_, idx) => (
                        <span
                            key={`en-cours-${idx}`}
                            className="w-10 h-10 flex items-center justify-center bg-yellow-400 rounded-full text-red-600 font-bold text-md"
                        >
                            !
                        </span>
                    ))}

                {/* Pastilles vertes pour les courses terminées (uniquement si coursesEnCours = 0) */}
                {r.coursesEnCours === 0 && r.coursesTerminees > 0 &&
                    Array.from({ length: r.coursesTerminees }).map((_, idx) => (
                        <span
                            key={`terminees-${idx}`}
                            className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-full text-white font-bold text-md"
                        >
                            ✔
                        </span>
                    ))}
            </div>


            {/* Nom du restaurant (lien cliquable) */}
            <Link
                href={`/external_delivery/restaurant/${r.restaurantId}`}
                className={`
          font-semibold w-full h-10 flex items-center justify-between 
          rounded-xl px-4 text-xs md:text-sm lg:text-base border-t
          transition-colors duration-200
          ${status === 'danger'
                        ? 'bg-red-100 border-red-500 text-red-800 hover:bg-red-200'
                        : status === 'success'
                            ? 'bg-green-100 border-green-500 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}
        `}
            >
                {/* 🏷️ Nom du restaurant */}
                <span className="truncate">{r.nomRestaurant}</span>

                {/* 🟡 Icône ronde à droite */}
                <span
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full ${status === 'danger' ? 'bg-yellow-400' : 'bg-gray-300'
                        }`}
                ></span>
            </Link>
        </div>
    );
};

export default CourseJournaliere;
