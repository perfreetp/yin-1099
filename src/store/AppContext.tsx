import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import Taro from '@tarojs/taro';
import type { CycleConfig, ReminderConfig, BbtRecord, TodoItem, AppState, CycleArchive } from '@/types';
import { defaultCycleConfig, defaultReminderConfig, defaultTodos } from '@/data/mock';
import {
  generateId,
  getTodayInfo,
  getOvulationDate,
  formatDate,
  calculateCycleSummary,
  advanceToNextCycle,
  buildArchiveFromConfig
} from '@/utils/cycle';

const STORAGE_KEYS = {
  cycleConfig: 'haoyun_cycle_config',
  reminderConfig: 'haoyun_reminder_config',
  records: 'haoyun_records',
  todos: 'haoyun_todos',
  cycles: 'haoyun_cycles',
  currentCycleIndex: 'haoyun_cycle_index'
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw && raw !== '') {
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
  canSubscribe: boolean;
  hasTemplates: boolean;
}

interface AppContextType extends AppState {
  currentCycleIndex: number;
  updateCycleConfig: (config: Partial<CycleConfig>) => void;
  updateReminderConfig: (config: Partial<ReminderConfig>) => void;
  addRecord: (record: Omit<BbtRecord, 'id' | 'createdAt'>) => void;
  deleteRecord: (id: string) => void;
  toggleTodo: (id: string) => void;
  skipCurrentCycle: (reason?: string) => void;
  resetAllData: () => void;
  moveToNextCycle: () => void;
  getCycleSummary: (cycleIndex?: number) => ReturnType<typeof calculateCycleSummary>;
  getAllCycleSummaries: () => CycleArchive[];
  evalReminder: () => ReminderResult;
  requestNotificationAuth: () => Promise<{ success: boolean; isEnvironmentSupported: boolean; message: string }>;
  getNotificationEnvStatus: () => 'miniapp' | 'h5' | 'unknown';
  canSubscribeMessages: () => boolean;
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
  const [cycles, setCycles] = useState<CycleArchive[]>(() =>
    loadFromStorage<CycleArchive[]>(STORAGE_KEYS.cycles, [])
  );
  const [currentCycleIndex, setCurrentCycleIndex] = useState<number>(() =>
    loadFromStorage<number>(STORAGE_KEYS.currentCycleIndex, 1)
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

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.cycles, cycles);
  }, [cycles]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.currentCycleIndex, currentCycleIndex);
  }, [currentCycleIndex]);

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

  const skipCurrentCycle = useCallback((reason?: string) => {
    setCycleConfig(prev => {
      console.log('[AppContext] skipCurrentCycle, reason:', reason);
      return { ...prev, isSkipped: true, skipReason: reason };
    });
  }, []);

  const resetAllData = useCallback(() => {
    console.log('[AppContext] resetAllData - clearing all state and storage');
    setCycleConfig(defaultCycleConfig);
    setReminderConfig(defaultReminderConfig);
    setRecords([]);
    setTodos(defaultTodos);
    setCycles([]);
    setCurrentCycleIndex(1);
    Taro.removeStorageSync(STORAGE_KEYS.cycleConfig);
    Taro.removeStorageSync(STORAGE_KEYS.reminderConfig);
    Taro.removeStorageSync(STORAGE_KEYS.records);
    Taro.removeStorageSync(STORAGE_KEYS.todos);
    Taro.removeStorageSync(STORAGE_KEYS.cycles);
    Taro.removeStorageSync(STORAGE_KEYS.currentCycleIndex);
  }, []);

  const moveToNextCycle = useCallback(() => {
    console.log('[AppContext] moveToNextCycle');
    const result = advanceToNextCycle(cycleConfig, records, cycles, currentCycleIndex + 1);
    setCycles(result.newCycles);
    setCycleConfig(result.newConfig);
    setCurrentCycleIndex(prev => prev + 1);
    console.log('[AppContext] moved to cycle', currentCycleIndex + 1);
  }, [cycleConfig, records, cycles, currentCycleIndex]);

  const getCycleSummary = useCallback((cycleIndex?: number) => {
    const idx = cycleIndex ?? currentCycleIndex;
    if (idx === currentCycleIndex) {
      return calculateCycleSummary(records, cycleConfig, idx);
    }
    const found = cycles.find(c => c.index === idx);
    if (found) {
      return found.summary;
    }
    return calculateCycleSummary(records, cycleConfig, idx);
  }, [currentCycleIndex, cycleConfig, records, cycles]);

  const getAllCycleSummaries = useCallback((): CycleArchive[] => {
    const currentArchive = buildArchiveFromConfig(cycleConfig, records, currentCycleIndex);
    return [...cycles, currentArchive].sort((a, b) => b.index - a.index);
  }, [cycleConfig, records, cycles, currentCycleIndex]);

  const getNotificationEnvStatus = useCallback((): 'miniapp' | 'h5' | 'unknown' => {
    try {
      if (typeof wx !== 'undefined' && wx.requestSubscribeMessage) return 'miniapp';
      if (typeof Taro !== 'undefined' && Taro.getEnv && Taro.getEnv() === 'WEB') return 'h5';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }, []);

  const canSubscribeMessages = useCallback((): boolean => {
    const env = getNotificationEnvStatus();
    const hasTemplates = reminderConfig.templateIds && reminderConfig.templateIds.length > 0;
    return env === 'miniapp' && !!hasTemplates;
  }, [getNotificationEnvStatus, reminderConfig.templateIds]);

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

    if (!reminderConfig.templateIds || reminderConfig.templateIds.length === 0) {
      return {
        success: false,
        isEnvironmentSupported: true,
        message: '当前环境支持订阅消息，但尚未配置消息模板ID。请在小程序后台添加模板后在此处配置。'
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
        tmplIds: reminderConfig.templateIds,
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
  }, [getNotificationEnvStatus, reminderConfig.templateIds]);

  const evalReminder = useCallback((): ReminderResult => {
    const env = getNotificationEnvStatus();
    const hasTemplates = !!(reminderConfig.templateIds && reminderConfig.templateIds.length > 0);
    const canSubscribe = env === 'miniapp' && hasTemplates;
    const isLocalPreview = !canSubscribe;

    const result: ReminderResult = {
      shouldRemind: false,
      reason: '',
      femaleNotified: false,
      maleNotified: false,
      femaleTime: reminderConfig.femaleTime,
      maleTime: reminderConfig.maleTime,
      phaseText: '',
      intensity: 0,
      isLocalPreview,
      canSubscribe,
      hasTemplates
    };

    if (!reminderConfig.enabled) {
      result.reason = '提醒总开关已关闭';
      return result;
    }

    if (!reminderConfig.notifyFemale && !reminderConfig.notifyMale) {
      result.reason = '女方和男方提醒都已关闭，没有接收人';
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
      const intensityLabel = reminderConfig.intensity === 'all' ? '全部时段' :
        reminderConfig.intensity === 'peak' ? '仅重点期' : '关注+结束';
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
  }, [reminderConfig, cycleConfig, records, getNotificationEnvStatus]);

  const value = useMemo<AppContextType>(() => ({
    cycleConfig,
    reminderConfig,
    records,
    todos,
    cycles,
    currentCycleIndex,
    updateCycleConfig,
    updateReminderConfig,
    addRecord,
    deleteRecord,
    toggleTodo,
    skipCurrentCycle,
    resetAllData,
    moveToNextCycle,
    getCycleSummary,
    getAllCycleSummaries,
    evalReminder,
    requestNotificationAuth,
    getNotificationEnvStatus,
    canSubscribeMessages
  }), [
    cycleConfig, reminderConfig, records, todos, cycles, currentCycleIndex,
    updateCycleConfig, updateReminderConfig, addRecord, deleteRecord, toggleTodo,
    skipCurrentCycle, resetAllData, moveToNextCycle, getCycleSummary,
    getAllCycleSummaries, evalReminder, requestNotificationAuth,
    getNotificationEnvStatus, canSubscribeMessages
  ]);

  return (
    <AppContext.Provider value={value}>
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
