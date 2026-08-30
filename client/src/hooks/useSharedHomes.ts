import { useCallback, useEffect, useState } from 'react';
import type { SharedHome } from '@/sharedHome/types';
import { createSharedHome } from '@/sharedHome/factory';
import {
  deleteSharedHome,
  getAllSharedHomes,
  saveSharedHome,
} from '@/sharedHome/storage';

export function useSharedHomes() {
  const [homes, setHomes] = useState<SharedHome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    setHomes(getAllSharedHomes());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createHome = useCallback((input: Parameters<typeof createSharedHome>[0]) => {
    const home = createSharedHome(input);
    saveSharedHome(home);
    setHomes(current => [...current, home]);
    return home;
  }, []);

  const updateHome = useCallback((home: SharedHome) => {
    const updated = { ...home, updatedAt: Date.now() };
    saveSharedHome(updated);
    setHomes(current => current.map(item => item.id === updated.id ? updated : item));
    return updated;
  }, []);

  const removeHome = useCallback((homeId: string) => {
    deleteSharedHome(homeId);
    setHomes(current => current.filter(home => home.id !== homeId));
  }, []);

  return { homes, isLoading, createHome, updateHome, removeHome, reload };
}
