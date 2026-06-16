import React from 'react';
import { View, Text, Switch } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import ReminderItem from '@/components/ReminderItem';
import { getDaysUntilOvulation, getOvulationDate, formatDate } from '@/utils/cycle';
import styles from './index.module.scss';

const INTENSITY_OPTIONS = [
  { value: 'all', title: '全部时段', desc: '易孕期内每天提醒' },
  { value: 'peak', title: '仅重点期', desc: '排卵日前后3天提醒' },
  { value: 'start_end', title: '关注+结束', desc: '开始和结束阶段提醒' }
] as const;

const ReminderPage: React.FC = () => {
  const { reminderConfig, updateReminderConfig, cycleConfig } = useApp();

  useDidShow(() => {
    console.log('[ReminderPage] didShow');
  });

  const handlePickTime = async (field: 'femaleTime' | 'maleTime') => {
    try {
      const res = await Taro.chooseDate({
        type: 'time',
        value: field === 'femaleTime' ? reminderConfig.femaleTime : reminderConfig.maleTime
      });
      if (res && res.value) {
        updateReminderConfig({ [field]: res.value } as any);
      }
    } catch (err) {
      console.error('[ReminderPage] chooseDate error:', err);
    }
  };

  const daysUntil = getDaysUntilOvulation(cycleConfig);
  const ovuDate = getOvulationDate(cycleConfig);

  return (
    <View className={styles.container}>
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>提醒设置</Text>
        <Text className={styles.pageDesc}>
          为你们设置专属提醒，不错过每一个关键时机
        </Text>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionLabel}>总开关</Text>
        <View className={styles.switchRow}>
          <View className={styles.switchContent}>
            <Text className={styles.switchTitle}>开启提醒通知</Text>
            <Text className={styles.switchDesc}>
              {reminderConfig.enabled
                ? `距离下次排卵还有 ${Math.max(0, daysUntil)} 天`
                : '已关闭所有提醒通知'}
            </Text>
          </View>
          <Switch
            checked={reminderConfig.enabled}
            onChange={(e) => updateReminderConfig({ enabled: e.detail.value })}
            color='#E8A5B8'
          />
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionLabel}>通知时间（可分别设置）</Text>

        <View className={styles.switchRow}>
          <View className={styles.switchContent}>
            <Text className={styles.switchTitle}>女方提醒</Text>
            <Text className={styles.switchDesc}>主通知，附带身体状态建议</Text>
          </View>
          <View className='flexRow'>
            <View
              className={styles.timePicker}
              onClick={() => handlePickTime('femaleTime')}
            >
              <Text className={styles.timeText}>{reminderConfig.femaleTime}</Text>
            </View>
            <Switch
              checked={reminderConfig.notifyFemale}
              onChange={(e) => updateReminderConfig({ notifyFemale: e.detail.value })}
              color='#E8A5B8'
              style={{ marginLeft: '16rpx' }}
            />
          </View>
        </View>

        <View className={styles.switchRow}>
          <View className={styles.switchContent}>
            <Text className={styles.switchTitle}>男方提醒</Text>
            <Text className={styles.switchDesc}>错开时间，避免打扰</Text>
          </View>
          <View className='flexRow'>
            <View
              className={styles.timePicker}
              onClick={() => handlePickTime('maleTime')}
            >
              <Text className={styles.timeText}>{reminderConfig.maleTime}</Text>
            </View>
            <Switch
              checked={reminderConfig.notifyMale}
              onChange={(e) => updateReminderConfig({ notifyMale: e.detail.value })}
              color='#E8A5B8'
              style={{ marginLeft: '16rpx' }}
            />
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionLabel}>提醒强度</Text>

        <View className={styles.optionsGroup}>
          <View className={styles.optionItem} onClick={() => updateReminderConfig({ intensity: 'all' })}>
            <View className={styles.optionLabel}>
              <Text className={styles.optionTitle}>全部时段</Text>
              <Text className={styles.optionDesc}>易孕期7天内每天提醒，不遗漏机会</Text>
            </View>
            <View className={classnames(styles.radioBox, reminderConfig.intensity === 'all' && styles.checked)}>
              <View className={styles.radioInner} />
            </View>
          </View>

          <View className={styles.optionItem} onClick={() => updateReminderConfig({ intensity: 'peak' })}>
            <View className={styles.optionLabel}>
              <Text className={styles.optionTitle}>仅重点期</Text>
              <Text className={styles.optionDesc}>排卵日前2天到后1天，最高效时段</Text>
            </View>
            <View className={classnames(styles.radioBox, reminderConfig.intensity === 'peak' && styles.checked)}>
              <View className={styles.radioInner} />
            </View>
          </View>

          <View className={styles.optionItem} onClick={() => updateReminderConfig({ intensity: 'start_end' })}>
            <View className={styles.optionLabel}>
              <Text className={styles.optionTitle}>起止阶段</Text>
              <Text className={styles.optionDesc}>开始关注 + 临近结束，减少打扰</Text>
            </View>
            <View className={classnames(styles.radioBox, reminderConfig.intensity === 'start_end' && styles.checked)}>
              <View className={styles.radioInner} />
            </View>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionLabel}>提示方式</Text>

        <View className={styles.switchRow}>
          <View className={styles.switchContent}>
            <Text className={styles.switchTitle}>震动提醒</Text>
            <Text className={styles.switchDesc}>安静环境下不错过提醒</Text>
          </View>
          <Switch
            checked={reminderConfig.vibrate}
            onChange={(e) => updateReminderConfig({ vibrate: e.detail.value })}
            color='#E8A5B8'
          />
        </View>
      </View>

      {reminderConfig.enabled && (
        <View className={styles.previewCard}>
          <Text className={styles.previewLabel}>通知预览 · 下次提醒</Text>
          <View className={styles.previewContent}>
            <View className={styles.previewIcon}>💗</View>
            <View className={styles.previewTextWrap}>
              <Text className={styles.previewTitle}>
                {daysUntil > 3
                  ? '开始关注易孕期'
                  : daysUntil >= 0
                    ? '进入重点安排时段'
                    : '易孕期即将结束'}
              </Text>
              <Text className={styles.previewDesc}>
                {daysUntil > 0
                  ? `距离排卵日还有 ${daysUntil} 天（${formatDate(ovuDate, 'M月D日')}）`
                  : daysUntil === 0
                    ? '今天就是排卵日，把握最佳时机'
                    : '下次月经前保持规律作息'}
              </Text>
              <Text className={styles.timeRangeTag}>
                女方 {reminderConfig.femaleTime} · 男方 {reminderConfig.maleTime}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ReminderPage;
