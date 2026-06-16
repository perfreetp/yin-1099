import dayjs from 'dayjs';
import type {
  CycleConfig,
  DayInfo,
  WindowPhase,
  CycleSummary,
  BbtRecord,
  CycleArchive,
  RecordType
} from '@/types';

export const formatDate = (date: Date | string, fmt = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(fmt);
};

export const parseDate = (dateStr: string): Date => {
  return dayjs(dateStr).toDate();
};

export const addDays = (date: Date | string, days: number): Date => {
  return dayjs(date).add(days, 'day').toDate();
};

export const diffDays = (date1: Date | string, date2: Date | string): number => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

export const isSameDay = (d1: Date | string, d2: Date | string): boolean => {
  return dayjs(d1).isSame(dayjs(d2), 'day');
};

export const isToday = (date: Date | string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const getOvulationDate = (config: CycleConfig): Date => {
  if (config.manualOvulationDate) {
    return parseDate(config.manualOvulationDate);
  }
  return addDays(config.lastPeriodDate, config.ovulationDayOffset);
};

export const getFertileWindow = (config: CycleConfig): {
  start: Date;
  peakStart: Date;
  ovulation: Date;
  peakEnd: Date;
  end: Date;
  startEnd: Date;
  peakStartEnd: Date;
  endStart: Date;
  endEnd: Date;
} => {
  const ovulation = getOvulationDate(config);
  return {
    start: addDays(ovulation, -6),
    peakStart: addDays(ovulation, -2),
    ovulation,
    peakEnd: addDays(ovulation, 1),
    end: addDays(ovulation, 2),
    startEnd: addDays(ovulation, -3),
    peakStartEnd: addDays(ovulation, 1),
    endStart: addDays(ovulation, 2),
    endEnd: addDays(ovulation, 2)
  };
};

export const getPeriodRange = (config: CycleConfig): { start: Date; end: Date } => {
  const start = parseDate(config.lastPeriodDate);
  const end = addDays(start, config.periodLength - 1);
  return { start, end };
};

export const getNextPeriodDate = (config: CycleConfig): Date => {
  return addDays(config.lastPeriodDate, config.cycleLength);
};

export const getCycleDateRange = (config: CycleConfig): { start: Date; end: Date } => {
  const start = parseDate(config.lastPeriodDate);
  const end = addDays(start, config.cycleLength - 1);
  return { start, end };
};

export const getRecordsForCycle = (records: BbtRecord[], config: CycleConfig): BbtRecord[] => {
  const { start, end } = getCycleDateRange(config);
  return records.filter(r => {
    const d = dayjs(r.date);
    return (d.isAfter(dayjs(start).subtract(1, 'day')) && d.isBefore(dayjs(end).add(1, 'day')));
  });
};

export const getDayPhase = (date: Date | string, config: CycleConfig): {
  phase: WindowPhase;
  phaseText: string;
  intensity: number;
  isOvulationDay: boolean;
  isPeriod: boolean;
} => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const dDay = dayjs(d);
  const ovulation = getOvulationDate(config);
  const period = getPeriodRange(config);

  const isOvulationDay = isSameDay(d, ovulation);
  const isPeriod = dDay.isAfter(dayjs(period.start).subtract(1, 'day')) &&
    dDay.isBefore(dayjs(period.end).add(1, 'day'));

  const dayOffset = dDay.diff(dayjs(ovulation), 'day');

  let phase: WindowPhase = 'safe';
  let phaseText = '安全期';
  let intensity = 0;

  if (isPeriod) {
    phase = 'period';
    phaseText = '月经期';
    intensity = 0;
  } else if (dayOffset >= -6 && dayOffset <= -3) {
    phase = 'start';
    phaseText = '开始关注';
    intensity = 2;
  } else if (dayOffset >= -2 && dayOffset <= 1) {
    if (isOvulationDay) {
      phase = 'peak';
      phaseText = '排卵日 · 重点';
      intensity = 3;
    } else {
      phase = 'peak';
      phaseText = '重点安排';
      intensity = 3;
    }
  } else if (dayOffset === 2) {
    phase = 'end';
    phaseText = '临近结束';
    intensity = 1;
  } else if (dDay.isAfter(dayjs(period.end)) && dDay.isBefore(dayjs(addDays(ovulation, -6)))) {
    phase = 'normal';
    phaseText = '日常';
    intensity = 0;
  } else {
    phase = 'safe';
    phaseText = '安全期';
    intensity = 0;
  }

  return { phase, phaseText, intensity, isOvulationDay, isPeriod };
};

const getRecordTypeFlags = (dateStr: string, records: BbtRecord[]) => {
  const dayRecords = records.filter(r => r.date === dateStr);
  return {
    hasRecord: dayRecords.length > 0,
    hasIntercourse: dayRecords.some(r => r.type === 'intercourse'),
    hasMedication: dayRecords.some(r => r.type === 'medication'),
    hasSymptom: dayRecords.some(r => r.type === 'symptom'),
    hasAbnormal: dayRecords.some(r => r.type === 'period_abnormal'),
    recordCount: dayRecords.length
  };
};

export const generateCalendarDays = (
  year: number,
  month: number,
  config: CycleConfig,
  records: BbtRecord[]
): DayInfo[] => {
  const firstDay = dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`);
  const startDay = firstDay.subtract(firstDay.day(), 'day');
  const days: DayInfo[] = [];

  for (let i = 0; i < 42; i++) {
    const d = startDay.add(i, 'day');
    const dateStr = d.format('YYYY-MM-DD');
    const dayPhase = getDayPhase(d.toDate(), config);
    const recordFlags = getRecordTypeFlags(dateStr, records);

    days.push({
      date: dateStr,
      dateObj: d.toDate(),
      isCurrentMonth: d.month() === month,
      isToday: isToday(d.toDate()),
      ...dayPhase,
      ...recordFlags
    });
  }

  return days;
};

export const getTodayInfo = (config: CycleConfig, records: BbtRecord[]): DayInfo => {
  const today = dayjs();
  const dateStr = today.format('YYYY-MM-DD');
  const dayPhase = getDayPhase(today.toDate(), config);
  const recordFlags = getRecordTypeFlags(dateStr, records);

  return {
    date: dateStr,
    dateObj: today.toDate(),
    isCurrentMonth: true,
    isToday: true,
    ...dayPhase,
    ...recordFlags
  };
};

export const getDaysUntilOvulation = (config: CycleConfig): number => {
  const ovulation = getOvulationDate(config);
  return diffDays(ovulation, dayjs().toDate());
};

export const calculateCycleSummary = (
  records: BbtRecord[],
  config: CycleConfig,
  cycleIndex: number
): CycleSummary => {
  const cycleRecords = getRecordsForCycle(records, config);
  const intercourseRecords = cycleRecords.filter(r => r.type === 'intercourse');
  const abnormalRecords = cycleRecords.filter(r => r.type === 'period_abnormal');
  const medicationRecords = cycleRecords.filter(r => r.type === 'medication');
  const symptomRecords = cycleRecords.filter(r => r.type === 'symptom');

  const avgCycleLength = config.cycleLength;
  const avgPeriodLength = config.periodLength;
  const cycleRange = getCycleDateRange(config);

  let currentStreak = 0;
  const sortedRecords = [...intercourseRecords].sort((a, b) => diffDays(b.date, a.date));

  if (sortedRecords.length > 0) {
    let prevDate = dayjs(cycleRange.end).add(1, 'day');
    for (const rec of sortedRecords) {
      const diff = Math.abs(diffDays(prevDate.toDate(), rec.date));
      if (diff <= 2) {
        currentStreak++;
        prevDate = dayjs(rec.date);
      } else {
        break;
      }
    }
  }

  const ovulation = getOvulationDate(config);

  const fertileDaysTotal = 9;
  const peakDaysTotal = 4;

  const intercourseDates = new Set(intercourseRecords.map(r => r.date));

  let coveredPeakDays = 0;
  for (let i = -2; i <= 1; i++) {
    const d = addDays(ovulation, i);
    const ds = dayjs(d).format('YYYY-MM-DD');
    if (intercourseDates.has(ds)) {
      coveredPeakDays++;
    }
  }

  const coveragePercent = peakDaysTotal > 0 ?
    Math.round((coveredPeakDays / peakDaysTotal) * 100) : 0;
  const hasAbnormalPeriod = abnormalRecords.length > 0;
  const hasMedication = medicationRecords.length > 0;
  const isSkipped = config.isSkipped;

  const parts: string[] = [];
  if (isSkipped) {
    parts.push('本周期已跳过');
    if (config.skipReason) {
      parts.push(`（${config.skipReason}）`);
    }
    parts.push('，回顾数据仅供参考。');
  }
  if (coveredPeakDays >= 3) {
    parts.push('重点时段覆盖良好，安排到位。');
  } else if (coveredPeakDays >= 1) {
    parts.push('重点时段部分覆盖，建议增加安排频率。');
  } else if (intercourseRecords.length > 0) {
    parts.push('同房记录未覆盖重点时段，注意时机。');
  } else {
    parts.push('暂无同房记录，请在易孕期合理安排。');
  }
  if (hasAbnormalPeriod) {
    parts.push('本周期有月经异常记录，建议关注周期规律性。');
  }
  if (hasMedication) {
    parts.push('本周期有用药记录，部分药物可能影响受孕。');
  }
  if (symptomRecords.length > 0) {
    parts.push(`有 ${symptomRecords.length} 条身体症状记录。`);
  }

  return {
    cycleIndex,
    cycleStartDate: formatDate(cycleRange.start),
    cycleEndDate: formatDate(cycleRange.end),
    cycleCount: 1,
    avgCycleLength,
    avgPeriodLength,
    totalIntercourse: intercourseRecords.length,
    currentStreak,
    lastOvulationDate: formatDate(getOvulationDate(config)),
    fertileDaysTotal,
    coveredPeakDays,
    peakDaysTotal,
    coveragePercent,
    hasAbnormalPeriod,
    hasMedication,
    isSkipped,
    skipReason: config.skipReason,
    reviewNote: parts.join(''),
    totalRecords: cycleRecords.length,
    symptomCount: symptomRecords.length,
    medicationCount: medicationRecords.length,
    abnormalCount: abnormalRecords.length
  };
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const buildArchiveFromConfig = (
  config: CycleConfig,
  records: BbtRecord[],
  index: number
): CycleArchive => {
  const summary = calculateCycleSummary(records, config, index);
  return {
    index,
    config: { ...config },
    summary
  };
};

export const advanceToNextCycle = (
  currentConfig: CycleConfig,
  allRecords: BbtRecord[],
  historyCycles: CycleArchive[],
  nextCycleIndex: number
): {
  newConfig: CycleConfig;
  newRecords: BbtRecord[];
  newCycles: CycleArchive[];
} => {
  const currentIndex = nextCycleIndex - 1;
  const archive = buildArchiveFromConfig(currentConfig, allRecords, currentIndex);

  const newCycles = [...historyCycles, archive];

  const nextStartDate = dayjs(currentConfig.lastPeriodDate)
    .add(currentConfig.cycleLength, 'day')
    .format('YYYY-MM-DD');

  const newConfig: CycleConfig = {
    ...currentConfig,
    lastPeriodDate: nextStartDate,
    manualOvulationDate: null,
    isSkipped: false,
    skipReason: undefined
  };

  return {
    newConfig,
    newRecords: allRecords,
    newCycles
  };
};

export const getRecordTypeLabel = (type: RecordType): string => {
  switch (type) {
    case 'intercourse': return '同房';
    case 'period_abnormal': return '月经异常';
    case 'medication': return '用药';
    case 'symptom': return '症状';
    default: return '记录';
  }
};

export const getRecordTypeIcon = (type: RecordType): string => {
  switch (type) {
    case 'intercourse': return '💕';
    case 'period_abnormal': return '🩸';
    case 'medication': return '💊';
    case 'symptom': return '📝';
    default: return '📋';
  }
};
