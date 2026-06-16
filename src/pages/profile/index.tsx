import React, { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import TodoItemComponent from '@/components/TodoItem';
import { getOvulationDate, formatDate, getDaysUntilOvulation } from '@/utils/cycle';
import type { CycleArchive } from '@/types';
import styles from './index.module.scss';

const GREETINGS = [
  '愿你今天好心情',
  '每一天都充满希望',
  '慢慢来，会好的',
  '和宝宝的约定',
  '温柔以待每一天'
];

const ProfilePage: React.FC = () => {
  const {
    todos, cycleConfig, records, currentCycleIndex, cycles,
    toggleTodo, resetAllData, getAllCycleSummaries, getCycleSummary, moveToNextCycle
  } = useApp();

  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(null);

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

  const allCycles = useMemo(() => getAllCycleSummaries(), [getAllCycleSummaries]);
  const currentSummary = useMemo(() => getCycleSummary(), [getCycleSummary]);
  const daysUntil = getDaysUntilOvulation(cycleConfig);

  const displaySummary = useMemo(() => {
    if (viewMode === 'current') return currentSummary;
    if (selectedHistoryIdx !== null) {
      const found = allCycles.find(c => c.index === selectedHistoryIdx);
      if (found) return found.summary;
    }
    return allCycles[0]?.summary || currentSummary;
  }, [viewMode, selectedHistoryIdx, currentSummary, allCycles]);

  const getCoverageColor = (percent: number) => {
    if (percent >= 75) return '#7EC8A3';
    if (percent >= 50) return '#D99660';
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

  const handleNextCycle = () => {
    Taro.showModal({
      title: '进入下一周期',
      content: '当前周期将被归档到历史记录，下一周期从预计下次月经开始。确定吗？',
      confirmText: '确认',
      cancelText: '取消',
      confirmColor: '#D4859C',
      success: (res) => {
        if (res.confirm) {
          moveToNextCycle();
          setViewMode('current');
          setSelectedHistoryIdx(null);
          Taro.showToast({ title: '已进入下一周期', icon: 'success' });
        }
      }
    });
  };

  const handleSelectHistory = (cycle: CycleArchive) => {
    setSelectedHistoryIdx(cycle.index);
  };

  const historyCycles = useMemo(() => {
    return allCycles.filter(c => c.index !== currentCycleIndex);
  }, [allCycles, currentCycleIndex]);

  const trendData = useMemo(() => {
    const sorted = [...allCycles].sort((a, b) => a.index - b.index);
    const recent = sorted.slice(-5);
    const active = recent.filter(c => !c.summary.isSkipped);
    const avgCoverage = active.length > 0
      ? Math.round(active.reduce((s, c) => s + c.summary.coveragePercent, 0) / active.length)
      : 0;
    const avgAbnormal = active.length > 0
      ? +(active.reduce((s, c) => s + c.summary.abnormalCount, 0) / active.length).toFixed(1)
      : 0;
    const avgMedication = active.length > 0
      ? +(active.reduce((s, c) => s + c.summary.medicationCount, 0) / active.length).toFixed(1)
      : 0;
    return { recent, avgCoverage, avgAbnormal, avgMedication, activeCount: active.length };
  }, [allCycles]);

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
          <Text className={styles.summaryValue}>{displaySummary.avgCycleLength}</Text>
          <Text className={styles.summaryLabel}>平均周期 (天)</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryIcon}>💕</Text>
          <Text className={styles.summaryValue}>{displaySummary.totalIntercourse}</Text>
          <Text className={styles.summaryLabel}>同房次数</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryIcon}>🔥</Text>
          <Text className={styles.summaryValue}>{displaySummary.currentStreak}</Text>
          <Text className={styles.summaryLabel}>连续天数</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryIcon}>⏳</Text>
          <Text className={styles.summaryValue}>
            {viewMode === 'current' ? Math.max(0, daysUntil) : '-'}
          </Text>
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
          <View className={styles.cycleTabs}>
            <View
              className={classnames(styles.cycleTab, viewMode === 'current' && styles.cycleTabActive)}
              onClick={() => { setViewMode('current'); setSelectedHistoryIdx(null); }}
            >
              当前周期
            </View>
            <View
              className={classnames(styles.cycleTab, viewMode === 'history' && styles.cycleTabActive)}
              onClick={() => setViewMode('history')}
            >
              历史
            </View>
          </View>
        </View>

        {viewMode === 'current' ? (
          <View>
            <View className={styles.cycleHeaderRow}>
              <Text className={styles.cycleTitle}>第 {currentCycleIndex} 周期</Text>
              {displaySummary.isSkipped && (
                <Text className={styles.skippedBadge}>已跳过</Text>
              )}
            </View>
            <Text className={styles.cycleDateRange}>
              {displaySummary.cycleStartDate} ~ {displaySummary.cycleEndDate}
            </Text>

            <View className={styles.cycleStatGrid}>
              <View className={styles.cycleStatItem}>
                <Text className={styles.cycleStatValue} style={{ color: '#D4859C' }}>
                  {displaySummary.totalIntercourse}
                </Text>
                <Text className={styles.cycleStatLabel}>同房次数</Text>
              </View>
              <View className={styles.cycleStatItem}>
                <Text className={styles.cycleStatValue} style={{ color: '#D9534F' }}>
                  {displaySummary.abnormalCount}
                </Text>
                <Text className={styles.cycleStatLabel}>月经异常</Text>
              </View>
              <View className={styles.cycleStatItem}>
                <Text className={styles.cycleStatValue} style={{ color: '#7EC8A3' }}>
                  {displaySummary.medicationCount}
                </Text>
                <Text className={styles.cycleStatLabel}>用药记录</Text>
              </View>
              <View className={styles.cycleStatItem}>
                <Text className={styles.cycleStatValue} style={{ color: '#A78BFA' }}>
                  {displaySummary.symptomCount}
                </Text>
                <Text className={styles.cycleStatLabel}>身体症状</Text>
              </View>
            </View>

            <View className={styles.coverageSection}>
              <View className={styles.coverageHeader}>
                <Text className={styles.coverageLabel}>重点时段覆盖</Text>
                <Text
                  className={styles.coveragePercent}
                  style={{ color: getCoverageColor(displaySummary.coveragePercent) }}
                >
                  {displaySummary.coveredPeakDays} / {displaySummary.peakDaysTotal} 天 · {displaySummary.coveragePercent}%
                </Text>
              </View>
              <View className={styles.coverageBar}>
                <View
                  className={styles.coverageFill}
                  style={{
                    width: `${displaySummary.coveragePercent}%`,
                    background: getCoverageColor(displaySummary.coveragePercent)
                  }}
                />
              </View>
            </View>

            {displaySummary.isSkipped && displaySummary.skipReason && (
              <View className={styles.skipReasonCard}>
                <Text className={styles.skipReasonLabel}>⏭️ 跳过原因</Text>
                <Text className={styles.skipReasonText}>{displaySummary.skipReason}</Text>
              </View>
            )}

            <View className={styles.reviewNote}>
              <Text className={styles.reviewNoteText}>{displaySummary.reviewNote}</Text>
            </View>

            <View style={{ marginTop: '20rpx' }}>
              <View
                className={classnames('primaryButton', styles.nextCycleBtn)}
                onClick={handleNextCycle}
              >
                进入下一周期
              </View>
            </View>
          </View>
        ) : (
          <View>
            {historyCycles.length === 0 ? (
              <View className={styles.emptyHistory}>
                <Text className={styles.emptyHistoryText}>暂无历史周期</Text>
                <Text className={styles.emptyHistoryDesc}>
                  进入下一周期后，当前周期会自动归档到这里
                </Text>
              </View>
            ) : (
              <View>
                <View className={styles.historyList}>
                  {historyCycles.map(cycle => (
                    <View
                      key={cycle.index}
                      className={classnames(
                        styles.historyItem,
                        selectedHistoryIdx === cycle.index && styles.historyItemSelected
                      )}
                      onClick={() => handleSelectHistory(cycle)}
                    >
                      <View className={styles.historyItemHeader}>
                        <Text className={styles.historyCycleName}>
                          第 {cycle.index} 周期
                          {cycle.summary.isSkipped && ' · 已跳过'}
                        </Text>
                        <Text className={styles.historyArrow}>›</Text>
                      </View>
                      <Text className={styles.historyItemDate}>
                        {cycle.summary.cycleStartDate} ~ {cycle.summary.cycleEndDate}
                      </Text>
                      <View className={styles.historyItemStats}>
                        <Text className={styles.historyItemStat}>
                          同房 {cycle.summary.totalIntercourse} 次
                        </Text>
                        <Text className={styles.historyItemStat}>
                          覆盖 {cycle.summary.coveragePercent}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {selectedHistoryIdx !== null && (
                  <View className={styles.historyDetailCard}>
                    <View className={styles.cycleHeaderRow}>
                      <Text className={styles.cycleTitle}>
                        第 {selectedHistoryIdx} 周期详情
                      </Text>
                      {displaySummary.isSkipped && (
                        <Text className={styles.skippedBadge}>已跳过</Text>
                      )}
                    </View>

                    <View className={styles.cycleStatGrid}>
                      <View className={styles.cycleStatItem}>
                        <Text className={styles.cycleStatValue} style={{ color: '#D4859C' }}>
                          {displaySummary.totalIntercourse}
                        </Text>
                        <Text className={styles.cycleStatLabel}>同房次数</Text>
                      </View>
                      <View className={styles.cycleStatItem}>
                        <Text className={styles.cycleStatValue} style={{ color: '#D9534F' }}>
                          {displaySummary.abnormalCount}
                        </Text>
                        <Text className={styles.cycleStatLabel}>月经异常</Text>
                      </View>
                      <View className={styles.cycleStatItem}>
                        <Text className={styles.cycleStatValue} style={{ color: '#7EC8A3' }}>
                          {displaySummary.medicationCount}
                        </Text>
                        <Text className={styles.cycleStatLabel}>用药记录</Text>
                      </View>
                      <View className={styles.cycleStatItem}>
                        <Text className={styles.cycleStatValue} style={{ color: '#A78BFA' }}>
                          {displaySummary.symptomCount}
                        </Text>
                        <Text className={styles.cycleStatLabel}>身体症状</Text>
                      </View>
                    </View>

                    <View className={styles.coverageSection}>
                      <View className={styles.coverageHeader}>
                        <Text className={styles.coverageLabel}>重点时段覆盖</Text>
                        <Text
                          className={styles.coveragePercent}
                          style={{ color: getCoverageColor(displaySummary.coveragePercent) }}
                        >
                          {displaySummary.coveredPeakDays} / {displaySummary.peakDaysTotal} 天 · {displaySummary.coveragePercent}%
                        </Text>
                      </View>
                      <View className={styles.coverageBar}>
                        <View
                          className={styles.coverageFill}
                          style={{
                            width: `${displaySummary.coveragePercent}%`,
                            background: getCoverageColor(displaySummary.coveragePercent)
                          }}
                        />
                      </View>
                    </View>

                    {displaySummary.isSkipped && displaySummary.skipReason && (
                      <View className={styles.skipReasonCard}>
                        <Text className={styles.skipReasonLabel}>⏭️ 跳过原因</Text>
                        <Text className={styles.skipReasonText}>{displaySummary.skipReason}</Text>
                      </View>
                    )}

                    <View className={styles.reviewNote}>
                      <Text className={styles.reviewNoteText}>{displaySummary.reviewNote}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {trendData.recent.length >= 2 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>周期趋势</Text>
            <Text className={styles.sectionCount}>
              近{trendData.recent.length}周期 · 均值不含跳过
            </Text>
          </View>

          <View className={styles.trendCard}>
            <View className={styles.trendHeader}>
              <Text className={styles.trendHeaderLabel}>重点覆盖</Text>
              <Text className={styles.trendAvg}>均值 {trendData.avgCoverage}%</Text>
            </View>
            <View className={styles.trendBars}>
              {trendData.recent.map(cycle => {
                const pct = cycle.summary.coveragePercent;
                return (
                  <View key={cycle.index} className={styles.trendBarWrap}>
                    <Text className={styles.trendBarLabel}>
                      {cycle.index}
                      {cycle.summary.isSkipped && '⏭'}
                    </Text>
                    <View className={styles.trendBarTrack}>
                      <View
                        className={classnames(
                          styles.trendBarFill,
                          cycle.summary.isSkipped && styles.trendBarFillSkipped
                        )}
                        style={{ width: `${pct}%`, background: getCoverageColor(pct) }}
                      />
                    </View>
                    <Text className={styles.trendBarValue}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View className={styles.trendCard}>
            <View className={styles.trendHeader}>
              <Text className={styles.trendHeaderLabel}>异常次数</Text>
              <Text className={styles.trendAvg}>均值 {trendData.avgAbnormal}</Text>
            </View>
            <View className={styles.trendBars}>
              {trendData.recent.map(cycle => {
                const count = cycle.summary.abnormalCount;
                const maxCount = Math.max(5, ...trendData.recent.map(c => c.summary.abnormalCount));
                const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                return (
                  <View key={cycle.index} className={styles.trendBarWrap}>
                    <Text className={styles.trendBarLabel}>
                      {cycle.index}
                      {cycle.summary.isSkipped && '⏭'}
                    </Text>
                    <View className={styles.trendBarTrack}>
                      <View
                        className={classnames(
                          styles.trendBarFill,
                          cycle.summary.isSkipped && styles.trendBarFillSkipped
                        )}
                        style={{ width: `${pct}%`, background: '#D9534F' }}
                      />
                    </View>
                    <Text className={styles.trendBarValue}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View className={styles.trendCard}>
            <View className={styles.trendHeader}>
              <Text className={styles.trendHeaderLabel}>用药次数</Text>
              <Text className={styles.trendAvg}>均值 {trendData.avgMedication}</Text>
            </View>
            <View className={styles.trendBars}>
              {trendData.recent.map(cycle => {
                const count = cycle.summary.medicationCount;
                const maxCount = Math.max(5, ...trendData.recent.map(c => c.summary.medicationCount));
                const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                return (
                  <View key={cycle.index} className={styles.trendBarWrap}>
                    <Text className={styles.trendBarLabel}>
                      {cycle.index}
                      {cycle.summary.isSkipped && '⏭'}
                    </Text>
                    <View className={styles.trendBarTrack}>
                      <View
                        className={classnames(
                          styles.trendBarFill,
                          cycle.summary.isSkipped && styles.trendBarFillSkipped
                        )}
                        style={{ width: `${pct}%`, background: '#7EC8A3' }}
                      />
                    </View>
                    <Text className={styles.trendBarValue}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

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
