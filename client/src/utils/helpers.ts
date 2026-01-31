export const formatDate = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

export const isToday = (dateStr: string): boolean => {
  return dateStr === formatDate();
};

export const isFuture = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() > today.getTime();
};

export const calculateStreak = (completedDates: string[]): number => {
  if (!completedDates || completedDates.length === 0) return 0;

  const sorted = [...completedDates].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(yesterday);

  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(sorted[0]);

  for (const dateStr of sorted) {
    const date = new Date(dateStr);
    const diffDays = Math.floor((checkDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      streak++;
      checkDate = date;
    } else {
      break;
    }
  }

  return streak;
};

export const getDatesRange = (days: number = 14): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  
  return dates;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
