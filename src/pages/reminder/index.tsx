import React, { useState } from 'react';
import { View, Text, Switch, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp, ReminderResult } from '@/store/AppContext';
import { getDaysUntilOvulation, getOvulationDate, getTodayInfo, formatDate } from '@/utils/cycle';
import styles from './index.module.scss';

const ReminderPage: React.FC = () => {
  const {
    reminderConfig, updateReminderConfig, cycleConfig, records,
    requestNotificationAuth, evalReminder, getNotificationEnvStatus
  } = useApp();

  const [authResult, setAuthResult] = useState<{ success: boolean; isEnvironmentSupported: boolean; message: string } | null>(null);
  const [lastTestResult, setLastTestResult] = useState<ReminderResult | null>(null);

  useDidShow(() => {
    checkEnv();
  });

  const checkEnv = () => {
    const env = getNotificationEnvStatus();
    if (env === 'h5') {
      setAuthResult({ success: false, isEnvironmentSupported: false, message: '当前为网页预览环境，不支持微信订阅消息推送。' });
    } else if (env === 'unknown') {
      setAuthResult({ success: false, isEnvironmentSupported: false, message: '当前环境无法识别，可能不支持订阅消息。' });
    }
  };

  const handleRequestAuth = async () => {
    const result = await requestNotificationAuth();
    setAuthResult(result);
    Taro.showModal({
      title: result.success ? '授权成功' : result.isEnvironmentSupported ? '授权未完成' : '环境不支持',
      content: result.message,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#D4859C'
    });
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
    const result = evalReminder();
    setLastTestResult(result);

    if (result.shouldRemind) {
      let msg = `【本地预览】提醒内容：${result.reason}`;
      msg += `\n\n女方 ${result.femaleNotified ? '✓ 会收到' : '✗ 不会收到'}（${result.femaleTime}）`;
      msg += `\n男方 ${result.maleNotified ? '✓ 会收到' : '✗ 不会收到'}（${result.maleTime}）`;

      if (reminderConfig.vibrate) {
        Taro.vibrateShort();
      }

      Taro.showModal({
        title: '🔔 提醒预览结果',
        content: msg,
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#D4859C'
      });
    } else {
      Taro.showModal({
        title: '🔕 今日不会触发提醒',
        content: `原因：${result.reason}`,
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#D4859C'
      });
    }
  };

  const daysUntil = getDaysUntilOvulation(cycleConfig);
  const ovuDate = getOvulationDate(cycleConfig);
  const todayInfo = getTodayInfo(cycleConfig, records);
  const reminderEval = evalReminder();
  const envStatus = getNotificationEnvStatus();

  const getEnvText = () => {
    if (authResult && !authResult.isEnvironmentSupported) return '当前环境不支持订阅通知';
    if (authResult && authResult.success) return '✓ 已授权，可正常推送';
    if (envStatus === 'h5') return '网页预览环境，无法订阅';
    if (envStatus === 'unknown') return '环境未识别，无法订阅';
    return '尚未授权';
  };

  const getEnvColor = () => {
    if (authResult && authResult.success) return '#7EC8A3';
    if (authResult && !authResult.isEnvironmentSupported) return '#D99660';
    return '#D9534F';
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
        <Text className={styles.sectionLabel}>通知环境</Text>
        <View className={styles.switchRow}>
          <View className={styles.switchContent}>
            <Text className={styles.switchTitle}>订阅消息状态</Text>
            <Text className={styles.switchDesc} style={{ color: getEnvColor() }}>
              {getEnvText()}
            </Text>
          </View>
          {!authResult?.success && (
            <Button
              className='primaryButton'
              style={{ height: '64rpx', fontSize: '24rpx', padding: '0 24rpx', borderRadius: '32rpx' }}
              onClick={handleRequestAuth}
            >
              {envStatus === 'miniapp' ? '去授权' : '查看详情'}
            </Button>
          )}
        </View>
        {authResult && !authResult.isEnvironmentSupported && (
          <View style={{ padding: '16rpx 16rpx 8rpx' }}>
            <Text style={{ fontSize: '22rpx', color: '#B0A2A8', lineHeight: 1.5 }}>
              当前运行在网页/开发环境，微信订阅消息仅在真实小程序中可用。发布到微信小程序后即可正常订阅。
            </Text>
          </View>
        )}
        {authResult && authResult.isEnvironmentSupported && !authResult.success && (
          <View style={{ padding: '16rpx 16rpx 8rpx' }}>
            <Text style={{ fontSize: '22rpx', color: '#B0A2A8', lineHeight: 1.5 }}>
              如需接收推送，请在微信中长按小程序 → 设置 → 订阅消息中手动开启。
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
            <Text className={styles.switchDesc}>
              {reminderConfig.notifyFemale ? `每天 ${reminderConfig.femaleTime} 推送` : '已关闭'}
            </Text>
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
            <Text className={styles.switchDesc}>
              {reminderConfig.notifyMale ? `每天 ${reminderConfig.maleTime} 推送` : '已关闭'}
            </Text>
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
              <Text className={styles.optionDesc}>易孕期9天内每天提醒，不遗漏机会</Text>
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
            <Text className={styles.previewLabel}>
              今日提醒判定
              {reminderEval.shouldRemind ? ' · 会提醒' : ' · 不会提醒'}
            </Text>
            <View className={styles.previewContent}>
              <View className={styles.previewIcon}>
                {reminderEval.shouldRemind
                  ? (reminderEval.intensity >= 3 ? '💗' : reminderEval.intensity >= 2 ? '🌱' : '🍂')
                  : '🔕'}
              </View>
              <View className={styles.previewTextWrap}>
                <Text className={styles.previewTitle}>
                  {reminderEval.shouldRemind ? reminderEval.reason : reminderEval.reason}
                </Text>
                {reminderEval.shouldRemind && (
                  <>
                    <Text className={styles.previewDesc}>
                      {reminderEval.femaleNotified && `女方 ${reminderEval.femaleTime} 推送`}
                      {reminderEval.femaleNotified && reminderEval.maleNotified && ' · '}
                      {reminderEval.maleNotified && `男方 ${reminderEval.maleTime} 推送`}
                      {!reminderEval.femaleNotified && !reminderEval.maleNotified && '未选择接收人'}
                    </Text>
                    <Text className={styles.timeRangeTag}>
                      阶段: {reminderEval.phaseText || '日常'} · 强度: {reminderEval.intensity}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={{ marginTop: '16rpx' }}>
            <Button
              className='ghostButton'
              style={{ width: '100%' }}
              onClick={handleTestReminder}
            >
              测试今日提醒（本地预览）
            </Button>
            <Text style={{ display: 'block', textAlign: 'center', fontSize: '20rpx', color: '#B0A2A8', marginTop: '8rpx' }}>
              测试仅在本机预览提醒效果，不会发送真实订阅消息
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export default ReminderPage;
