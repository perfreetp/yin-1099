import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import type { CycleConfig, ReminderConfig, BbtRecord, TodoItem, AppState } from '@/types';
import { defaultCycleConfig, defaultReminderConfig, defaultTodos } from '@/data/mock';
import { generateId } from '@/utils/cycle';

const STORAGE_KEYS = {
  cycleConfig: 'haoyun_cycle_config',
  reminderConfig: 'haoyun_reminder_config',
  records: 'haoyun_records',
  todos: 'haoyun_todos'
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error('[Storage] load error:', key, err);
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (err) {
    console.error('[Storage] save error:', key, err);
  }
}

interface AppContextType extends AppState {
  updateCycleConfig: (config: Partial<CycleConfig>) => void;
  updateReminderConfig: (config: Partial<ReminderConfig>) => void;
  addRecord: (record: Omit<BbtRecord, 'id' | 'createdAt'>) => void;
  deleteRecord: (id: string) => void;
  toggleTodo: (id: string) => void;
  skipCurrentCycle: () => void;
  resetAllData: () => void;
  checkAndSendReminder: () => void;
  requestNotificationAuth: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cycleConfig, setCycleConfig] = useState<CycleConfig>(() =>
    loadFromStorage(STORAGE_KEYS.cycleConfig, defaultCycleConfig)
  );
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(() =>
    loadFromStorage(STORAGE_KEYS.reminderConfig, defaultReminderConfig)
  );
  const [records, setRecords] = useState<BbtRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.records, [])
  );
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.todos, defaultTodos)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.cycleConfig, cycleConfig);
  }, [cycleConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.reminderConfig, reminderConfig);
  }, [reminderConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.records, records);
  }, [records]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.todos, todos);
  }, [todos]);

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

  const resetAllData = useCallback(() => {
    console.log('[AppContext] resetAllData - clearing all state and storage');
    setCycleConfig(defaultCycleConfig);
    setReminderConfig(defaultReminderConfig);
    setRecords([]);
    setTodos(defaultTodos);
    Taro.removeStorageSync(STORAGE_KEYS.cycleConfig);
    Taro.removeStorageSync(STORAGE_KEYS.reminderConfig);
    Taro.removeStorageSync(STORAGE_KEYS.records);
    Taro.removeStorageSync(STORAGE_KEYS.todos);
  }, []);

  const requestNotificationAuth = useCallback(async () => {
    try {
      console.log('[AppContext] requestNotificationAuth');
      const setting = await Taro.getSetting();
      if (!setting.authSetting['scope.subscribeMessage']) {
        await Taro.requestSubscribeMessage({
          tmplIds: [],
          success: () => {
            console.log('[AppContext] subscribeMessage success');
          },
          fail: (err) => {
            console.error('[AppContext] subscribeMessage fail:', err);
          }
        });
      }
    } catch (err) {
      console.error('[AppContext] requestNotificationAuth error:', err);
    }
  }, []);

  const checkAndSendReminder = useCallback(() => {
    if (!reminderConfig.enabled) return;

    const { getTodayInfo, getOvulationDate, formatDate } = require('@/utils/cycle');
    const todayInfo = getTodayInfo(cycleConfig, records);
    const ovulationDate = getOvulationDate(cycleConfig);

    if (todayInfo.intensity > 0 && !todayInfo.isPeriod) {
      let title = '';
      let content = '';

      if (todayInfo.phase === 'peak') {
        title = '💗 重点安排提醒';
        content = todayInfo.isOvulationDay
          ? '今天是排卵日，把握最佳时机'
          : `排卵期重点时段，预计排卵日 ${formatDate(ovulationDate, 'M月D日')}`;
      } else if (todayInfo.phase === 'start') {
        title = '🌱 开始关注提醒';
        content = `易孕期已开始，距离排卵日还有若干天`;
      } else if (todayInfo.phase === 'end') {
        title = '🍂 临近结束提醒';
        content = '易孕期即将结束，如需安排请抓紧';
      }

      if (title) {
        if (reminderConfig.notifyFemale) {
          Taro.showToast({
            title,
            icon: 'none',
            duration: 3000
          });
        }
        console.log('[Reminder] notification:', title, content);
      }
    }
  }, [reminderConfig, cycleConfig, records]);

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
        resetAllData,
        checkAndSendReminder,
        requestNotificationAuth
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
