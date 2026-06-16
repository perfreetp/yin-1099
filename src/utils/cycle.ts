import dayjs from 'dayjs';
import type { CycleConfig, DayInfo, WindowPhase, CycleSummary, BbtRecord } from '@/types';

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

export const getFertileWindow = (config: CycleConfig): { start: Date; peakStart: Date; ovulation: Date; peakEnd: Date; end: Date } => {
  const ovulation = getOvulationDate(config);
  return {
    start: addDays(ovulation, -6),
    peakStart: addDays(ovulation, -2),
    ovulation,
    peakEnd: addDays(ovulation, 1),
    end: addDays(ovulation, 1)
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

export const getDayPhase = (date: Date | string, config: CycleConfig): { phase: WindowPhase; phaseText: string; intensity: number; isOvulationDay: boolean; isPeriod: boolean } => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const fertile = getFertileWindow(config);
  const period = getPeriodRange(config);

  const isOvulationDay = isSameDay(d, fertile.ovulation);
  const isPeriod = (dayjs(d).isAfter(dayjs(period.start).subtract(1, 'day')) && dayjs(d).isBefore(dayjs(period.end).add(1, 'day')));

  let phase: WindowPhase = 'safe';
  let phaseText = '安全期';
  let intensity = 0;

  if (isPeriod) {
    phase = 'period';
    phaseText = '月经期';
    intensity = 0;
  } else if (isOvulationDay) {
    phase = 'peak';
    phaseText = '排卵日 · 重点';
    intensity = 3;
  } else if (dayjs(d).isAfter(dayjs(fertile.peakStart).subtract(1, 'day')) && dayjs(d).isBefore(dayjs(fertile.peakEnd).add(1, 'day'))) {
    phase = 'peak';
    phaseText = '重点安排';
    intensity = 3;
  } else if (dayjs(d).isAfter(dayjs(fertile.start).subtract(1, 'day')) && dayjs(d).isBefore(dayjs(fertile.peakStart))) {
    phase = 'start';
    phaseText = '开始关注';
    intensity = 2;
  } else if (dayjs(d).isAfter(dayjs(fertile.peakEnd)) && dayjs(d).isBefore(dayjs(addDays(fertile.end, 1)))) {
    phase = 'end';
    phaseText = '临近结束';
    intensity = 1;
  } else {
    const nextPeriod = getNextPeriodDate(config);
    if (dayjs(d).isAfter(dayjs(fertile.end)) && dayjs(d).isBefore(dayjs(nextPeriod).subtract(3, 'day'))) {
      phase = 'safe';
      phaseText = '安全期';
      intensity = 0;
    } else if (dayjs(d).isAfter(dayjs(period.end)) && dayjs(d).isBefore(dayjs(fertile.start))) {
      phase = 'normal';
      phaseText = '日常';
      intensity = 0;
    }
  }

  return { phase, phaseText, intensity, isOvulationDay, isPeriod };
};

export const generateCalendarDays = (year: number, month: number, config: CycleConfig, records: BbtRecord[]): DayInfo[] => {
  const firstDay = dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`);
  const startDay = firstDay.subtract(firstDay.day(), 'day');
  const days: DayInfo[] = [];
  const recordDates = new Set(records.filter(r => r.type === 'intercourse').map(r => r.date));

  for (let i = 0; i < 42; i++) {
    const d = startDay.add(i, 'day');
    const dateStr = d.format('YYYY-MM-DD');
    const dayPhase = getDayPhase(d.toDate(), config);

    days.push({
      date: dateStr,
      dateObj: d.toDate(),
      isCurrentMonth: d.month() === month,
      isToday: isToday(d.toDate()),
      ...dayPhase,
      hasRecord: recordDates.has(dateStr)
    });
  }

  return days;
};

export const getTodayInfo = (config: CycleConfig, records: BbtRecord[]): DayInfo => {
  const today = dayjs();
  const dateStr = today.format('YYYY-MM-DD');
  const dayPhase = getDayPhase(today.toDate(), config);
  const recordDates = new Set(records.filter(r => r.type === 'intercourse').map(r => r.date));

  return {
    date: dateStr,
    dateObj: today.toDate(),
    isCurrentMonth: true,
    isToday: true,
    ...dayPhase,
    hasRecord: recordDates.has(dateStr)
  };
};

export const getDaysUntilOvulation = (config: CycleConfig): number => {
  const ovulation = getOvulationDate(config);
  return diffDays(ovulation, dayjs().toDate());
};

export const calculateCycleSummary = (records: BbtRecord[], config: CycleConfig): CycleSummary => {
  const intercourseRecords = records.filter(r => r.type === 'intercourse');
  const avgCycleLength = config.cycleLength;
  const avgPeriodLength = config.periodLength;

  let currentStreak = 0;
  const sortedRecords = [...intercourseRecords].sort((a, b) => diffDays(b.date, a.date));

  if (sortedRecords.length > 0) {
    let prevDate = dayjs();
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

  return {
    cycleCount: 1,
    avgCycleLength,
    avgPeriodLength,
    totalIntercourse: intercourseRecords.length,
    currentStreak,
    lastOvulationDate: formatDate(getOvulationDate(config))
  };
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
