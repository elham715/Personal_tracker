export const HABIT_ICONS = [
  '🎯', '💪', '📚', '🏃', '🧘', '💧', '🍎', '😴', 
  '✍️', '🎨', '🎵', '🧠', '❤️', '🌱', '☀️', '🌙',
  '⚡', '🔥', '✨', '🎪', '🎭', '🎬', '📸', '🎮'
];

export const HABIT_CATEGORIES = [
  'Health',
  'Fitness',
  'Learning',
  'Productivity',
  'Mindfulness',
  'Creativity',
  'Social',
  'Finance',
  'Other'
];

export const HABIT_COLORS = [
  { name: 'purple', class: 'bg-purple-500', light: 'bg-purple-400', ring: 'ring-purple-500' },
  { name: 'blue', class: 'bg-blue-500', light: 'bg-blue-400', ring: 'ring-blue-500' },
  { name: 'green', class: 'bg-green-500', light: 'bg-green-400', ring: 'ring-green-500' },
  { name: 'pink', class: 'bg-pink-500', light: 'bg-pink-400', ring: 'ring-pink-500' },
  { name: 'orange', class: 'bg-orange-500', light: 'bg-orange-400', ring: 'ring-orange-500' },
  { name: 'cyan', class: 'bg-cyan-500', light: 'bg-cyan-400', ring: 'ring-cyan-500' },
];

export const PRIORITY_COLORS = {
  high: 'border-l-4 border-red-500',
  medium: 'border-l-4 border-yellow-500',
  low: 'border-l-4 border-green-500',
};

export const getColorClasses = (colorName: string) => {
  const color = HABIT_COLORS.find(c => c.name === colorName) || HABIT_COLORS[0];
  return color;
};
