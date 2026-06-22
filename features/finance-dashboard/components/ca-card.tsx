'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowRight, ArrowUp, Download, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import CommissionBadge from './commission-badge';

interface CACardProps {
  title: string;
  totalAmount: number;
  fraisLivraison: number;
  commissions: number;
  isLoading: boolean;
  isLoadingExport?: boolean;
  onDownload?: () => void;
  commissionFixe?: number;
  commissionPourcentage?: number;
  detailHref?: string;
}

export default function CACard({ title, totalAmount, fraisLivraison, commissions, commissionFixe = 0, commissionPourcentage = 0, isLoading, isLoadingExport = false, onDownload, detailHref }: CACardProps) {
  const commissionItems = [
    { label: 'Commission fixe', amount: commissionFixe },
    { label: 'Commission pourcentage', amount: commissionPourcentage },
  ];

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <div className="flex max-lg:flex-col items-stretch gap-6">
          <div className="flex flex-col justify-center gap-3 lg:w-[34%] lg:shrink-0">
            <div className="h-5 bg-green-200 rounded w-32 animate-pulse" />
            <div className="h-9 bg-green-200 rounded w-48 animate-pulse" />
            <div className="h-8 bg-green-200 rounded w-40 animate-pulse" />
          </div>
          <div className="hidden lg:block w-px self-stretch bg-green-200" />
          <div className="block lg:hidden h-px w-full bg-green-200" />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 content-center">
            <div className="h-16 bg-white/60 rounded-xl animate-pulse" />
            <div className="h-16 bg-white/60 rounded-xl animate-pulse" />
            <div className="sm:col-span-2 h-8 bg-green-200/60 rounded animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
      <div className="flex max-lg:flex-col items-stretch gap-6">
        {/* Partie 1 : CA (hero) — colonne fixe à gauche */}
        <div className="flex flex-col justify-center gap-3 lg:w-[34%] lg:shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-green-200/70 rounded-xl text-green-700">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-medium 2xl:text-lg font-medium text-gray-600">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-3xl 2xl:text-4xl font-bold text-green-600">{formatCFA(totalAmount)}</p>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 shrink-0">
              <ArrowUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          {onDownload && (
            <button
              onClick={onDownload}
              disabled={isLoadingExport}
              className="mt-1 flex w-fit items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-lg disabled:cursor-not-allowed"
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
          {detailHref && (
            <Link
              href={detailHref}
              className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-green-700 hover:underline"
            >
              Voir le détail
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Séparateur */}
        <div className="hidden lg:block w-px self-stretch bg-green-200" />
        <div className="block lg:hidden h-px w-full bg-green-200" />

        {/* Partie 2 : Décomposition du CA — remplit la largeur restante */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 content-center">
          <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3">
            <div className="p-2 bg-blue-100 rounded-full shrink-0">
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm text-gray-600">Frais Livraison</span>
              <span className="block text-lg 2xl:text-xl font-bold text-blue-600 truncate">{formatCFA(fraisLivraison)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3">
            <div className="p-2 bg-purple-100 rounded-full shrink-0">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm text-gray-600">Commissions</span>
              <span className="block text-lg 2xl:text-xl font-bold text-purple-600 truncate">{formatCFA(commissions)}</span>
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {commissionItems.map((item) => (
              <CommissionBadge key={item.label} label={item.label} amount={item.amount} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
