export type WindowPhase = 'start' | 'peak' | 'end' | 'normal' | 'period' | 'safe';

export interface DayInfo {
  date: string;
  dateObj: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  phase: WindowPhase;
  phaseText: string;
  intensity: number;
  isOvulationDay: boolean;
  isPeriod: boolean;
  hasRecord: boolean;
}

export interface CycleConfig {
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
  ovulationDayOffset: number;
  manualOvulationDate: string | null;
  isSkipped: boolean;
}

export interface ReminderConfig {
  enabled: boolean;
  femaleTime: string;
  maleTime: string;
  notifyFemale: boolean;
  notifyMale: boolean;
  intensity: 'all' | 'peak' | 'start_end';
  vibrate: boolean;
}

export type RecordType = 'intercourse' | 'period_abnormal' | 'medication' | 'symptom';

export interface BbtRecord {
  id: string;
  date: string;
  type: RecordType;
  typeText: string;
  note?: string;
  result?: string;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  title: string;
  desc?: string;
  done: boolean;
  category: 'prep' | 'check' | 'nutrition' | 'lifestyle';
}

export interface CycleSummary {
  cycleCount: number;
  avgCycleLength: number;
  avgPeriodLength: number;
  totalIntercourse: number;
  currentStreak: number;
  lastOvulationDate: string | null;
}

export interface AppState {
  cycleConfig: CycleConfig;
  reminderConfig: ReminderConfig;
  records: BbtRecord[];
  todos: TodoItem[];
}
