/**
 * Calculate the current streak for a habit based on completed dates
 * @param {Array<string>} completedDates - Array of date strings in YYYY-MM-DD format
 * @returns {number} Current streak count
 */
export const calculateStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) {
    return 0;
  }

  // Sort dates in descending order (newest first)
  const sortedDates = [...completedDates].sort().reverse();

  // Get today and yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if most recent completion is today or yesterday
  const mostRecentDate = sortedDates[0];
  if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
    // Streak is broken
    return 0;
  }

  // Count consecutive days
  let streak = 0;
  let checkDate = new Date(sortedDates[0]);

  for (const dateStr of sortedDates) {
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

/**
 * Get date in YYYY-MM-DD format
 * @param {Date} date - JavaScript Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if a date string is today
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isToday = (dateStr) => {
  return dateStr === formatDate();
};

/**
 * Check if a date string is in the future
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isFuture = (dateStr) => {
  // Compare as plain YYYY-MM-DD strings to avoid timezone issues
  const todayStr = new Date().toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD
  return dateStr > todayStr;
};
