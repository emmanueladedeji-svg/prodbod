import { useState } from 'react';

function getStored(key: string, fallback: any) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function useSidebar() {
  const [isOpen, setIsOpen] = useState<boolean>(() => getStored('pb_sidebar_open', false));
  const [activeProductId, setActiveProductIdState] = useState<string | null>(() => getStored('pb_active_product', null));

  const toggle = () => setIsOpen(o => {
    const next = !o;
    localStorage.setItem('pb_sidebar_open', JSON.stringify(next));
    return next;
  });

  const setActiveProduct = (id: string | null) => {
    setActiveProductIdState(id);
    localStorage.setItem('pb_active_product', JSON.stringify(id));
  };

  return { isOpen, toggle, activeProductId, setActiveProduct, setIsOpen };
}
