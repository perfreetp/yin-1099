import React, { useMemo, useState } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import RecordItem from '@/components/RecordItem';
import { formatDate } from '@/utils/cycle';
import type { RecordType } from '@/types';
import styles from './index.module.scss';

const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'intercourse', label: '同房' },
  { key: 'period_abnormal', label: '月经异常' },
  { key: 'medication', label: '用药' },
  { key: 'symptom', label: '症状' }
] as const;

const RECORD_TYPES: Array<{ value: RecordType; label: string; icon: string; desc: string }> = [
  { value: 'intercourse', label: '同房记录', icon: '💕', desc: '记录日期与身体状态' },
  { value: 'period_abnormal', label: '月经异常', icon: '🩸', desc: '量多/量少/痛经等' },
  { value: 'medication', label: '用药情况', icon: '💊', desc: '叶酸/药物/补充剂' },
  { value: 'symptom', label: '身体症状', icon: '📝', desc: '排卵信号/不适记录' }
];

const RecordPage: React.FC = () => {
  const { records, addRecord, deleteRecord } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<RecordType>('intercourse');
  const [formDate, setFormDate] = useState(formatDate(dayjs()));
  const [formResult, setFormResult] = useState('');
  const [formNote, setFormNote] = useState('');

  useDidShow(() => {
    console.log('[RecordPage] didShow');
  });

  const filteredRecords = useMemo(() => {
    const list = filter === 'all'
      ? records
      : records.filter(r => r.type === filter);
    return [...list].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }, [records, filter]);

  const stats = useMemo(() => {
    const intercourseCount = records.filter(r => r.type === 'intercourse').length;
    const abnormalCount = records.filter(r => r.type === 'period_abnormal').length;
    const medicationCount = records.filter(r => r.type === 'medication').length;
    return { intercourseCount, abnormalCount, medicationCount };
  }, [records]);

  const handleOpenModal = () => {
    setFormType('intercourse');
    setFormDate(formatDate(dayjs()));
    setFormResult('');
    setFormNote('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handlePickDate = async () => {
    try {
      const res = await Taro.chooseDate({
        type: 'date',
        begin: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
        value: formDate
      });
      if (res && res.value) {
        setFormDate(res.value);
      }
    } catch (err) {
      console.error('[RecordPage] chooseDate error:', err);
    }
  };

  const handleSubmit = () => {
    const typeInfo = RECORD_TYPES.find(t => t.value === formType);
    addRecord({
      date: formDate,
      type: formType,
      typeText: typeInfo?.label || '',
      note: formNote.trim() || undefined,
      result: formResult.trim() || undefined
    });
    Taro.showToast({ title: '已添加', icon: 'success' });
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
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

  return (
    <View className={styles.container}>
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>备孕记录</Text>
        <Text className={styles.pageDesc}>记录点滴，科学备孕</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.intercourseCount}</Text>
          <Text className={styles.statLabel}>同房次数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.abnormalCount}</Text>
          <Text className={styles.statLabel}>异常标记</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.medicationCount}</Text>
          <Text className={styles.statLabel}>用药记录</Text>
        </View>
      </View>

      <View className={styles.typeTabs}>
        {FILTER_TABS.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.typeTab, filter === tab.key && styles.active)}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      {filteredRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无记录</Text>
          <Text className={styles.emptyDesc}>
            点击右下角的 + 号开始记录吧
            {'\n'}同房日期、身体状况、用药情况都可以记下来
          </Text>
        </View>
      ) : (
        filteredRecords.map(record => (
          <RecordItem
            key={record.id}
            record={record}
            onDelete={handleDelete}
          />
        ))
      )}

      <View className={styles.fabButton} onClick={handleOpenModal}>
        <Text className={styles.fabIcon}>+</Text>
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={handleCloseModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>添加记录</Text>
              <View className={styles.modalClose} onClick={handleCloseModal}>
                ×
              </View>
            </View>

            <View className={styles.typeGrid}>
              {RECORD_TYPES.map(item => (
                <View
                  key={item.value}
                  className={classnames(styles.typeCard, formType === item.value && styles.selected)}
                  onClick={() => setFormType(item.value)}
                >
                  <Text className={styles.typeCardIcon}>{item.icon}</Text>
                  <Text className={styles.typeCardTitle}>{item.label}</Text>
                  <Text className={styles.typeCardDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>日期</Text>
              <View className={styles.datePickerBox} onClick={handlePickDate}>
                <Text className={styles.datePickerValue}>{formDate}</Text>
                <Text className={styles.datePickerHint}>点击选择 ›</Text>
              </View>
            </View>

            {formType === 'intercourse' && (
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>结果（可选）</Text>
                <Input
                  className={styles.formInput}
                  placeholder='如：正常 / 使用排卵试纸阳性'
                  value={formResult}
                  onInput={(e) => setFormResult(e.detail.value)}
                  maxlength={50}
                />
              </View>
            )}

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注（可选）</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder='记录身体感受、特殊情况等...'
                value={formNote}
                onInput={(e) => setFormNote(e.detail.value)}
                maxlength={200}
                autoHeight
              />
            </View>

            <View className={styles.modalActions}>
              <View className={styles.modalCancelBtn} onClick={handleCloseModal}>
                取消
              </View>
              <View className={styles.modalConfirmBtn} onClick={handleSubmit}>
                保存记录
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default RecordPage;
