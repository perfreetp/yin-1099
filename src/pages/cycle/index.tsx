import React, { useMemo, useState } from 'react';
import { View, Text, Switch, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import StatusCard from '@/components/StatusCard';
import {
  getTodayInfo,
  getDaysUntilOvulation,
  getOvulationDate,
  getFertileWindow,
  getPeriodRange,
  getNextPeriodDate,
  formatDate
} from '@/utils/cycle';
import styles from './index.module.scss';

const CyclePage: React.FC = () => {
  const {
    cycleConfig,
    records,
    updateCycleConfig,
    skipCurrentCycle
  } = useApp();

  const [editing, setEditing] = useState(false);

  useDidShow(() => {
    console.log('[CyclePage] didShow');
  });

  const todayInfo = useMemo(() => getTodayInfo(cycleConfig, records), [cycleConfig, records]);
  const daysUntilOvulation = useMemo(() => getDaysUntilOvulation(cycleConfig), [cycleConfig]);
  const ovulationDate = useMemo(() => getOvulationDate(cycleConfig), [cycleConfig]);
  const fertileWindow = useMemo(() => getFertileWindow(cycleConfig), [cycleConfig]);
  const periodRange = useMemo(() => getPeriodRange(cycleConfig), [cycleConfig]);
  const nextPeriodDate = useMemo(() => getNextPeriodDate(cycleConfig), [cycleConfig]);

  const timelineSegments = useMemo(() => {
    const total = cycleConfig.cycleLength;
    const follicularPhase = cycleConfig.ovulationDayOffset - cycleConfig.periodLength;
    const ovulationPhase = 4;
    const lutealPhase = total - cycleConfig.ovulationDayOffset - 1;

    return [
      { name: '经期', width: (cycleConfig.periodLength / total) * 100, color: '#F5B7B1' },
      { name: '卵泡期', width: (follicularPhase / total) * 100, color: '#F5D5DE' },
      { name: '排卵期', width: (ovulationPhase / total) * 100, color: '#FF9A9E' },
      { name: '黄体期', width: Math.max((lutealPhase / total) * 100, 8), color: '#E8A5B8' }
    ];
  }, [cycleConfig]);

  const handleChangeCycleLength = (delta: number) => {
    const newVal = Math.max(21, Math.min(45, cycleConfig.cycleLength + delta));
    updateCycleConfig({ cycleLength: newVal });
  };

  const handleChangePeriodLength = (delta: number) => {
    const newVal = Math.max(2, Math.min(10, cycleConfig.periodLength + delta));
    updateCycleConfig({ periodLength: newVal });
  };

  const handleChangeOvulationOffset = (delta: number) => {
    const newVal = Math.max(7, Math.min(cycleConfig.cycleLength - 1, cycleConfig.ovulationDayOffset + delta));
    updateCycleConfig({ ovulationDayOffset: newVal });
  };

  const handleSelectDate = async (field: 'lastPeriodDate' | 'manualOvulationDate') => {
    try {
      const res = await Taro.chooseDate({
        type: 'date',
        begin: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
        end: dayjs().add(3, 'month').format('YYYY-MM-DD'),
        value: field === 'lastPeriodDate'
          ? cycleConfig.lastPeriodDate
          : (cycleConfig.manualOvulationDate || formatDate(ovulationDate))
      });

      if (res && res.value) {
        if (field === 'lastPeriodDate') {
          updateCycleConfig({ lastPeriodDate: res.value });
        } else {
          updateCycleConfig({ manualOvulationDate: res.value });
        }
      }
    } catch (err) {
      console.error('[CyclePage] chooseDate error:', err);
    }
  };

  const handleToggleManualOvulation = (checked: boolean) => {
    if (checked) {
      updateCycleConfig({ manualOvulationDate: formatDate(ovulationDate) });
    } else {
      updateCycleConfig({ manualOvulationDate: null });
    }
  };

  const handleSkipCycle = () => {
    Taro.showModal({
      title: '跳过本周期',
      content: '确定要跳过当前周期吗？下个周期将重新开始记录。',
      confirmText: '跳过',
      cancelText: '取消',
      confirmColor: '#D4859C',
      success: (res) => {
        if (res.confirm) {
          skipCurrentCycle();
          Taro.showToast({ title: '已跳过', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className={styles.container}>
      <View className={styles.pageHeader}>
        <View className='flexRow'>
          <Text className={styles.pageTitle}>今天</Text>
          {cycleConfig.isSkipped && (
            <Text className={styles.skippedTag}>已跳过</Text>
          )}
        </View>
        <Text className={styles.pageSubtitle}>
          {dayjs().format('YYYY年M月D日 dddd')} · 第 {dayjs().diff(dayjs(cycleConfig.lastPeriodDate), 'day') + 1} 天
        </Text>
      </View>

      <StatusCard
        todayInfo={todayInfo}
        daysUntilOvulation={daysUntilOvulation}
        ovulationDateStr={formatDate(ovulationDate, 'M月D日')}
        isSkipped={cycleConfig.isSkipped}
      />

      <View className={styles.formCard}>
        <Text className={styles.formCardTitle}>周期参数</Text>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>末次月经</Text>
          <View
            className={styles.dateDisplay}
            onClick={() => handleSelectDate('lastPeriodDate')}
          >
            {formatDate(cycleConfig.lastPeriodDate, 'M月D日')}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>周期长度</Text>
          <View className='flexRow'>
            <View className={styles.numberStepper}>
              <View className={styles.stepBtn} onClick={() => handleChangeCycleLength(-1)}>−</View>
              <Text className={styles.stepValue}>{cycleConfig.cycleLength}</Text>
              <View className={styles.stepBtn} onClick={() => handleChangeCycleLength(1)}>+</View>
            </View>
            <Text className={styles.stepUnit}>天</Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>经期长度</Text>
          <View className='flexRow'>
            <View className={styles.numberStepper}>
              <View className={styles.stepBtn} onClick={() => handleChangePeriodLength(-1)}>−</View>
              <Text className={styles.stepValue}>{cycleConfig.periodLength}</Text>
              <View className={styles.stepBtn} onClick={() => handleChangePeriodLength(1)}>+</View>
            </View>
            <Text className={styles.stepUnit}>天</Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>排卵日偏移</Text>
          <View className='flexRow'>
            <View className={styles.numberStepper}>
              <View className={styles.stepBtn} onClick={() => handleChangeOvulationOffset(-1)}>−</View>
              <Text className={styles.stepValue}>{cycleConfig.ovulationDayOffset}</Text>
              <View className={styles.stepBtn} onClick={() => handleChangeOvulationOffset(1)}>+</View>
            </View>
            <Text className={styles.stepUnit}>天</Text>
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formCardTitle}>手动修正</Text>

        <View className={styles.switchRow}>
          <View className={styles.switchLabel}>
            <Text className={styles.switchTitle}>手动设置排卵日</Text>
            <Text className={styles.switchDesc}>
              根据排卵试纸或体感信号，手动修正更准确
            </Text>
          </View>
          <Switch
            checked={!!cycleConfig.manualOvulationDate}
            onChange={(e) => handleToggleManualOvulation(e.detail.value)}
            color='#E8A5B8'
          />
        </View>

        {cycleConfig.manualOvulationDate && (
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>实际排卵日</Text>
            <View
              className={styles.dateDisplay}
              onClick={() => handleSelectDate('manualOvulationDate')}
            >
              {formatDate(cycleConfig.manualOvulationDate, 'M月D日')}
            </View>
          </View>
        )}
      </View>

      <View className={styles.timelineCard}>
        <Text className={styles.timelineTitle}>周期时间轴</Text>
        <View className={styles.timeline}>
          <View className={styles.timelineBar}>
            {timelineSegments.map((seg, idx) => (
              <View
                key={idx}
                className={styles.timelineSegment}
                style={{ width: `${seg.width}%`, background: seg.color }}
              />
            ))}
          </View>
          <View className={styles.timelineLabels}>
            <View className={styles.timelineLabelItem}>
              <Text className={styles.timelineLabelName}>经期开始</Text>
              <Text className={styles.timelineLabelDate}>{formatDate(periodRange.start, 'M月D日')}</Text>
            </View>
            <View className={styles.timelineLabelItem}>
              <Text className={styles.timelineLabelName}>排卵日</Text>
              <Text className={styles.timelineLabelDate}>{formatDate(fertileWindow.ovulation, 'M月D日')}</Text>
            </View>
            <View className={styles.timelineLabelItem}>
              <Text className={styles.timelineLabelName}>下次月经</Text>
              <Text className={styles.timelineLabelDate}>{formatDate(nextPeriodDate, 'M月D日')}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.actionButtons}>
        <Button
          className={styles.skipButton}
          onClick={handleSkipCycle}
          disabled={cycleConfig.isSkipped}
        >
          {cycleConfig.isSkipped ? '本周期已跳过' : '跳过本周期'}
        </Button>
      </View>
    </View>
  );
};

export default CyclePage;
