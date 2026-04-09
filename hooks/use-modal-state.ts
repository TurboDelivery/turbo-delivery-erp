import { useCallback, useState } from 'react';

interface ModalState<T> {
  isOpen: boolean;
  selected: T | null;
  open: (item?: T | null) => void;
  close: () => void;
}

export function useModalState<T = unknown>(): ModalState<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);

  const open = useCallback((item?: T | null) => {
    setSelected(item ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelected(null);
  }, []);

  return { isOpen, selected, open, close };
}
