'use client';

import { 
  Package, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Box, 
  Download, 
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card, CardBody } from '@heroui/react';
import { Button } from '@heroui/react';

const geographicData = [
  { name: 'Marcory', value: 36, deliveries: 128, color: '#3B82F6' },
  { name: 'Zone 4', value: 24, deliveries: 87, color: '#8B5CF6' },
  { name: 'Plateau', value: 21, deliveries: 75, color: '#EC4899' },
  { name: 'Cocody', value: 10, deliveries: 36, color: '#F59E0B' },
  { name: 'Yopougon', value: 9, deliveries: 33, color: '#10B981' },
];

const weeklyActivityData = [
  { day: 'Lundi', deliveries: 45, revenue: 580000 },
  { day: 'Mardi', deliveries: 38, revenue: 420000 },
  { day: 'Mercredi', deliveries: 52, revenue: 510000 },
  { day: 'Jeudi', deliveries: 41, revenue: 400000 },
  { day: 'Vendredi', deliveries: 43, revenue: 400000 },
  { day: 'Samedi', deliveries: 68, revenue: 720000 },
  { day: 'Dimanche', deliveries: 65, revenue: 715000 },
];

export default function PerformanceReport() {
  const renderDonutChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={geographicData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}%`}
          labelLine={false}
        >
          {geographicData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <RechartsTooltip />
        <Legend 
          verticalAlign="middle" 
          align="right" 
          layout="vertical"
          formatter={(value, entry) => {
            const data = geographicData.find(d => d.name === value);
            return (
              <span className="text-sm text-gray-600">
                {value} ({data?.deliveries} livraisons)
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={weeklyActivityData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis 
          dataKey="day" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickFormatter={(value) => `${(value / 100000).toFixed(0)}k`}
        />
        <RechartsTooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Bar dataKey="deliveries" fill="#8B5CF6" name="Livraisons" radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" fill="#A78BFA" name="Chiffre d'affaires (FCFA)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-red-600">Rapport de Performance</h1>
              <p className="text-sm text-gray-500 mt-1">Restaurant La Terrasse</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                C
              </div>
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">La Terrasse</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">01 mars - 31 mars 2026</span>
              </div>

              <Button 
                color="primary"
                className="bg-orange-500"
                startContent={<Download className="w-4 h-4" />}
              >
                Exporter PDF
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Nombre de Livraisons */}
          <Card>
            <CardBody className="p-6 bg-red-50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Nombre de Livraisons</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">376</p>
                  <p className="text-sm text-gray-500">Moyenne: 12.1 livraisons/jour</p>
                  <p className="text-sm text-green-600 font-medium mt-1">+12% vs mois précédent</p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Valeur Totale */}
          <Card>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Valeur Totale des Commandes</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">3.75M</p>
                  <p className="text-sm text-gray-500">3,745,243 FCFA</p>
                </div>
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Taux de Succès */}
          <Card>
            <CardBody className="p-6 bg-green-50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Taux de Succès</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">95.5%</p>
                  <p className="text-sm text-gray-500">Livraisons sans litige</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition Géographique */}
          <Card>
            <CardBody className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Répartition Géographique</h2>
                <p className="text-sm text-gray-500">Zone Top: Marcory (128 livraisons)</p>
              </div>
              {renderDonutChart()}
            </CardBody>
          </Card>

          {/* Pics d'Activité Hebdomadaire */}
          <Card>
            <CardBody className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pics d'Activité Hebdomadaire</h2>
                <p className="text-sm text-gray-500">
                  Jour de Pic: <span className="font-medium">Dimanche</span> - 55% des livraisons vers Marcory
                </p>
              </div>
              {renderBarChart()}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  <span className="text-sm text-gray-600">Livraisons</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded"></div>
                  <span className="text-sm text-gray-600">Chiffre d'affaires (FCFA)</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Middle Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Temps Moyen de Livraison</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">39 min</p>
                  <p className="text-xs text-gray-500">De la récupération à la remise</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Croissance Mensuelle</p>
                  <p className="text-2xl font-bold text-green-600 mb-1">+12%</p>
                  <p className="text-xs text-gray-500">Par rapport au mois précédent</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Articles par Commande</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">2.5</p>
                  <p className="text-xs text-gray-500">Moyenne par livraison</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Box className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Financial Details */}
        <Card>
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Détails Financiers</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Montant total des commandes</span>
                <span className="font-semibold text-gray-900">3,745,243 FCFA</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Frais de livraison collectés</span>
                <span className="font-semibold text-gray-900">360,347 FCFA</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Frais de service Turbo Delivery (10%)</span>
                <span className="font-semibold text-orange-600">374,363 FCFA</span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-gray-700 font-medium">Revenu net du partenaire</span>
                <span className="text-xl font-bold text-green-600">3,370,880 FCFA</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardBody className="p-6 bg-orange-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Résumé de Performance</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Grâce à Turbo Delivery, Restaurant La Terrasse a réalisé 376 livraisons pour un montant total de 3.75 millions FCFA 
                  durant la période sélectionnée. La zone Marcory représente 36% des livraisons, avec un pic d'activité le Dimanche 
                  (58% vers Marcory). Le temps moyen de livraison est de 39 minutes avec un taux de succès de 95.5%.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
