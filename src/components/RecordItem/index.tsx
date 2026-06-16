import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { BbtRecord } from '@/types';
import styles from './index.module.scss';

interface RecordItemProps {
  record: BbtRecord;
  onDelete?: (id: string) => void;
}

const TYPE_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  intercourse: { icon: '💕', color: '#D4859C', bg: '#FFF0F3' },
  period_abnormal: { icon: '🩸', color: '#D9534F', bg: '#FFF0F1' },
  medication: { icon: '💊', color: '#A8B8E0', bg: '#F0F4FF' },
  symptom: { icon: '📝', color: '#F6C6A0', bg: '#FFF7EE' }
};

const RecordItem: React.FC<RecordItemProps> = ({ record, onDelete }) => {
  const style = TYPE_STYLES[record.type] || TYPE_STYLES.symptom;

  return (
    <View className={styles.recordCard}>
      <View className={styles.recordLeft}>
        <View
          className={styles.iconBox}
          style={{ background: style.bg }}
        >
          <Text className={styles.iconText}>{style.icon}</Text>
        </View>
      </View>

      <View className={styles.recordContent}>
        <View className={styles.recordHeader}>
          <Text className={styles.recordType} style={{ color: style.color }}>
            {record.typeText}
          </Text>
          <Text className={styles.recordTime}>{record.createdAt}</Text>
        </View>

        <View className={styles.recordDateRow}>
          <Text className={styles.recordDate}>{record.date}</Text>
          {record.result && (
            <View
              className={styles.resultTag}
              style={{ background: style.bg, color: style.color }}
            >
              {record.result}
            </View>
          )}
        </View>

        {record.note && (
          <Text className={styles.recordNote}>{record.note}</Text>
        )}
      </View>

      <View
        className={styles.deleteBtn}
        onClick={() => onDelete?.(record.id)}
      >
        <Text className={styles.deleteIcon}>×</Text>
      </View>
    </View>
  );
};

export default RecordItem;
