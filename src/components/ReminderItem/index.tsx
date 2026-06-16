import React from 'react';
import { View, Text, Switch } from '@tarojs/components';
import styles from './index.module.scss';

interface ReminderItemProps {
  icon: string;
  title: string;
  desc?: string;
  right?: React.ReactNode;
  hasSwitch?: boolean;
  checked?: boolean;
  onToggle?: (checked: boolean) => void;
  onClick?: () => void;
  highlight?: boolean;
}

const ReminderItem: React.FC<ReminderItemProps> = ({
  icon,
  title,
  desc,
  right,
  hasSwitch,
  checked,
  onToggle,
  onClick,
  highlight
}) => {
  return (
    <View
      className={styles.reminderItem}
      onClick={onClick}
      style={highlight ? { background: '#FFF5F7' } : undefined}
    >
      <View className={styles.iconBox}>
        <Text className={styles.iconText}>{icon}</Text>
      </View>
      <View className={styles.itemContent}>
        <Text className={styles.itemTitle}>{title}</Text>
        {desc && <Text className={styles.itemDesc}>{desc}</Text>}
      </View>
      <View className={styles.itemRight}>
        {hasSwitch ? (
          <Switch
            checked={checked}
            onChange={(e) => onToggle?.(e.detail.value)}
            color='#E8A5B8'
          />
        ) : right ? (
          right
        ) : (
          <Text className={styles.arrow}>›</Text>
        )}
      </View>
    </View>
  );
};

export default ReminderItem;
