import Link from 'next/link';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@heroui/react';
import ChargesDepensesDetailsContent from '@/feature-finance/charges/components/charges-depenses-details-content';

function ChargesDetailsPage() {
  return (
    <div className="min-h-screen bg-white p-3 max-w-8xl mx-auto space-y-6">
      <div>
        <Button as={Link} href="/finance/charges" variant="light" size="sm" startContent={<ArrowLeft size={16} />} className="mb-3">
          Retour a la synthese
        </Button>
        <h1 className="text-2xl font-bold text-red-600">Toutes les depenses</h1>
      </div>

      <ChargesDepensesDetailsContent />
    </div>
  );
}

export default ChargesDetailsPage;