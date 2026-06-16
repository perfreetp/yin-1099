import dayjs from 'dayjs';
import type { CycleConfig, ReminderConfig, TodoItem } from '@/types';

export const defaultCycleConfig: CycleConfig = {
  lastPeriodDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  cycleLength: 28,
  periodLength: 5,
  ovulationDayOffset: 14,
  manualOvulationDate: null,
  isSkipped: false
};

export const defaultReminderConfig: ReminderConfig = {
  enabled: true,
  femaleTime: '20:00',
  maleTime: '20:30',
  notifyFemale: true,
  notifyMale: true,
  intensity: 'all',
  vibrate: true
};

export const defaultTodos: TodoItem[] = [
  {
    id: '1',
    title: '每日补充叶酸',
    desc: '建议 400μg/天，孕前3个月开始',
    done: false,
    category: 'nutrition'
  },
  {
    id: '2',
    title: '孕前检查（优生四项）',
    desc: 'TORCH 全套筛查',
    done: false,
    category: 'check'
  },
  {
    id: '3',
    title: '保持规律作息',
    desc: '23点前入睡，保证7-8小时睡眠',
    done: false,
    category: 'lifestyle'
  },
  {
    id: '4',
    title: '每周运动3次以上',
    desc: '快走、游泳、瑜伽，每次30分钟',
    done: false,
    category: 'lifestyle'
  },
  {
    id: '5',
    title: '基础体温测量',
    desc: '每日早晨醒来测量并记录',
    done: false,
    category: 'prep'
  },
  {
    id: '6',
    title: '补充维生素D',
    desc: '建议每日 400-800 IU',
    done: false,
    category: 'nutrition'
  },
  {
    id: '7',
    title: '口腔检查',
    desc: '处理牙周问题，避免孕期风险',
    done: false,
    category: 'check'
  },
  {
    id: '8',
    title: '记录排卵信号',
    desc: '观察白带拉丝、体温变化',
    done: false,
    category: 'prep'
  }
];
