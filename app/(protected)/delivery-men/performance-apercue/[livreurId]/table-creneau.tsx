
'use client'

import React, { useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    getKeyValue,
  } from "@heroui/react";
import progresseBare2 from "@/components/dashboard/delivery-men/progression/progression-barre2";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import progresseBarePerformance from "@/components/dashboard/delivery-men/performance-creneau/progression-bare-performance";
import DropDownPerformanceCrenea from "@/components/dashboard/delivery-men/performance-creneau/drop-down-performance-creneau";
  

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
      key: "jour",
      label: "Jour",
    },
    {
      key: "progression",
      label: "Progression du jour",
    },
    {
      key: "commission",
      label: "commission du Jour",
    },
  ];
  
  export default function TableCreneau({initialData}:{initialData:Progression[]}) {

    const [open, setOpen] = useState<boolean>(false);
        

    const renderCell = React.useCallback((data:Progression, columnKey:any) => {
      // const cellValue = rows[columnKey];

      switch (columnKey) {
        case "jour":
          return (
          <div>
            {data.jour||'non definie'}
          </div>
          );
        case "progression":
          return (
            <div className="flex gap-2">
              {progresseBarePerformance(data)}
              <span>{data.heure} de travail</span>
            </div>
          );
        case "commission":
          return (
            <div>
            {data.commission} FCFA
            </div>
          );
        default:
          return null;
      }
    }, []);

    return (
      <div>
          {/* Table — desktop uniquement (≥ md) */}
          <div className="hidden md:block">
            <Table aria-label="Example table with custom cells"  selectionMode="single">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key}>
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={initialData} emptyContent={<EmptyDataTable title="Aucun  Livreur" />}>
        {(item) => (
          <TableRow key={item.jour} onClick={() => setOpen(true)}>
            {(columnKey) => <TableCell >{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
          </div>

          {/* Mobile — cartes tactiles (mêmes données / handler que le tableau) */}
          <div className="md:hidden space-y-3">
            {(initialData ?? []).length === 0 ? (
              <EmptyDataTable title="Aucun  Livreur" />
            ) : (
              (initialData ?? []).map((item: Progression) => (
                <div
                  key={item.jour}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2 cursor-pointer active:bg-gray-50"
                  onClick={() => setOpen(true)}
                >
                  <p className="text-sm font-semibold text-gray-900">{item.jour || 'non definie'}</p>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Progression du jour</span>
                    {renderCell(item, 'progression')}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 shrink-0">Commission du jour</span>
                    <span className="text-sm text-gray-700 text-right">{renderCell(item, 'commission')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>

    );
  }
