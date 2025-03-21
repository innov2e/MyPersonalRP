import { useState } from 'react';

export type ModalMode = 'create' | 'edit';

export function useModal<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('create');
  const [data, setData] = useState<T | null>(null);

  const onOpen = (initialMode: ModalMode = 'create', initialData: T | null = null) => {
    setMode(initialMode);
    setData(initialData);
    setIsOpen(true);
  };

  const onClose = () => {
    setIsOpen(false);
    setData(null);
  };

  return {
    isOpen,
    mode,
    data,
    onOpen,
    onClose
  };
}
