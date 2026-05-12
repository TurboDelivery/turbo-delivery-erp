import { Star } from 'lucide-react';
import { IVisaDgaLivreur } from '../types/visa-dga.type';

export default function LivreurRow({ nom, tickets, numeroWave, netAPayer, bonus }: IVisaDgaLivreur) {
  return (
    <div className="flex items-center gap-3 justify-between py-2.5 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 truncate">{nom}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          {tickets} tickets · {numeroWave}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {bonus && (
          <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
            BONUS
          </span>
        )}
        <span className="text-sm font-bold text-green-600">
          {netAPayer.toLocaleString('fr-FR')} FCFA
        </span>
      </div>
    </div>
  );
}
