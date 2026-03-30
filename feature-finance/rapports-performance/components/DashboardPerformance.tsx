'use client'
import { TrendingUp, Users, Briefcase, ArrowUpRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Card, Progress } from '@heroui/react';
import { CardContent } from '@/components/ui/card';

interface MonthData {
  month: string;
  monthName: string;
  courses: number;
  staff: number;
  ca: string;
  expenses: string;
  reimbursements: string;
  investments: string;
  progress: number;
  monthlyResult: string;
  cumulativeResult: string;
  isProfitable: boolean;
  hasData: boolean;
}

const monthsData: MonthData[] = [
  {
    month: 'janvier',
    monthName: 'Janvier 2026',
    courses: 373,
    staff: 12,
    ca: '5 786 973 FCFA',
    expenses: '4 166 682 FCFA',
    reimbursements: '43 298 FCFA',
    investments: '1 287 001 FCFA',
    progress: 50,
    monthlyResult: '+ 7 362 413 FCFA',
    cumulativeResult: '+ 7 362 413 FCFA',
    isProfitable: true,
    hasData: true,
  },
  {
    month: 'fevrier',
    monthName: 'Février 2026',
    courses: 373,
    staff: 12,
    ca: '4 767 775 FCFA',
    expenses: '3 249 215 FCFA',
    reimbursements: '312 014 FCFA',
    investments: '0 FCFA',
    progress: 50,
    monthlyResult: '+ 7 899 810 FCFA',
    cumulativeResult: '+ 15 262 223 FCFA',
    isProfitable: true,
    hasData: true,
  },
  {
    month: 'mars',
    monthName: 'Mars 2026',
    courses: 373,
    staff: 12,
    ca: '7 006 340 FCFA',
    expenses: '4 339 385 FCFA',
    reimbursements: '321 387 FCFA',
    investments: '0 FCFA',
    progress: 50,
    monthlyResult: '+ 3 109 747 FCFA',
    cumulativeResult: '+ 18 371 970 FCFA',
    isProfitable: true,
    hasData: true,
  },
  {
    month: 'avril',
    monthName: 'Avril 2026',
    courses: 0,
    staff: 0,
    ca: '',
    expenses: '',
    reimbursements: '',
    investments: '',
    progress: 0,
    monthlyResult: '',
    cumulativeResult: '',
    isProfitable: false,
    hasData: false,
  },
  {
    month: 'mai',
    monthName: 'Mai 2026',
    courses: 0,
    staff: 0,
    ca: '',
    expenses: '',
    reimbursements: '',
    investments: '',
    progress: 0,
    monthlyResult: '',
    cumulativeResult: '',
    isProfitable: false,
    hasData: false,
  },
];

export default function DashboardPerformance() {
  const [selectedYear, setSelectedYear] = useState('2026');

  const years = ['2024', '2025', '2026', '2027', '2028'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-primary">Bilan Annuel {selectedYear}</h1>
          <div className="flex items-center gap-4">
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
           
          </div>
        </div>
        <p className="text-sm text-gray-500">Vue chronologique de la santé financière et opérationnelle</p>
      </div>

      {/* Months Grid */}
      <div className="space-y-6">
        {monthsData.map((month) => (
          <Card key={month.month} className="overflow-hidden">
            <CardContent className="p-6">
              {/* Month Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-bold ${month.hasData ? 'text-red-600' : 'text-gray-400'}`}>
                  {month.monthName}
                </h2>
                {month.hasData && month.isProfitable && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                    Rentable
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stats */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-500 mb-2">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase">Courses</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{month.courses}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-500 mb-2">
                          <Users className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase">Staff</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{month.staff}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Financial Metrics */}
                  {month.hasData && (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>CA</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{month.ca}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <span>% Dépenses</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{month.expenses}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Remboursements</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{month.reimbursements}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <Briefcase className="w-3 h-3" />
                            <span>Investissements</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{month.investments}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Progression annuelle</span>
                          <span className="text-gray-500">{month.progress}/12</span>
                        </div>
                        <Progress value={(month.progress / 12) * 100} className="h-2" />
                      </div>
                    </>
                  )}

                  {!month.hasData && (
                    <p className="text-gray-400 text-sm italic">Aucune donnée disponible</p>
                  )}
                </div>

                {/* Profitability Section */}
                {month.hasData && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                      <div className="w-1 h-4 bg-gray-800 rounded-full" />
                      RENTABILITÉ
                    </div>
                    
                    {/* Monthly Result */}
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-600 mb-1">Résultat du mois</p>
                        <p className="text-lg font-bold text-green-700 mb-1">{month.monthlyResult}</p>
                        <p className="text-xs text-gray-500">Bénéfice mensuel</p>
                      </CardContent>
                    </Card>

                    {/* Cumulative Result */}
                    <Card className="bg-blue-600 text-white border-blue-600">
                      <CardContent className="p-4">
                        <p className="text-xs text-blue-100 mb-1">RENTABILITÉ CUMULÉE YTD</p>
                        <p className="text-lg font-bold mb-1">{month.cumulativeResult}</p>
                        <p className="text-xs text-blue-100">
                          Depuis : Janvier 2026
                        </p>
                        <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-100 hover:text-white hover:bg-blue-700 p-0 h-auto">
                          Voir détails
                          <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
