'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUp, Download, Receipt, TrendingUp, Wallet, Coins } from 'lucide-react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface CACardProps {
  title: string;
  totalAmount: number;
  fraisLivraison: number;
  commissions: number;
  investissement: number;
  isLoading: boolean;
  isLoadingExport?: boolean;
  onDownload?: () => void;
}

export default function CACard({ title, totalAmount, fraisLivraison, commissions, investissement, isLoading, isLoadingExport = false, onDownload }: CACardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <div className="flex justify-between items-start h-full">
          {/* Skeleton pour la partie CA */}
          <div className="flex flex-col justify-between h-full space-y-3">
            <div className="h-4 bg-green-200 rounded w-32 animate-pulse" />
            <div className="h-8 bg-green-200 rounded w-48 animate-pulse" />
            <div className="h-8 bg-green-200 rounded w-40 animate-pulse" />
          </div>

          {/* Séparateur */}
          <div className="w-px bg-green-200 mx-4" />

          {/* Skeleton pour la décomposition */}
          <div className="flex items-center gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-blue-200 rounded w-32 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-purple-200 rounded w-32 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-orange-200 rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Icône principale */}
          <div className="p-3 bg-green-200 rounded-full">
            <Wallet className="w-6 h-6 text-green-700 opacity-50" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
      <div className="flex justify-between items-start h-full">
        {/* Partie 1 : CA */}
        <div className="flex flex-col justify-between h-full">
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-2xl font-bold text-green-600">{formatCFA(totalAmount)}</p>
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                <ArrowUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            {/* Bouton Télécharger les détails */}
            {onDownload && (
              <button
                onClick={onDownload}
                disabled={isLoadingExport}
                className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-lg disabled:cursor-not-allowed"
              >
                {isLoadingExport ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    Télécharger les détails
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Séparateur vertical */}
        <div className="w-px bg-green-200 mx-4" />

        {/* Partie 2 : Décomposition du CA */}
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Receipt className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">Frais Livraison</span>
                <div className="text-sm font-bold text-blue-600">{formatCFA(fraisLivraison)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="w-3 h-3 text-purple-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">Commissions</span>
                <div className="text-sm font-bold text-purple-600">{formatCFA(commissions)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-full">
                <Coins className="w-3 h-3 text-orange-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">Investissements</span>
                <div className="text-sm font-bold text-orange-600">{formatCFA(investissement)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Icône principale */}
        <div className="p-3 bg-green-200 rounded-full">
          <div className="text-green-700">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>
    </Card>
  );
}
