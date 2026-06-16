import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { DayInfo, RecordType } from '@/types';
import styles from './index.module.scss';

interface CalendarViewProps {
  year: number;
  month: number;
  days: DayInfo[];
  onDayClick?: (day: DayInfo) => void;
}

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const RECORD_TYPES: Array<{ type: RecordType; className: string }> = [
  { type: 'intercourse', className: 'dotIntercourse' },
  { type: 'medication', className: 'dotMedication' },
  { type: 'symptom', className: 'dotSymptom' },
  { type: 'period_abnormal', className: 'dotAbnormal' }
];

const CalendarView: React.FC<CalendarViewProps> = ({ year, month, days, onDayClick }) => {
  const getDayClass = (day: DayInfo) => {
    const classes = [styles.calendarDay];
    if (!day.isCurrentMonth) classes.push(styles.otherMonth);
    if (day.isToday) classes.push(styles.today);
    if (day.isOvulationDay) classes.push(styles.ovulationDay);

    switch (day.phase) {
      case 'start':
        classes.push(styles.phaseStart);
        break;
      case 'peak':
        classes.push(styles.phasePeak);
        break;
      case 'end':
        classes.push(styles.phaseEnd);
        break;
      case 'period':
        classes.push(styles.phasePeriod);
        break;
      default:
        break;
    }

    return classes;
  };

  const getIntensityDots = (intensity: number) => {
    return Array.from({ length: 3 }, (_, i) => i < intensity);
  };

  const getActiveRecordTypes = (day: DayInfo): RecordType[] => {
    const types: RecordType[] = [];
    if (day.hasIntercourse) types.push('intercourse');
    if (day.hasMedication) types.push('medication');
    if (day.hasSymptom) types.push('symptom');
    if (day.hasAbnormal) types.push('period_abnormal');
    return types;
  };

  return (
    <View className={styles.calendar}>
      <View className={styles.weekHeader}>
        {WEEK_LABELS.map((label, idx) => (
          <Text key={idx} className={styles.weekLabel}>{label}</Text>
        ))}
      </View>

      <View className={styles.daysGrid}>
        {days.map((day, idx) => (
          <View
            key={idx}
            className={classnames(...getDayClass(day))}
            onClick={() => onDayClick?.(day)}
          >
            <Text className={styles.dayNumber}>
              {new Date(day.dateObj).getDate()}
            </Text>

            {day.isOvulationDay && (
              <View className={styles.ovulationMark}>卵</View>
            )}

            {day.recordCount > 0 && day.isCurrentMonth && (
              <View className={styles.recordDotsRow}>
                {RECORD_TYPES
                  .filter(t => {
                  switch (t.type) {
                    case 'intercourse': return day.hasIntercourse;
                    case 'medication': return day.hasMedication;
                    case 'symptom': return day.hasSymptom;
                    case 'period_abnormal': return day.hasAbnormal;
                    default: return false;
                  }
                })
                  .map(t => (
                    <View key={t.type} className={classnames(styles.recordDotMini, styles[t.className])} />
                  ))
                }
              </View>
            )}

            {day.intensity > 0 && day.isCurrentMonth && !day.isPeriod && (
              <View className={styles.intensityDots}>
                {getIntensityDots(day.intensity).map((active, i) => (
                  <View
                    key={i}
                    className={classnames(
                      styles.intensityMiniDot,
                      active && styles.active
                    )}
                  />
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default CalendarView;
