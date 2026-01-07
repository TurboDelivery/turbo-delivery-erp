import React from 'react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export interface PaginationBlockProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationBlock({ currentPage, totalPages, onPageChange }: PaginationBlockProps) {
  // Convertir l'index backend (0-based) en affichage UI (1-based)
  const displayPage = currentPage + 1;
  const displayTotalPages = totalPages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (displayTotalPages <= maxVisible) {
      for (let i = 1; i <= displayTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (displayPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', displayTotalPages);
      } else if (displayPage >= displayTotalPages - 2) {
        pages.push(1, 'ellipsis', displayTotalPages - 3, displayTotalPages - 2, displayTotalPages - 1, displayTotalPages);
      } else {
        pages.push(1, 'ellipsis', displayPage - 1, displayPage, displayPage + 1, 'ellipsis', displayTotalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (displayPageNumber: number) => {
    const backendPage = displayPageNumber - 1;
    if (backendPage >= 0 && backendPage < totalPages) {
      onPageChange(backendPage);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" onClick={() => handlePageChange(displayPage - 1)} className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
        </PaginationItem>

        {getPageNumbers().map((page, index) => (
          <PaginationItem key={`${page}-${index}`}>
            {page === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href="#" onClick={() => handlePageChange(page as number)} isActive={displayPage === page} className="cursor-pointer">
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext href="#" onClick={() => handlePageChange(displayPage + 1)} className={currentPage === totalPages - 1 ? 'pointer-events-none' : 'cursor-pointer'} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default PaginationBlock;
