'use client';
import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import FacturePdf from '@/components/finance/recouvrements/factures/pdf/facture-pdf';

function TestPage() {
  return (
    <div className="flex flex-col min-h-[85vh]">
      <PDFViewer className="bg-blue-500 flex-1">
        <FacturePdf />
      </PDFViewer>
    </div>
  );
}

export default TestPage;
