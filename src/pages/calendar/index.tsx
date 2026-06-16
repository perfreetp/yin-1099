import React, { useMemo, useState } from 'react';
import { View, Text, Button, Textarea, Input } from '@tarojs/components';
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
import type { DayInfo, RecordType, BbtRecord } from '@/types';
import styles from './index.module.scss';

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const QUICK_TYPES: Array<{ value: RecordType; label: string; icon: string }> = [
  { value: 'intercourse', label: '同房', icon: '💕' },
  { value: 'medication', label: '用药', icon: '💊' },
  { value: 'symptom', label: '症状', icon: '📝' },
  { value: 'period_abnormal', label: '月经异常', icon: '🩸' }
];

const EDIT_TYPES: Array<{ value: RecordType; label: string; icon: string }> = [
  { value: 'intercourse', label: '同房记录', icon: '💕' },
  { value: 'period_abnormal', label: '月经异常', icon: '🩸' },
  { value: 'medication', label: '用药情况', icon: '💊' },
  { value: 'symptom', label: '身体症状', icon: '📝' }
];

const CalendarPage: React.FC = () => {
  const { cycleConfig, records, updateCycleConfig, addRecord, updateRecord, deleteRecord } = useApp();
  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month());
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickType, setQuickType] = useState<RecordType>('intercourse');
  const [quickNote, setQuickNote] = useState('');

  const [editingRecord, setEditingRecord] = useState<BbtRecord | null>(null);
  const [editType, setEditType] = useState<RecordType>('intercourse');
  const [editDate, setEditDate] = useState('');
  const [editResult, setEditResult] = useState('');
  const [editNote, setEditNote] = useState('');

  useDidShow(() => {
    console.log('[CalendarPage] didShow');
  });

  const calendarDays = useMemo(
    () => generateCalendarDays(year, month, cycleConfig, records),
    [year, month, cycleConfig, records]
  );

  const fertileWindow = useMemo(() => getFertileWindow(cycleConfig), [cycleConfig]);
  const periodRange = useMemo(() => getPeriodRange(cycleConfig), [cycleConfig]);

  const selectedDayRecords = useMemo(() => {
    if (!selectedDay) return [];
    return records.filter(r => r.date === selectedDay.date);
  }, [selectedDay, records]);

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
    setShowQuickAdd(false);
    setQuickNote('');
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

  const handleOpenQuickAdd = () => {
    setQuickType('intercourse');
    setQuickNote('');
    setShowQuickAdd(true);
  };

  const handleQuickSubmit = () => {
    if (!selectedDay) return;
    const typeInfo = QUICK_TYPES.find(t => t.value === quickType);
    addRecord({
      date: selectedDay.date,
      type: quickType,
      typeText: typeInfo?.label || '',
      note: quickNote.trim() || undefined
    });
    Taro.showToast({ title: '已记录', icon: 'success' });
    setShowQuickAdd(false);
    setQuickNote('');
  };

  const handleDeleteRecord = (id: string) => {
    Taro.showModal({
      title: '删除记录',
      content: '确定要删除这条记录吗？',
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#D9534F',
      success: (res) => {
        if (res.confirm) {
          deleteRecord(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const handleEditRecord = (rec: BbtRecord) => {
    setEditingRecord(rec);
    setEditType(rec.type);
    setEditDate(rec.date);
    setEditResult(rec.result || '');
    setEditNote(rec.note || '');
  };

  const handleEditPickDate = async () => {
    try {
      const res = await Taro.chooseDate({
        type: 'date',
        begin: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
        end: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        value: editDate
      });
      if (res && res.value) {
        setEditDate(res.value);
      }
    } catch (err) {
      console.error('[CalendarPage] edit chooseDate error:', err);
    }
  };

  const handleEditSave = () => {
    if (!editingRecord) return;
    const typeInfo = EDIT_TYPES.find(t => t.value === editType);
    updateRecord(editingRecord.id, {
      type: editType,
      typeText: typeInfo?.label || '',
      date: editDate,
      result: editResult.trim() || undefined,
      note: editNote.trim() || undefined
    });
    Taro.showToast({ title: '已更新', icon: 'success' });
    setEditingRecord(null);
  };

  const handleEditCancel = () => {
    setEditingRecord(null);
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

  const getRecordTypeIcon = (type: RecordType) => {
    switch (type) {
      case 'intercourse': return '💕';
      case 'period_abnormal': return '🩸';
      case 'medication': return '💊';
      case 'symptom': return '📝';
      default: return '📋';
    }
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

          {selectedDayRecords.length > 0 && (
            <View className={styles.dayRecordsSection}>
              <Text className={styles.dayRecordsTitle}>
                当日记录 · {selectedDayRecords.length} 条
              </Text>
              {selectedDayRecords.map(rec => (
                <View key={rec.id} className={styles.dayRecordItem}>
                  <Text className={styles.dayRecordIcon}>{getRecordTypeIcon(rec.type)}</Text>
                  <View className={styles.dayRecordContent}>
                    <Text className={styles.dayRecordType}>{rec.typeText}</Text>
                    {rec.result && <Text className={styles.dayRecordResult}>{rec.result}</Text>}
                    {rec.note && <Text className={styles.dayRecordNote}>{rec.note}</Text>}
                  </View>
                  <View className={styles.dayRecordActions}>
                    <View
                      className={styles.editRecordBtn}
                      onClick={() => handleEditRecord(rec)}
                    >
                      <Text className={styles.editRecordText}>编辑</Text>
                    </View>
                    <View
                      className={styles.deleteRecordBtn}
                      onClick={() => handleDeleteRecord(rec.id)}
                    >
                      <Text className={styles.deleteRecordText}>删除</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {selectedDayRecords.length === 0 && (
            <View className={styles.noRecordHint}>
              <Text className={styles.noRecordText}>当日暂无记录，点击下方按钮快速补记</Text>
            </View>
          )}

          {!showQuickAdd && (
            <View className={styles.dayActions}>
              <Button
                className='primaryButton'
                onClick={handleOpenQuickAdd}
                style={{ flex: 1, marginRight: '12rpx' }}
              >
                快速补记
              </Button>
              {!selectedDay.isPeriod && (
                <Button
                  className='ghostButton'
                  onClick={handleSetOvulation}
                  style={{ flex: 1 }}
                >
                  设为排卵日
                </Button>
              )}
            </View>
          )}

          {showQuickAdd && (
            <View className={styles.quickAddForm}>
              <Text className={styles.quickAddTitle}>快速补记</Text>
              <View className={styles.quickTypeRow}>
                {QUICK_TYPES.map(t => (
                  <View
                    key={t.value}
                    className={classnames(styles.quickTypeBtn, quickType === t.value && styles.quickTypeActive)}
                    onClick={() => setQuickType(t.value)}
                  >
                    <Text>{t.icon} {t.label}</Text>
                  </View>
                ))}
              </View>
              <View className={styles.quickNoteBox}>
                <Textarea
                  className={styles.quickNoteInput}
                  placeholder='备注（可选）'
                  value={quickNote}
                  onInput={(e) => setQuickNote(e.detail.value)}
                  maxlength={100}
                  autoHeight
                  style={{ maxHeight: '120rpx' }}
                />
              </View>
              <View className={styles.quickActions}>
                <View className={styles.quickCancelBtn} onClick={() => setShowQuickAdd(false)}>
                  取消
                </View>
                <View className={styles.quickConfirmBtn} onClick={handleQuickSubmit}>
                  保存
                </View>
              </View>
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
            {formatDate(fertileWindow.start, 'M月D日')} - {formatDate(fertileWindow.startEnd, 'M月D日')}
          </Text>
        </View>

        <View className={styles.windowPhaseRow}>
          <View className={classnames(styles.windowPhaseDot, styles.dotPeak)} />
          <Text className={styles.windowPhaseName}>重点安排</Text>
          <Text className={styles.windowPhaseRange}>
            {formatDate(fertileWindow.peakStart, 'M月D日')} - {formatDate(fertileWindow.peakStartEnd, 'M月D日')}
          </Text>
        </View>

        <View className={styles.windowPhaseRow}>
          <View className={classnames(styles.windowPhaseDot, styles.dotEnd)} />
          <Text className={styles.windowPhaseName}>临近结束</Text>
          <Text className={styles.windowPhaseRange}>
            {formatDate(fertileWindow.endStart, 'M月D日')} - {formatDate(fertileWindow.endEnd, 'M月D日')}
          </Text>
        </View>
      </View>

      {editingRecord && (
        <View className={styles.editModalMask} onClick={handleEditCancel}>
          <View className={styles.editModalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.editModalHeader}>
              <Text className={styles.editModalTitle}>编辑记录</Text>
              <View className={styles.editModalClose} onClick={handleEditCancel}>×</View>
            </View>

            <View className={styles.editTypeGrid}>
              {EDIT_TYPES.map(item => (
                <View
                  key={item.value}
                  className={classnames(styles.editTypeCard, editType === item.value && styles.editTypeActive)}
                  onClick={() => setEditType(item.value)}
                >
                  <Text>{item.icon} {item.label}</Text>
                </View>
              ))}
            </View>

            <View className={styles.editFormGroup}>
              <Text className={styles.editFormLabel}>日期</Text>
              <View className={styles.editDatePickerBox} onClick={handleEditPickDate}>
                <Text className={styles.editDateValue}>{editDate}</Text>
                <Text className={styles.editDateHint}>点击选择 ›</Text>
              </View>
            </View>

            <View className={styles.editFormGroup}>
              <Text className={styles.editFormLabel}>结果（可选）</Text>
              <Input
                className={styles.editFormInput}
                placeholder='如：正常 / 排卵试纸阳性'
                value={editResult}
                onInput={(e) => setEditResult(e.detail.value)}
                maxlength={50}
              />
            </View>

            <View className={styles.editFormGroup}>
              <Text className={styles.editFormLabel}>备注（可选）</Text>
              <Textarea
                className={styles.editFormTextarea}
                placeholder='身体感受、特殊情况...'
                value={editNote}
                onInput={(e) => setEditNote(e.detail.value)}
                maxlength={200}
                autoHeight
              />
            </View>

            <View className={styles.editModalActions}>
              <View className={styles.editCancelBtn} onClick={handleEditCancel}>
                取消
              </View>
              <View className={styles.editConfirmBtn} onClick={handleEditSave}>
                保存修改
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default CalendarPage;
