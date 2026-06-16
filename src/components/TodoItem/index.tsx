import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { TodoItem } from '@/types';
import styles from './index.module.scss';

interface TodoItemProps {
  todo: TodoItem;
  onToggle?: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  prep: { label: '准备', color: '#D4859C', bg: '#FFF0F3' },
  check: { label: '检查', color: '#A8B8E0', bg: '#F0F4FF' },
  nutrition: { label: '营养', color: '#7EC8A3', bg: '#E5F5EC' },
  lifestyle: { label: '生活', color: '#F6C6A0', bg: '#FFF1E5' }
};

const TodoItemComponent: React.FC<TodoItemProps> = ({ todo, onToggle }) => {
  const cat = CATEGORY_LABELS[todo.category] || CATEGORY_LABELS.prep;

  return (
    <View
      className={classnames(styles.todoItem, todo.done && styles.done)}
      onClick={() => onToggle?.(todo.id)}
    >
      <View className={styles.checkbox}>
        {todo.done && <Text className={styles.checkmark}>✓</Text>}
      </View>

      <View className={styles.todoContent}>
        <View className={styles.todoHeader}>
          <Text className={styles.todoTitle}>{todo.title}</Text>
          <View
            className={styles.categoryTag}
            style={{ background: cat.bg, color: cat.color }}
          >
            {cat.label}
          </View>
        </View>
        {todo.desc && (
          <Text className={styles.todoDesc}>{todo.desc}</Text>
        )}
      </View>
    </View>
  );
};

export default TodoItemComponent;
