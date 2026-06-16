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
  hasIntercourse: boolean;
  hasMedication: boolean;
  hasSymptom: boolean;
  hasAbnormal: boolean;
  recordCount: number;
}

export interface CycleConfig {
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
  ovulationDayOffset: number;
  manualOvulationDate: string | null;
  isSkipped: boolean;
  skipReason?: string;
}

export interface ReminderConfig {
  enabled: boolean;
  femaleTime: string;
  maleTime: string;
  notifyFemale: boolean;
  notifyMale: boolean;
  intensity: 'all' | 'peak' | 'start_end';
  vibrate: boolean;
  templateIds?: string[];
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
  cycleIndex: number;
  cycleStartDate: string;
  cycleEndDate: string;
  cycleCount: number;
  avgCycleLength: number;
  avgPeriodLength: number;
  totalIntercourse: number;
  currentStreak: number;
  lastOvulationDate: string | null;
  fertileDaysTotal: number;
  coveredPeakDays: number;
  peakDaysTotal: number;
  coveragePercent: number;
  hasAbnormalPeriod: boolean;
  hasMedication: boolean;
  isSkipped: boolean;
  skipReason?: string;
  reviewNote: string;
  totalRecords: number;
  symptomCount: number;
  medicationCount: number;
  abnormalCount: number;
}

export interface CycleArchive {
  index: number;
  config: CycleConfig;
  summary: CycleSummary;
}

export interface AppState {
  cycleConfig: CycleConfig;
  reminderConfig: ReminderConfig;
  records: BbtRecord[];
  todos: TodoItem[];
  cycles: CycleArchive[];
}
