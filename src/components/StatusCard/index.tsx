import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { DayInfo } from '@/types';
import styles from './index.module.scss';

interface StatusCardProps {
  todayInfo: DayInfo;
  daysUntilOvulation: number;
  ovulationDateStr: string;
  isSkipped: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ todayInfo, daysUntilOvulation, ovulationDateStr, isSkipped }) => {
  const getStatusColor = () => {
    if (isSkipped) return 'skipped';
    if (todayInfo.isPeriod) return 'period';
    switch (todayInfo.phase) {
      case 'peak': return 'peak';
      case 'start': return 'start';
      case 'end': return 'end';
      default: return 'normal';
    }
  };

  const getMainText = () => {
    if (isSkipped) return '本周期已跳过';
    if (todayInfo.isPeriod) return '经期中，请多休息';
    if (daysUntilOvulation < 0) return '排卵已过';
    if (daysUntilOvulation === 0) return '今天是排卵日';
    if (daysUntilOvulation <= 3) return `距离排卵还有 ${daysUntilOvulation} 天`;
    return `距离排卵还有 ${daysUntilOvulation} 天`;
  };

  const getSubText = () => {
    if (isSkipped) return '下个周期重新开始记录';
    if (todayInfo.isPeriod) return todayInfo.phaseText;
    if (todayInfo.intensity > 0) {
      const intensityText = todayInfo.intensity === 3 ? '· 建议今日安排' : todayInfo.intensity === 2 ? '· 可开始准备' : '· 窗口期尾段';
      return `${todayInfo.phaseText} ${intensityText}`;
    }
    return `预计排卵日 ${ovulationDateStr}`;
  };

  const status = getStatusColor();

  return (
    <View className={classnames(styles.statusCard, styles[`status-${status}`])}>
      <View className={styles.topRow}>
        <Text className={styles.dateLabel}>今天</Text>
        {todayInfo.hasRecord && (
          <View className={styles.recordBadge}>✓ 已记录</View>
        )}
      </View>
      <Text className={styles.mainText}>{getMainText()}</Text>
      <Text className={styles.subText}>{getSubText()}</Text>
      {todayInfo.intensity > 0 && !isSkipped && (
        <View className={styles.intensityBar}>
          <View className={classnames(styles.intensityDot, todayInfo.intensity >= 1 && styles.active)} />
          <View className={classnames(styles.intensityDot, todayInfo.intensity >= 2 && styles.active)} />
          <View className={classnames(styles.intensityDot, todayInfo.intensity >= 3 && styles.active)} />
          <Text className={styles.intensityLabel}>提醒强度</Text>
        </View>
      )}
    </View>
  );
};

export default StatusCard;
