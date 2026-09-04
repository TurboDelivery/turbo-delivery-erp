'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationBlockProps {
  currentPage: number;   // 0-based
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

function PaginationBlock({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationBlockProps) {
  const displayPage = currentPage + 1; // 1-based for UI

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (displayPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }
    if (displayPage >= totalPages - 3) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ellipsis', displayPage - 1, displayPage, displayPage + 1, 'ellipsis', totalPages];
  };

  const goTo = (page: number) => {
    const p = page - 1;
    if (p >= 0 && p < totalPages) onPageChange(p);
  };

  if (totalPages <= 1) return null;

  const from = totalItems !== undefined && pageSize !== undefined ? currentPage * pageSize + 1 : null;
  const to = totalItems !== undefined && pageSize !== undefined ? Math.min((currentPage + 1) * pageSize, totalItems) : null;

  return (
    <div className="flex flex-col items-center gap-3">
      {from !== null && to !== null && totalItems !== undefined && (
        <p className="text-sm text-muted-foreground">
          Affichage{' '}
          <span className="font-semibold text-foreground">{from}–{to}</span>{' '}
          sur{' '}
          <span className="font-semibold text-foreground">{totalItems}</span>{' '}
          résultats
        </p>
      )}

      <nav
        className="flex items-center gap-1 rounded-xl border border-border bg-background/60 p-1 shadow-xs backdrop-blur-xs"
        aria-label="Pagination"
      >
        {/* Première page */}
        <NavBtn onClick={() => goTo(1)} disabled={currentPage === 0} title="Première page">
          <ChevronsLeft className="size-4" />
        </NavBtn>

        {/* Page précédente */}
        <NavBtn onClick={() => goTo(displayPage - 1)} disabled={currentPage === 0} title="Page précédente">
          <ChevronLeft className="size-4" />
        </NavBtn>

        {/* Numéros de page */}
        <div className="flex items-center gap-0.5 px-0.5">
          {getPageNumbers().map((page, i) =>
            page === 'ellipsis' ? (
              <span
                key={`e-${i}`}
                className="flex h-9 w-7 select-none items-end justify-center pb-1.5 text-sm text-muted-foreground"
              >
                ···
              </span>
            ) : (
              <motion.button
                key={page}
                onClick={() => goTo(page)}
                whileTap={{ scale: 0.88 }}
                className={cn(
                  'relative flex h-9 min-w-9 items-center justify-center rounded-lg px-1 text-sm font-medium transition-colors',
                  displayPage === page
                    ? 'text-primary-foreground'
                    : 'text-foreground hover:bg-muted-surface',
                )}
                aria-current={displayPage === page ? 'page' : undefined}
              >
                {displayPage === page && (
                  <motion.span
                    layoutId="active-page-pill"
                    className="absolute inset-0 rounded-lg bg-primary shadow-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
                <span className="relative z-10">{page}</span>
              </motion.button>
            ),
          )}
        </div>

        {/* Page suivante */}
        <NavBtn onClick={() => goTo(displayPage + 1)} disabled={currentPage === totalPages - 1} title="Page suivante">
          <ChevronRight className="size-4" />
        </NavBtn>

        {/* Dernière page */}
        <NavBtn onClick={() => goTo(totalPages)} disabled={currentPage === totalPages - 1} title="Dernière page">
          <ChevronsRight className="size-4" />
        </NavBtn>
      </nav>
    </div>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
  title,
  onDrag: _onDrag,
  onDragEnd: _onDragEnd,
  onDragEnter: _onDragEnter,
  onDragExit: _onDragExit,
  onDragLeave: _onDragLeave,
  onDragOver: _onDragOver,
  onDragStart: _onDragStart,
  onDrop: _onDrop,
  onAnimationStart: _onAnimationStart,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { disabled?: boolean }) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      whileTap={disabled ? {} : { scale: 0.88 }}
      title={title}
      disabled={disabled}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors',
        disabled
          ? 'cursor-not-allowed text-muted-foreground/30'
          : 'cursor-pointer text-muted-foreground hover:bg-muted-surface hover:text-foreground',
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default PaginationBlock;
