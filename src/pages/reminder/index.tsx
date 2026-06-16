import React, { useState } from 'react';
import { View, Text, Switch, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getDaysUntilOvulation, getOvulationDate, getTodayInfo, formatDate } from '@/utils/cycle';
import styles from './index.module.scss';

const ReminderPage: React.FC = () => {
  const { reminderConfig, updateReminderConfig, cycleConfig, records, requestNotificationAuth, checkAndSendReminder } = useApp();
  const [authStatus, setAuthStatus] = useState<'unknown' | 'authorized' | 'denied'>('unknown');

  useDidShow(() => {
    console.log('[ReminderPage] didShow');
    checkNotificationAuth();
  });

  const checkNotificationAuth = async () => {
    try {
      const setting = await Taro.getSetting();
      const authorized = setting.authSetting['scope.subscribeMessage'] || setting.authSetting['scope.notification'] || false;
      setAuthStatus(authorized ? 'authorized' : 'denied');
      console.log('[ReminderPage] authStatus:', authorized ? 'authorized' : 'denied');
    } catch (err) {
      console.error('[ReminderPage] checkAuth error:', err);
      setAuthStatus('unknown');
    }
  };

  const handleRequestAuth = async () => {
    try {
      await requestNotificationAuth();
      setAuthStatus('authorized');
      Taro.showToast({ title: '授权成功', icon: 'success' });
    } catch (err) {
      console.error('[ReminderPage] requestAuth error:', err);
      setAuthStatus('denied');
      Taro.showModal({
        title: '需要通知权限',
        content: '请在系统设置中开启本应用的通知权限，以便接收备孕提醒。您也可以稍后在系统设置中手动开启。',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#D4859C'
      });
    }
  };

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

  const handleTestReminder = () => {
    checkAndSendReminder();
  };

  const daysUntil = getDaysUntilOvulation(cycleConfig);
  const ovuDate = getOvulationDate(cycleConfig);
  const todayInfo = getTodayInfo(cycleConfig, records);

  const getAuthText = () => {
    if (authStatus === 'authorized') return '✓ 已授权通知';
    if (authStatus === 'denied') return '✗ 通知未授权';
    return '未检测到授权状态';
  };

  const getAuthColor = () => {
    if (authStatus === 'authorized') return '#7EC8A3';
    if (authStatus === 'denied') return '#D9534F';
    return '#B0A2A8';
  };

  return (
    <View className={styles.container}>
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>提醒设置</Text>
        <Text className={styles.pageDesc}>
          为你们设置专属提醒，不错过每一个关键时机
        </Text>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionLabel}>通知授权</Text>
        <View className={styles.switchRow}>
          <View className={styles.switchContent}>
            <Text className={styles.switchTitle}>通知权限状态</Text>
            <Text className={styles.switchDesc} style={{ color: getAuthColor() }}>
              {getAuthText()}
            </Text>
          </View>
          {authStatus !== 'authorized' && (
            <Button
              className='primaryButton'
              style={{ height: '64rpx', fontSize: '24rpx', padding: '0 24rpx', borderRadius: '32rpx' }}
              onClick={handleRequestAuth}
            >
              去授权
            </Button>
          )}
        </View>
        {authStatus === 'denied' && (
          <View style={{ padding: '16rpx 16rpx 8rpx' }}>
            <Text style={{ fontSize: '22rpx', color: '#B0A2A8', lineHeight: 1.5 }}>
              如无法弹出授权窗口，请前往手机「设置 → 应用管理」中找到本应用，手动开启通知权限。
            </Text>
          </View>
        )}
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
        <>
          <View className={styles.previewCard}>
            <Text className={styles.previewLabel}>今日提醒预览</Text>
            <View className={styles.previewContent}>
              <View className={styles.previewIcon}>
                {todayInfo.intensity >= 3 ? '💗' : todayInfo.intensity >= 2 ? '🌱' : todayInfo.intensity >= 1 ? '🍂' : '🌙'}
              </View>
              <View className={styles.previewTextWrap}>
                <Text className={styles.previewTitle}>
                  {todayInfo.intensity >= 3
                    ? todayInfo.isOvulationDay ? '排卵日 · 把握最佳时机' : '重点安排 · 建议今日同房'
                    : todayInfo.intensity >= 2
                      ? '开始关注 · 易孕期已到'
                      : todayInfo.intensity >= 1
                        ? '临近结束 · 最后机会'
                        : '今日无需特别安排'}
                </Text>
                <Text className={styles.previewDesc}>
                  {todayInfo.intensity > 0
                    ? `${todayInfo.phaseText} · 预计排卵日 ${formatDate(ovuDate, 'M月D日')}`
                    : `预计排卵日 ${formatDate(ovuDate, 'M月D日')}，距今天 ${Math.max(0, daysUntil)} 天`}
                </Text>
                <Text className={styles.timeRangeTag}>
                  女方 {reminderConfig.femaleTime} · 男方 {reminderConfig.maleTime}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: '16rpx' }}>
            <Button
              className='ghostButton'
              style={{ width: '100%' }}
              onClick={handleTestReminder}
            >
              测试发送今日提醒
            </Button>
          </View>
        </>
      )}
    </View>
  );
};

export default ReminderPage;
