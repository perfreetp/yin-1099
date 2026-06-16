import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import type { CycleConfig, ReminderConfig, BbtRecord, TodoItem, AppState } from '@/types';
import { defaultCycleConfig, defaultReminderConfig, defaultTodos } from '@/data/mock';
import { generateId, getTodayInfo, getOvulationDate, getFertileWindow, formatDate, getDayPhase } from '@/utils/cycle';

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

export interface ReminderResult {
  shouldRemind: boolean;
  reason: string;
  femaleNotified: boolean;
  maleNotified: boolean;
  femaleTime: string;
  maleTime: string;
  phaseText: string;
  intensity: number;
  isLocalPreview: boolean;
}

interface AppContextType extends AppState {
  updateCycleConfig: (config: Partial<CycleConfig>) => void;
  updateReminderConfig: (config: Partial<ReminderConfig>) => void;
  addRecord: (record: Omit<BbtRecord, 'id' | 'createdAt'>) => void;
  deleteRecord: (id: string) => void;
  toggleTodo: (id: string) => void;
  skipCurrentCycle: () => void;
  resetAllData: () => void;
  evalReminder: () => ReminderResult;
  requestNotificationAuth: () => Promise<{ success: boolean; isEnvironmentSupported: boolean; message: string }>;
  getNotificationEnvStatus: () => 'miniapp' | 'h5' | 'unknown';
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

  const getNotificationEnvStatus = useCallback((): 'miniapp' | 'h5' | 'unknown' => {
    try {
      if (typeof wx !== 'undefined' && wx.requestSubscribeMessage) return 'miniapp';
      if (typeof Taro !== 'undefined' && Taro.getEnv && Taro.getEnv() === 'WEB') return 'h5';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }, []);

  const requestNotificationAuth = useCallback(async (): Promise<{ success: boolean; isEnvironmentSupported: boolean; message: string }> => {
    const env = getNotificationEnvStatus();

    if (env === 'h5') {
      return {
        success: false,
        isEnvironmentSupported: false,
        message: '当前为网页预览环境，不支持微信订阅消息推送。需要在微信小程序中使用才能订阅通知。'
      };
    }

    if (env === 'unknown') {
      return {
        success: false,
        isEnvironmentSupported: false,
        message: '当前环境无法识别，可能不支持订阅消息功能。请在微信小程序中使用。'
      };
    }

    try {
      const setting = await Taro.getSetting();
      if (setting.authSetting['scope.subscribeMessage']) {
        return {
          success: true,
          isEnvironmentSupported: true,
          message: '已获得通知订阅授权，提醒将按时推送。'
        };
      }

      await Taro.requestSubscribeMessage({
        tmplIds: [],
        success: () => {
          console.log('[AppContext] subscribeMessage success');
        },
        fail: (err) => {
          console.error('[AppContext] subscribeMessage fail:', err);
        }
      });

      const recheck = await Taro.getSetting();
      if (recheck.authSetting['scope.subscribeMessage']) {
        return {
          success: true,
          isEnvironmentSupported: true,
          message: '授权成功！提醒将按设置时间推送。'
        };
      }

      return {
        success: false,
        isEnvironmentSupported: true,
        message: '您拒绝了通知订阅。如需接收提醒，请在微信设置中手动开启订阅消息权限。'
      };
    } catch (err) {
      console.error('[AppContext] requestNotificationAuth error:', err);
      return {
        success: false,
        isEnvironmentSupported: true,
        message: '授权请求失败，请稍后再试或在微信设置中手动开启。'
      };
    }
  }, [getNotificationEnvStatus]);

  const evalReminder = useCallback((): ReminderResult => {
    const result: ReminderResult = {
      shouldRemind: false,
      reason: '',
      femaleNotified: false,
      maleNotified: false,
      femaleTime: reminderConfig.femaleTime,
      maleTime: reminderConfig.maleTime,
      phaseText: '',
      intensity: 0,
      isLocalPreview: true
    };

    if (!reminderConfig.enabled) {
      result.reason = '提醒总开关已关闭';
      return result;
    }

    if (cycleConfig.isSkipped) {
      result.reason = '当前周期已跳过';
      return result;
    }

    const todayInfo = getTodayInfo(cycleConfig, records);
    const ovulationDate = getOvulationDate(cycleConfig);
    result.phaseText = todayInfo.phaseText;
    result.intensity = todayInfo.intensity;

    if (todayInfo.isPeriod) {
      result.reason = '当前为月经期，不触发易孕期提醒';
      return result;
    }

    const shouldRemindByIntensity = () => {
      if (todayInfo.intensity === 0) return false;
      switch (reminderConfig.intensity) {
        case 'all':
          return todayInfo.intensity > 0;
        case 'peak':
          return todayInfo.phase === 'peak';
        case 'start_end':
          return todayInfo.phase === 'start' || todayInfo.phase === 'end';
        default:
          return false;
      }
    };

    if (!shouldRemindByIntensity()) {
      const intensityLabel = reminderConfig.intensity === 'all' ? '全部时段' : reminderConfig.intensity === 'peak' ? '仅重点期' : '关注+结束';
      result.reason = `今日阶段「${todayInfo.phaseText}」不在「${intensityLabel}」提醒范围内`;
      return result;
    }

    result.shouldRemind = true;
    result.reason = todayInfo.isOvulationDay
      ? '今天是排卵日，把握最佳时机'
      : todayInfo.phase === 'peak'
        ? `排卵期重点时段，预计排卵日 ${formatDate(ovulationDate, 'M月D日')}`
        : todayInfo.phase === 'start'
          ? '易孕期已开始，建议开始关注'
          : '易孕期即将结束，如需安排请抓紧';

    result.femaleNotified = reminderConfig.notifyFemale;
    result.maleNotified = reminderConfig.notifyMale;

    return result;
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
        evalReminder,
        requestNotificationAuth,
        getNotificationEnvStatus
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
