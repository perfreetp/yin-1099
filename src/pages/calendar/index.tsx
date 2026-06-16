import React, { useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import CalendarView from '@/components/CalendarView';
import {
  generateCalendarDays,
  getFertileWindow,
  getPeriodRange,
  formatDate,
  diffDays
} from '@/utils/cycle';
import type { DayInfo } from '@/types';
import styles from './index.module.scss';

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const CalendarPage: React.FC = () => {
  const { cycleConfig, records, updateCycleConfig } = useApp();
  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month());
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);

  useDidShow(() => {
    console.log('[CalendarPage] didShow');
  });

  const calendarDays = useMemo(
    () => generateCalendarDays(year, month, cycleConfig, records),
    [year, month, cycleConfig, records]
  );

  const fertileWindow = useMemo(() => getFertileWindow(cycleConfig), [cycleConfig]);
  const periodRange = useMemo(() => getPeriodRange(cycleConfig), [cycleConfig]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
    setSelectedDay(null);
  };

  const handleGoToday = () => {
    const n = dayjs();
    setYear(n.year());
    setMonth(n.month());
    setSelectedDay(null);
  };

  const handleDayClick = (day: DayInfo) => {
    setSelectedDay(day);
  };

  const handleSetOvulation = () => {
    if (!selectedDay) return;
    Taro.showModal({
      title: '设置排卵日',
      content: `确定将 ${formatDate(selectedDay.date, 'M月D日')} 设为实际排卵日吗？`,
      confirmText: '确定',
      cancelText: '取消',
      confirmColor: '#D4859C',
      success: (res) => {
        if (res.confirm) {
          updateCycleConfig({ manualOvulationDate: selectedDay.date });
          Taro.showToast({ title: '已更新', icon: 'success' });
        }
      }
    });
  };

  const getPhaseTagStyle = (phase: string) => {
    const base: React.CSSProperties = {
      padding: '8rpx 16rpx',
      borderRadius: '999rpx',
      fontSize: '22rpx',
      fontWeight: 500
    };
    switch (phase) {
      case 'start':
        return { ...base, background: '#E5F5EC', color: '#4FA67A' };
      case 'peak':
        return { ...base, background: '#FFE8E9', color: '#D96A6E' };
      case 'end':
        return { ...base, background: '#FFF1E5', color: '#D99660' };
      case 'period':
        return { ...base, background: '#F8D7DA', color: '#C9302C' };
      default:
        return { ...base, background: '#F5F0F2', color: '#7A6A70' };
    }
  };

  const getIntensityText = (intensity: number) => {
    if (intensity === 3) return '最高 - 建议今日安排';
    if (intensity === 2) return '中等 - 可开始准备';
    if (intensity === 1) return '较低 - 窗口期尾段';
    return '日常 - 无需特别安排';
  };

  return (
    <View className={styles.container}>
      <View className={styles.monthNav}>
        <View className={styles.monthNavBtn} onClick={handlePrevMonth}>‹</View>
        <View className='flexColumn'>
          <Text className={styles.monthLabel}>{year}年{month + 1}月</Text>
          <Button
            className='ghostButton'
            style={{ height: '48rpx', fontSize: '20rpx', padding: '0 16rpx', marginTop: '8rpx', borderRadius: '24rpx' }}
            onClick={handleGoToday}
          >
            回到今天
          </Button>
        </View>
        <View className={styles.monthNavBtn} onClick={handleNextMonth}>›</View>
      </View>

      <CalendarView
        year={year}
        month={month}
        days={calendarDays}
        onDayClick={handleDayClick}
      />

      <View className={styles.legend}>
        <Text className={styles.legendTitle}>图例说明</Text>
        <View className={styles.legendGrid}>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendColor, styles.colorPeriod)} />
            <Text className={styles.legendLabel}>月经期</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendColor, styles.colorStart)} />
            <Text className={styles.legendLabel}>开始关注</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendColor, styles.colorPeak)} />
            <Text className={styles.legendLabel}>重点安排</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendColor, styles.colorEnd)} />
            <Text className={styles.legendLabel}>临近结束</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendColor, styles.colorToday)} />
            <Text className={styles.legendLabel}>今天</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendColor, styles.colorOvulation)} />
            <Text className={styles.legendLabel}>排卵日</Text>
          </View>
        </View>
      </View>

      {selectedDay && (
        <View className={styles.selectedDayCard}>
          <View className={styles.selectedHeader}>
            <View>
              <Text className={styles.selectedDate}>
                {formatDate(selectedDay.date, 'YYYY年M月D日')}
              </Text>
              <Text className={styles.selectedWeekday}>
                {WEEKDAY_NAMES[new Date(selectedDay.dateObj).getDay()]}
                {selectedDay.isCurrentMonth ? '' : ' · 非本月'}
                {selectedDay.isToday ? ' · 今天' : ''}
              </Text>
            </View>
            <Text
              className={styles.selectedPhaseTag}
              style={getPhaseTagStyle(selectedDay.phase)}
            >
              {selectedDay.phaseText}
            </Text>
          </View>

          <View className={styles.selectedInfoRow}>
            <Text className={styles.selectedInfoLabel}>距离今天</Text>
            <Text className={styles.selectedInfoValue}>
              {diffDays(selectedDay.date, dayjs().format('YYYY-MM-DD')) === 0
                ? '今天'
                : `${Math.abs(diffDays(selectedDay.date, dayjs().format('YYYY-MM-DD')))}天${diffDays(selectedDay.date, dayjs().format('YYYY-MM-DD')) > 0 ? '后' : '前'}`}
            </Text>
          </View>
          <View className={styles.selectedInfoRow}>
            <Text className={styles.selectedInfoLabel}>提醒强度</Text>
            <Text className={styles.selectedInfoValue}>
              {getIntensityText(selectedDay.intensity)}
            </Text>
          </View>
          <View className={styles.selectedInfoRow}>
            <Text className={styles.selectedInfoLabel}>排卵日标记</Text>
            <Text className={styles.selectedInfoValue}>
              {selectedDay.isOvulationDay ? '✓ 排卵日' : '—'}
            </Text>
          </View>
          <View className={styles.selectedInfoRow}>
            <Text className={styles.selectedInfoLabel}>同房记录</Text>
            <Text className={styles.selectedInfoValue}>
              {selectedDay.hasRecord ? '✓ 已记录' : '暂无'}
            </Text>
          </View>

          {!selectedDay.isPeriod && (
            <View style={{ marginTop: '24rpx' }}>
              <Button
                className='primaryButton'
                onClick={handleSetOvulation}
                style={{ width: '100%' }}
              >
                设为排卵日
              </Button>
            </View>
          )}
        </View>
      )}

      <View className={styles.windowSummary}>
        <Text className={styles.windowSummaryTitle}>本周期关键时段</Text>

        <View className={styles.windowPhaseRow}>
          <View className={classnames(styles.windowPhaseDot, styles.dotPeriod)} />
          <Text className={styles.windowPhaseName}>月经期</Text>
          <Text className={styles.windowPhaseRange}>
            {formatDate(periodRange.start, 'M月D日')} - {formatDate(periodRange.end, 'M月D日')}
          </Text>
        </View>

        <View className={styles.windowPhaseRow}>
          <View className={classnames(styles.windowPhaseDot, styles.dotStart)} />
          <Text className={styles.windowPhaseName}>开始关注</Text>
          <Text className={styles.windowPhaseRange}>
            {formatDate(fertileWindow.start, 'M月D日')} - {formatDate(dayjs(fertileWindow.peakStart).subtract(1, 'day').toDate(), 'M月D日')}
          </Text>
        </View>

        <View className={styles.windowPhaseRow}>
          <View className={classnames(styles.windowPhaseDot, styles.dotPeak)} />
          <Text className={styles.windowPhaseName}>重点安排</Text>
          <Text className={styles.windowPhaseRange}>
            {formatDate(fertileWindow.peakStart, 'M月D日')} - {formatDate(fertileWindow.peakEnd, 'M月D日')}
          </Text>
        </View>

        <View className={styles.windowPhaseRow}>
          <View className={classnames(styles.windowPhaseDot, styles.dotEnd)} />
          <Text className={styles.windowPhaseName}>临近结束</Text>
          <Text className={styles.windowPhaseRange}>
            {formatDate(dayjs(fertileWindow.peakEnd).add(1, 'day').toDate(), 'M月D日')} - {formatDate(fertileWindow.end, 'M月D日')}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CalendarPage;
