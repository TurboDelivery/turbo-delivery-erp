'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { Building, Home, Car, Users, ShoppingBag, Heart, Shield, Zap } from 'lucide-react';

export default function ChargesCards() {
  const categories = [
    { name: 'Loyer', amount: 800000, percentage: 32.7, icon: Building, color: 'blue' },
    { name: 'Électricité', amount: 250000, percentage: 10.2, icon: Zap, color: 'yellow' },
    { name: 'Eau', amount: 120000, percentage: 4.9, icon: Home, color: 'cyan' },
    { name: 'Internet', amount: 80000, percentage: 3.3, icon: Shield, color: 'purple' },
    { name: 'Transport', amount: 450000, percentage: 18.4, icon: Car, color: 'green' },
    { name: 'Salaires', amount: 550000, percentage: 22.4, icon: Users, color: 'orange' },
    { name: 'Fournitures', amount: 150000, percentage: 6.1, icon: ShoppingBag, color: 'pink' },
    { name: 'Autres', amount: 50000, percentage: 2.0, icon: Heart, color: 'gray' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500' },
      cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
      green: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-500' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500' },
      pink: { bg: 'bg-pink-100 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500' },
      gray: { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500' },
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category, index) => {
        const Icon = category.icon;
        const colors = getColorClasses(category.color);
        
        return (
          <Card key={index} className={`border-l-4 ${colors.border} hover:shadow-lg transition-shadow`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}>
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <span className="text-xs text-gray-500">{category.percentage}%</span>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {category.amount.toLocaleString()} FCFA
              </p>
              <div className="mt-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors.text.replace('text', 'bg')} transition-all duration-300`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
