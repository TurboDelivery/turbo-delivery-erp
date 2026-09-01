
'use client'

import React, { useEffect, useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    getKeyValue,
  } from "@/components/heroui";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import progresseBarePerformance from "@/components/dashboard/delivery-men/performance-creneau/progression-bare-performance";
import DropDownPerformanceCrenea from "@/components/dashboard/delivery-men/performance-creneau/drop-down-performance-creneau";
import { formatMontant } from '@/utils/format.utils';
  

const gainsDataa ={
  solde: 0,
  gains: [
    {
      date: "2025-04-07",
      jour: "LUNDI",
      gain: {
        solde: 0,
        gains: [
          {
            code: "A123",
            frais: 5,
            commission: 2,
            date: "2025-04-07T17:24:06.583Z"
          },
          {
            code: "B456",
            frais: 3,
            commission: 1.5,
            date: "2025-04-07T18:30:20.123Z"
          },
          {
            code: "C789",
            frais: 4,
            commission: 1.2,
            date: "2025-04-07T19:45:35.789Z"
          }
        ]
      }
    },
    {
      date: "2025-04-07",
      jour: "MARDI",
      gain: {
        solde: 0,
        gains: [
          {
            code: "A123",
            frais: 50,
            commission: 200,
            date: "2025-04-07"
          },
          {
            code: "B496",
            frais: 3,
            commission: 1.5,
            date: "2025-04-07"
          },
          {
            code: "C789",
            frais: 4,
            commission: 1.2,
            date: "2025-04-07"
          }
        ]
      }
    },
    {
      date: "2025-04-07",
      jour: "MERCREDI",
      gain: {
        solde: 0,
        gains: [
          {
            code: "A123",
            frais: 5,
            commission: 2,
            date: "2025-04-07"
          },
          {
            code: "B456",
            frais: 3,
            commission: 1.5,
            date: "2025-04-07"
          },
          {
            code: "C789",
            frais: 4,
            commission: 1.2,
            date: "2025-04-07"
          }
        ]
      }
    }
  ]
}

const dataCreneau={
    livreurId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    creneaux: [
      {
        creneau: {
          "debut": "2025-04-06",
          "fin": "2025-04-06"
        },
        progressions: [
          {
            jour: "LUNDI",
            progression: 0,
            heure: 0,
            commission: 0
          },
          {
            jour: "MARDI",
            progression: 75,
            heure: 7,
            commission: 2000
          },
          {
            jour: "JEUDI",
            progression: 55,
            heure: 5,
            commission: 1000
          }
        ]
      }
    ]
  }

  const columns = [
    {
      key: "date",
      label: "Date et heure",
    },
    {
      key: "tickets",
      label: "Tickets",
    },
    {
      key: "coute",
      label: "coute de livraison",
    },
    {
        key: "commussion",
        label: "commussion",
      },
  ];


  // {initialData}:{initialData:GainDetail[]}
  
  export default function TableCreneauDetail({initialData}:{initialData:GainDetail[]|[]}) {

    const [open, setOpen] = useState<boolean>(false);
    const renderCell = React.useCallback((data:GainDetail, columnKey:any) => {
      switch (columnKey) {
        case "date":
          return (
          <div>
            {data.date||'non definie'}
          </div>
          );
        case "tickets":
          return (
            <div className="flex gap-2">
             {data.code}
            </div>
          );
        case "coute":
          return (
            <div>
            {formatMontant(data.frais)}
            </div>
          );
        case "commussion":
        return (
            <div>
            {formatMontant(data.commission)}
            </div>
        );
        default:
          return null;
      }
    }, []);


    return (
      <>
          {/* Table — desktop uniquement (≥ md) */}
          <div className="hidden md:block">
            <Table  aria-label="Example table with custom cells"  selectionMode="single">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key}>
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={initialData||[]} emptyContent={<EmptyDataTable title="Aucun livreur" />}>
        {(item) => (
          <TableRow key={item.code} onClick={() => setOpen(true)}>
            {(columnKey) => <TableCell >{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
          </div>

          {/* Mobile — cartes tactiles (mêmes données / handler que le tableau) */}
          <div className="md:hidden space-y-3">
            {(initialData ?? []).length === 0 ? (
              <EmptyDataTable title="Aucun livreur" />
            ) : (
              (initialData ?? []).map((item: GainDetail) => (
                <div
                  key={item.code}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-2 cursor-pointer active:bg-gray-50"
                  onClick={() => setOpen(true)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.code}</p>
                    <span className="text-xs text-gray-400 shrink-0">{item.date || 'non definie'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 shrink-0">Coût de livraison</span>
                    <span className="text-sm text-gray-700 text-right">{renderCell(item, 'coute')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 shrink-0">Commission</span>
                    <span className="text-sm text-gray-700 text-right">{renderCell(item, 'commussion')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
      </>
    );


  }
