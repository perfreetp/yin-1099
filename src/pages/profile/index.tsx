import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import { useApp } from '@/store/AppContext';
import TodoItemComponent from '@/components/TodoItem';
import { calculateCycleSummary, getOvulationDate, formatDate, getDaysUntilOvulation } from '@/utils/cycle';
import styles from './index.module.scss';

const GREETINGS = [
  '愿你今天好心情',
  '每一天都充满希望',
  '慢慢来，会好的',
  '和宝宝的约定',
  '温柔以待每一天'
];

const ProfilePage: React.FC = () => {
  const { todos, cycleConfig, records, toggleTodo, resetAllData } = useApp();

  useDidShow(() => {
    console.log('[ProfilePage] didShow');
  });

  const greeting = useMemo(() => {
    const idx = Math.floor(Math.random() * GREETINGS.length);
    return GREETINGS[idx];
  }, []);

  const todoProgress = useMemo(() => {
    const done = todos.filter(t => t.done).length;
    const total = todos.length;
    return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [todos]);

  const summary = useMemo(() => calculateCycleSummary(records, cycleConfig), [records, cycleConfig]);
  const daysUntil = getDaysUntilOvulation(cycleConfig);

  const getCoverageColor = () => {
    if (summary.coveragePercent >= 75) return '#7EC8A3';
    if (summary.coveragePercent >= 50) return '#D99660';
    return '#D9534F';
  };

  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case 'export':
        Taro.showToast({ title: '功能开发中', icon: 'none' });
        break;
      case 'reset':
        Taro.showModal({
          title: '重置所有数据',
          content: '此操作将清除所有周期参数、备孕记录、提醒设置和清单勾选状态，恢复到初始状态。确定吗？',
          confirmText: '重置',
          cancelText: '取消',
          confirmColor: '#D9534F',
          success: (res) => {
            if (res.confirm) {
              resetAllData();
              Taro.showToast({ title: '已重置所有数据', icon: 'success' });
            }
          }
        });
        break;
      case 'about':
        Taro.showModal({
          title: '关于好孕',
          content: '好孕 v1.0.0\n一款专注备孕的极简提醒工具\n所有数据仅保存在本设备',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#D4859C'
        });
        break;
      case 'feedback':
        Taro.showToast({ title: '感谢您的反馈', icon: 'none' });
        break;
      default:
        break;
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.profileHeader}>
        <View className={styles.profileGreeting}>
          <Text className={styles.greetingText}>{greeting}</Text>
          <Text className={styles.greetingName}>
            {dayjs().hour() < 12 ? '早上好' : dayjs().hour() < 18 ? '下午好' : '晚上好'}
          </Text>
        </View>

        <View className={styles.progressCard}>
          <View className={styles.progressTop}>
            <Text className={styles.progressLabel}>备孕清单进度</Text>
            <Text className={styles.progressValue}>
              {todoProgress.done} / {todoProgress.total}
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${todoProgress.percent}%` }}
            />
          </View>
        </View>
      </View>

      <View className={styles.summaryCards}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryIcon}>📅</Text>
          <Text className={styles.summaryValue}>{summary.avgCycleLength}</Text>
          <Text className={styles.summaryLabel}>平均周期 (天)</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryIcon}>💕</Text>
          <Text className={styles.summaryValue}>{summary.totalIntercourse}</Text>
          <Text className={styles.summaryLabel}>本周期同房</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryIcon}>🔥</Text>
          <Text className={styles.summaryValue}>{summary.currentStreak}</Text>
          <Text className={styles.summaryLabel}>连续天数</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryIcon}>⏳</Text>
          <Text className={styles.summaryValue}>{Math.max(0, daysUntil)}</Text>
          <Text className={styles.summaryLabel}>距排卵 (天)</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>基础备孕清单</Text>
          <Text className={styles.sectionCount}>{todoProgress.percent}%</Text>
        </View>

        {todos.map(todo => (
          <TodoItemComponent
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
          />
        ))}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>周期回顾</Text>
          <Text className={styles.sectionCount}>
            {summary.isSkipped ? '已跳过' : `第 ${summary.cycleCount} 周期`}
          </Text>
        </View>

        <View className={styles.menuItem}>
          <View className={styles.menuIconBox}>
            <Text className={styles.menuIcon}>🗓️</Text>
          </View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle}>末次月经</Text>
            <Text className={styles.menuDesc}>{cycleConfig.lastPeriodDate}</Text>
          </View>
        </View>

        <View className={styles.menuItem}>
          <View className={styles.menuIconBox}>
            <Text className={styles.menuIcon}>🥚</Text>
          </View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle}>预计排卵日</Text>
            <Text className={styles.menuDesc}>
              {formatDate(getOvulationDate(cycleConfig))}
              {cycleConfig.manualOvulationDate ? ' (已手动修正)' : ''}
            </Text>
          </View>
        </View>

        <View className={styles.menuItem}>
          <View className={styles.menuIconBox}>
            <Text className={styles.menuIcon}>🎯</Text>
          </View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle}>重点时段覆盖</Text>
            <Text className={styles.menuDesc}>
              {summary.coveredPeakDays} / {summary.peakDaysTotal} 天同房
              <Text style={{ color: getCoverageColor(), marginLeft: '8rpx' }}>
                {summary.coveragePercent}%
              </Text>
            </Text>
          </View>
          <View className={styles.miniBar}>
            <View
              className={styles.miniBarFill}
              style={{ width: `${summary.coveragePercent}%`, background: getCoverageColor() }}
            />
          </View>
        </View>

        {summary.hasAbnormalPeriod && (
          <View className={styles.menuItem}>
            <View className={styles.menuIconBox} style={{ background: '#FFF1E5' }}>
              <Text className={styles.menuIcon}>🩸</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle} style={{ color: '#D99660' }}>月经异常记录</Text>
              <Text className={styles.menuDesc}>本周期有异常记录，建议关注规律性</Text>
            </View>
          </View>
        )}

        {summary.hasMedication && (
          <View className={styles.menuItem}>
            <View className={styles.menuIconBox} style={{ background: '#E8F5E9' }}>
              <Text className={styles.menuIcon}>💊</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle} style={{ color: '#4FA67A' }}>用药记录</Text>
              <Text className={styles.menuDesc}>部分药物可能影响受孕，请咨询医生</Text>
            </View>
          </View>
        )}

        {summary.isSkipped && (
          <View className={styles.menuItem}>
            <View className={styles.menuIconBox} style={{ background: '#F5F0F2' }}>
              <Text className={styles.menuIcon}>⏭️</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle} style={{ color: '#7A6A70' }}>周期已跳过</Text>
              <Text className={styles.menuDesc}>回顾数据仅供参考</Text>
            </View>
          </View>
        )}

        <View className={styles.reviewNote}>
          <Text className={styles.reviewNoteText}>{summary.reviewNote}</Text>
        </View>
      </View>

      <View className={styles.privacyCard}>
        <Text className={styles.privacyTitle}>🔒 隐私保护</Text>
        <Text className={styles.privacyDesc}>
          所有数据仅保存在您的设备本地，不会上传到任何服务器。
          我们深知备孕是一件私密的事情，请安心使用。
        </Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>更多</Text>
        </View>

        <View className={styles.menuItem} onClick={() => handleMenuItemClick('export')}>
          <View className={styles.menuIconBox}>
            <Text className={styles.menuIcon}>📤</Text>
          </View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle}>导出数据</Text>
            <Text className={styles.menuDesc}>备份您的备孕记录</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>

        <View className={styles.menuItem} onClick={() => handleMenuItemClick('feedback')}>
          <View className={styles.menuIconBox}>
            <Text className={styles.menuIcon}>💬</Text>
          </View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle}>意见反馈</Text>
            <Text className={styles.menuDesc}>帮助我们做得更好</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>

        <View className={styles.menuItem} onClick={() => handleMenuItemClick('about')}>
          <View className={styles.menuIconBox}>
            <Text className={styles.menuIcon}>ℹ️</Text>
          </View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle}>关于好孕</Text>
            <Text className={styles.menuDesc}>版本与声明</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>

        <View className={styles.menuItem} onClick={() => handleMenuItemClick('reset')}>
          <View className={styles.menuIconBox}>
            <Text className={styles.menuIcon}>♻️</Text>
          </View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle} style={{ color: '#D9534F' }}>重置数据</Text>
            <Text className={styles.menuDesc}>清除所有记录重新开始</Text>
          </View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>

      <Text className={styles.footerText}>
        好孕 · 让科学备孕更简单{'\n'}
        Made with 💕 for every expecting family
      </Text>
    </View>
  );
};

export default ProfilePage;
