import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CycleConfig, ReminderConfig, BbtRecord, TodoItem, AppState } from '@/types';
import { defaultCycleConfig, defaultReminderConfig, mockRecords, mockTodos } from '@/data/mock';
import { generateId } from '@/utils/cycle';

interface AppContextType extends AppState {
  updateCycleConfig: (config: Partial<CycleConfig>) => void;
  updateReminderConfig: (config: Partial<ReminderConfig>) => void;
  addRecord: (record: Omit<BbtRecord, 'id' | 'createdAt'>) => void;
  deleteRecord: (id: string) => void;
  toggleTodo: (id: string) => void;
  skipCurrentCycle: () => void;
  resetCycle: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cycleConfig, setCycleConfig] = useState<CycleConfig>(defaultCycleConfig);
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(defaultReminderConfig);
  const [records, setRecords] = useState<BbtRecord[]>(mockRecords);
  const [todos, setTodos] = useState<TodoItem[]>(mockTodos);

  const updateCycleConfig = useCallback((config: Partial<CycleConfig>) => {
    setCycleConfig(prev => {
      console.log('[AppContext] updateCycleConfig:', config);
      return { ...prev, ...config };
    });
  }, []);

  const updateReminderConfig = useCallback((config: Partial<ReminderConfig>) => {
    setReminderConfig(prev => {
      console.log('[AppContext] updateReminderConfig:', config);
      return { ...prev, ...config };
    });
  }, []);

  const addRecord = useCallback((record: Omit<BbtRecord, 'id' | 'createdAt'>) => {
    const now = new Date();
    const newRecord: BbtRecord = {
      ...record,
      id: generateId(),
      createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    };
    setRecords(prev => {
      console.log('[AppContext] addRecord:', newRecord);
      return [newRecord, ...prev];
    });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => {
      console.log('[AppContext] deleteRecord:', id);
      return prev.filter(r => r.id !== id);
    });
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      const todo = prev.find(t => t.id === id);
      console.log('[AppContext] toggleTodo:', id, '->', !todo?.done);
      return updated;
    });
  }, []);

  const skipCurrentCycle = useCallback(() => {
    setCycleConfig(prev => {
      console.log('[AppContext] skipCurrentCycle');
      return { ...prev, isSkipped: true };
    });
  }, []);

  const resetCycle = useCallback(() => {
    setCycleConfig(defaultCycleConfig);
    console.log('[AppContext] resetCycle');
  }, []);

  return (
    <AppContext.Provider
      value={{
        cycleConfig,
        reminderConfig,
        records,
        todos,
        updateCycleConfig,
        updateReminderConfig,
        addRecord,
        deleteRecord,
        toggleTodo,
        skipCurrentCycle,
        resetCycle
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
};
