import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import connectDB from '../config/database.js';
import { formatDate } from './calculateStreak.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany();
    await Habit.deleteMany();
    await Task.deleteMany();

    // Create demo user
    console.log('👤 Creating demo user...');
    const user = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'password123',
      avatar: '🚀',
      bio: 'Building better habits, one day at a time'
    });

    console.log('✅ Demo user created:');
    console.log('   Email: demo@example.com');
    console.log('   Password: password123');

    // Create sample habits
    console.log('\n🎯 Creating sample habits...');
    
    const today = formatDate();
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const twoDaysAgo = formatDate(new Date(Date.now() - 172800000));

    const habits = await Habit.create([
      {
        user: user._id,
        name: 'Morning Exercise',
        icon: '🏃',
        category: 'Fitness',
        color: 'blue',
        target: 1,
        streak: 3,
        completedDates: [today, yesterday, twoDaysAgo]
      },
      {
        user: user._id,
        name: 'Read 30 Minutes',
        icon: '📚',
        category: 'Learning',
        color: 'violet',
        target: 1,
        streak: 2,
        completedDates: [today, yesterday]
      },
      {
        user: user._id,
        name: 'Drink Water',
        icon: '💧',
        category: 'Health',
        color: 'cyan',
        target: 8,
        streak: 1,
        completedDates: [today]
      },
      {
        user: user._id,
        name: 'Meditation',
        icon: '🧘',
        category: 'Wellness',
        color: 'green',
        target: 1,
        streak: 0,
        completedDates: []
      },
      {
        user: user._id,
        name: 'Journal',
        icon: '✍️',
        category: 'Productivity',
        color: 'orange',
        target: 1,
        streak: 2,
        completedDates: [today, yesterday]
      }
    ]);

    console.log(`✅ Created ${habits.length} sample habits`);

    // Create sample tasks
    console.log('\n✅ Creating sample tasks...');
    
    const tasks = await Task.create([
      {
        user: user._id,
        text: 'Complete project proposal',
        priority: 'high',
        completed: false,
        isHabit: false,
        createdDate: today
      },
      {
        user: user._id,
        text: 'Review pull requests',
        priority: 'medium',
        completed: true,
        isHabit: false,
        createdDate: today
      },
      {
        user: user._id,
        text: 'Team meeting at 2 PM',
        priority: 'high',
        completed: false,
        isHabit: false,
        createdDate: today
      }
    ]);

    console.log(`✅ Created ${tasks.length} sample tasks`);

    // Create a trashed habit
    console.log('\n🗑️  Creating trashed habit...');
    await Habit.create({
      user: user._id,
      name: 'Old Habit',
      icon: '⭐',
      category: 'Other',
      color: 'pink',
      target: 1,
      streak: 0,
      completedDates: [],
      isTrashed: true,
      trashedAt: new Date()
    });

    console.log('✅ Created 1 trashed habit');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: demo@example.com');
    console.log('   Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
