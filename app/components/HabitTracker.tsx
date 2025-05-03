"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { 
  CheckCircle, X, Plus, Trash2, Edit, Calendar, Award, 
  Sun, Moon, Activity, AlertCircle, Settings, ChevronDown,
  Clock, RotateCcw, Sparkles, Circle, ArrowUp, ArrowDown, 
  ExternalLink, DollarSign, Trash, Check, XCircle, CheckSquare,
  RefreshCcw, List, Grid, Search, Bell, FileText, CheckCircle as CheckCircleIcon,
  Book, Code, Droplet, Download, Clock as ClockIcon, Lightbulb
} from 'lucide-react';
import { saveAs } from 'file-saver';

// ========== TYPES ==========
interface Habit {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  createdAt: string;
  streak: number;
  history: {
    date: string;
    status: 'completed' | 'missed' | 'pending';
  }[];
  color: string;
  icon: string;
  reminderTime?: string;
  priority: number;
  xp: number;
  timeEstimate?: number; // in minutes
  bestTime?: 'morning' | 'afternoon' | 'evening';
}

interface User {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: Achievement[];
  createdAt: string;
  streak: number;
  longestStreak: number;
  theme: 'light' | 'dark';
  preferences: {
    morningStart?: string;
    afternoonStart?: string;
    eveningStart?: string;
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  total: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  createdAt: string;
  read: boolean;
}

interface TimeBlock {
  id: string;
  habitId: string;
  startTime: string;
  endTime: string;
  date: string;
}

interface Reminder {
  id: string;
  habitId: string;
  time: string;
  enabled: boolean;
}

// ========== MOCK DATA ==========
const generateMockData = () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  const mockHabits: Habit[] = [
    {
      id: '1',
      title: 'Morning Meditation',
      description: 'Start day with 10 minutes of mindfulness',
      category: 'Wellness',
      completed: false,
      createdAt: '2025-04-20',
      streak: 5,
      history: [
        { date: yesterday, status: 'completed' },
        { date: '2025-04-30', status: 'completed' },
        { date: '2025-04-29', status: 'completed' },
        { date: '2025-04-28', status: 'completed' },
        { date: '2025-04-27', status: 'completed' },
        { date: '2025-04-26', status: 'missed' },
      ],
      color: 'bg-blue-500',
      icon: 'activity',
      reminderTime: '08:00',
      priority: 1,
      xp: 15,
      timeEstimate: 10,
      bestTime: 'morning'
    },
    {
      id: '2',
      title: 'Read 30 minutes',
      description: 'Continue current book',
      category: 'Learning',
      completed: false,
      createdAt: '2025-04-18',
      streak: 3,
      history: [
        { date: yesterday, status: 'completed' },
        { date: '2025-04-30', status: 'completed' },
        { date: '2025-04-29', status: 'completed' },
        { date: '2025-04-28', status: 'missed' },
      ],
      color: 'bg-amber-500',
      icon: 'book',
      reminderTime: '21:00',
      priority: 2,
      xp: 10,
      timeEstimate: 30,
      bestTime: 'evening'
    },
    {
      id: '3',
      title: 'Workout',
      description: '30 minute exercise session',
      category: 'Fitness',
      completed: false,
      createdAt: '2025-04-10',
      streak: 7,
      history: [
        { date: yesterday, status: 'completed' },
        { date: '2025-04-30', status: 'completed' },
        { date: '2025-04-29', status: 'completed' },
        { date: '2025-04-28', status: 'completed' },
        { date: '2025-04-27', status: 'completed' },
        { date: '2025-04-26', status: 'completed' },
        { date: '2025-04-25', status: 'completed' },
      ],
      color: 'bg-green-500',
      icon: 'activity',
      reminderTime: '17:00',
      priority: 3,
      xp: 20,
      timeEstimate: 30,
      bestTime: 'afternoon'
    },
    {
      id: '4',
      title: 'Drink 8 glasses of water',
      description: 'Stay hydrated throughout the day',
      category: 'Health',
      completed: false,
      createdAt: '2025-04-25',
      streak: 6,
      history: [
        { date: yesterday, status: 'completed' },
        { date: '2025-04-30', status: 'completed' },
        { date: '2025-04-29', status: 'completed' },
        { date: '2025-04-28', status: 'completed' },
        { date: '2025-04-27', status: 'completed' },
        { date: '2025-04-26', status: 'completed' },
      ],
      color: 'bg-cyan-500',
      icon: 'droplet',
      priority: 4,
      xp: 10
    },
    {
      id: '5',
      title: 'Practice coding',
      description: 'Work on personal project for 1 hour',
      category: 'Learning',
      completed: false,
      createdAt: '2025-04-19',
      streak: 4,
      history: [
        { date: yesterday, status: 'completed' },
        { date: '2025-04-30', status: 'completed' },
        { date: '2025-04-29', status: 'completed' },
        { date: '2025-04-28', status: 'completed' },
        { date: '2025-04-27', status: 'missed' },
      ],
      color: 'bg-purple-500',
      icon: 'code',
      reminderTime: '19:00',
      priority: 5,
      xp: 25,
      timeEstimate: 60,
      bestTime: 'evening'
    }
  ];

  const mockUser: User = {
    name: 'Alex Johnson',
    level: 7,
    xp: 350,
    xpToNextLevel: 500,
    achievements: [
      {
        id: 'a1',
        title: 'Early Bird',
        description: 'Complete morning routine for 7 days straight',
        icon: 'sun',
        unlockedAt: '2025-04-27',
        progress: 7,
        total: 7
      },
      {
        id: 'a2',
        title: 'Bookworm',
        description: 'Read for 30 days total',
        icon: 'book',
        progress: 12,
        total: 30
      },
      {
        id: 'a3',
        title: 'Fitness Fanatic',
        description: 'Complete 20 workouts',
        icon: 'activity',
        progress: 15,
        total: 20
      },
      {
        id: 'a4',
        title: 'Consistency King',
        description: 'Maintain a 10-day streak',
        icon: 'award',
        progress: 7,
        total: 10
      }
    ],
    createdAt: '2025-04-01',
    streak: 7,
    longestStreak: 10,
    theme: 'light',
    preferences: {
      morningStart: '06:00',
      afternoonStart: '12:00',
      eveningStart: '18:00'
    }
  };

  const mockNotifications: Notification[] = [
    {
      id: 'n1',
      title: 'Morning Reminder',
      message: 'Time for your morning meditation!',
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false
    },
    {
      id: 'n2',
      title: 'Achievement Unlocked!',
      message: 'You\'ve earned the "Early Bird" badge!',
      type: 'success',
      createdAt: '2025-04-27T10:30:00Z',
      read: true
    },
    {
      id: 'n3',
      title: 'Streak Alert',
      message: 'You\'re on a 7-day streak! Keep it up!',
      type: 'success',
      createdAt: '2025-05-01T22:00:00Z',
      read: false
    }
  ];

  const mockTimeBlocks: TimeBlock[] = [
    {
      id: 'tb1',
      habitId: '1',
      startTime: '08:00',
      endTime: '08:10',
      date: today
    },
    {
      id: 'tb2',
      habitId: '3',
      startTime: '17:00',
      endTime: '17:30',
      date: today
    },
    {
      id: 'tb3',
      habitId: '5',
      startTime: '19:00',
      endTime: '20:00',
      date: today
    }
  ];

  const mockReminders: Reminder[] = [
    { id: 'reminder1', habitId: '1', time: '08:00', enabled: true }
  ];

  return { 
    mockHabits, 
    mockUser, 
    mockNotifications, 
    mockTimeBlocks,
    mockReminders
  };
};

// ========== MAIN COMPONENT ==========
export default function HabitTracker() {
  const { 
    mockHabits, 
    mockUser, 
    mockNotifications, 
    mockTimeBlocks,
    mockReminders
  } = generateMockData();
  
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [user, setUser] = useState<User>(mockUser);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(mockTimeBlocks);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [theme, setTheme] = useState<'light' | 'dark'>(mockUser.theme);
  const [activeTab, setActiveTab] = useState('today');
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [draggingHabit, setDraggingHabit] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [undoAction, setUndoAction] = useState<{habit: Habit, action: string} | null>(null);
  const [showTimeBlockModal, setShowTimeBlockModal] = useState(false);
  const [selectedHabitForTimeBlock, setSelectedHabitForTimeBlock] = useState<Habit | null>(null);
  const [timeBlockForm, setTimeBlockForm] = useState({
    startTime: '',
    endTime: ''
  });
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmingDone, setConfirmingDone] = useState<string | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  
  const formRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const timeBlockRef = useRef<HTMLDivElement>(null);

  // Today's date
  const today = new Date().toISOString().split('T')[0];

  // Category colors for charts
  const CATEGORY_COLORS: Record<string, string> = {
    Wellness: '#3b82f6',
    Fitness: '#10b981',
    Learning: '#f59e0b',
    Health: '#06b6d4',
    Productivity: '#8b5cf6'
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    const storedHabits = localStorage.getItem('habits');
    const storedUser = localStorage.getItem('user');
    const storedTimeBlocks = localStorage.getItem('timeBlocks');
    
    if (storedHabits) setHabits(JSON.parse(storedHabits));
    if (storedUser && storedUser !== "undefined") {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setTheme(parsedUser.theme);
    }
    if (storedTimeBlocks) setTimeBlocks(JSON.parse(storedTimeBlocks));
    
    document.documentElement.classList.toggle('dark', theme === 'dark');

    // Setup midnight check
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0
    );
    const timeToMidnight = midnight.getTime() - now.getTime();
    
    const midnightTimer = setTimeout(() => {
      checkMidnightSummary();
      // Set interval for daily midnight checks
      setInterval(checkMidnightSummary, 24 * 60 * 60 * 1000);
    }, timeToMidnight);

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(midnightTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
  }, [habits, user, timeBlocks]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setUser(prev => ({...prev, theme}));
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowForm(false);
        setEditingHabit(null);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (timeBlockRef.current && !timeBlockRef.current.contains(event.target as Node)) {
        setShowTimeBlockModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (undoAction) {
      const timer = setTimeout(() => setUndoAction(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [undoAction]);

  // ========== CORE FUNCTIONS ==========
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const toggleHabitCompletion = (id: string) => {
    setHabits(prevHabits => prevHabits.map(habit => {
      if (habit.id === id) {
        const wasCompleted = habit.completed;
        const updatedHabit = {...habit, completed: !habit.completed};
        
        setUndoAction({habit, action: wasCompleted ? 'uncomplete' : 'complete'});
        
        if (!wasCompleted) {
          // Update history and streak
          const todayEntry = habit.history.find(entry => entry.date === today);
          updatedHabit.history = todayEntry 
            ? habit.history.map(entry => entry.date === today ? {...entry, status: 'completed'} : entry)
            : [{date: today, status: 'completed'}, ...habit.history];
          
          // Update streak
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const yesterdayEntry = habit.history.find(entry => entry.date === yesterdayStr);
          
          updatedHabit.streak = (yesterdayEntry?.status === 'completed') ? habit.streak + 1 : 1;
          addXpToUser(habit.xp);
          checkForAchievements(updatedHabit);
        } else {
          updatedHabit.history = habit.history.map(entry => 
            entry.date === today ? {...entry, status: 'missed'} : entry
          );
          if (updatedHabit.streak > 0) updatedHabit.streak -= 1;
          addXpToUser(-habit.xp);
        }
        
        return updatedHabit;
      }
      return habit;
    }));
  };

  // Function to mark habit as done with confirmation
  const markHabitAsDone = (id: string) => {
    setHabits(prevHabits => prevHabits.map(habit => {
      if (habit.id === id) {
        // Update habit completion status and history
        const updatedHabit = {
          ...habit,
          completed: true,
          history: [
            { date: today, status: 'completed' },
            ...habit.history.filter(entry => entry.date !== today)
          ]
        };

        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayEntry = habit.history.find(entry => entry.date === yesterdayStr);
        
        updatedHabit.streak = (yesterdayEntry?.status === 'completed') ? habit.streak + 1 : 1;

        // Add XP to user
        addXpToUser(habit.xp);
        
        // Check for achievements
        checkForAchievements(updatedHabit);

        // Add notification
        addNotification({
          id: Date.now().toString(),
          title: 'Habit Completed!',
          message: `Great job completing "${habit.title}"!`,
          type: 'success',
          createdAt: new Date().toISOString(),
          read: false
        });

        return updatedHabit;
      }
      return habit;
    }));

    setConfirmingDone(null);
  };

  // Function to reset all progress
  const resetAllProgress = () => {
    const freshHabits = habits.map(habit => ({
      ...habit,
      completed: false,
      streak: 0,
      history: [],
      priority: habit.priority // Keep the same priority
    }));

    const freshUser: User = {
      ...user,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 0,
      achievements: user.achievements.map(ach => ({
        ...ach,
        unlockedAt: undefined,
        progress: 0
      }))
    };

    setHabits(freshHabits);
    setUser(freshUser);
    setTimeBlocks([]);
    setNotifications([]);
    setShowResetConfirm(false);

    // Update localStorage
    localStorage.setItem('habits', JSON.stringify(freshHabits));
    localStorage.setItem('user', JSON.stringify(freshUser));
    localStorage.setItem('timeBlocks', JSON.stringify([]));

    addNotification({
      id: Date.now().toString(),
      title: 'Fresh Start!',
      message: 'All your progress has been reset to zero',
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false
    });
  };

  const addXpToUser = (xp: number) => {
    setUser(prevUser => {
      const newXp = prevUser.xp + xp;
      let newLevel = prevUser.level;
      let newXpToNextLevel = prevUser.xpToNextLevel;
      
      if (newXp >= prevUser.xpToNextLevel) {
        newLevel += 1;
        newXpToNextLevel = Math.floor(prevUser.xpToNextLevel * 1.2);
        
        addNotification({
          id: Date.now().toString(),
          title: 'Level Up!',
          message: `Congratulations! You've reached level ${newLevel}!`,
          type: 'success',
          createdAt: new Date().toISOString(),
          read: false
        });
      }
      
      let newStreak = prevUser.streak;
      const streakDate = localStorage.getItem('lastStreakDate');
      
      if (!streakDate || streakDate !== today) {
        localStorage.setItem('lastStreakDate', today);
        newStreak += 1;
        
        if (newStreak > prevUser.longestStreak) {
          return {
            ...prevUser,
            xp: newXp,
            level: newLevel,
            xpToNextLevel: newXpToNextLevel,
            streak: newStreak,
            longestStreak: newStreak
          };
        }
      }
      
      return {
        ...prevUser,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNextLevel,
        streak: newStreak
      };
    });
  };

  const checkForAchievements = (habit: Habit) => {
    setUser(prevUser => {
      const updatedAchievements = [...prevUser.achievements];
      
      updatedAchievements.forEach((achievement, index) => {
        if (achievement.id === 'a1' && habit.title.includes('Morning') && habit.streak === 7) {
          if (!achievement.unlockedAt) {
            updatedAchievements[index] = {
              ...achievement,
              unlockedAt: today,
              progress: 7
            };
            
            setShowAchievement(updatedAchievements[index]);
            
            addNotification({
              id: Date.now().toString(),
              title: 'Achievement Unlocked!',
              message: `You've earned the "${achievement.title}" badge!`,
              type: 'success',
              createdAt: new Date().toISOString(),
              read: false
            });
          }
        }
        
        if (achievement.id === 'a4' && habit.streak >= achievement.progress) {
          const newProgress = Math.min(habit.streak, achievement.total);
          updatedAchievements[index] = {
            ...achievement,
            progress: newProgress
          };
          
          if (newProgress === achievement.total && !achievement.unlockedAt) {
            updatedAchievements[index].unlockedAt = today;
            setShowAchievement(updatedAchievements[index]);
            addNotification({
              id: Date.now().toString(),
              title: 'Achievement Unlocked!',
              message: `You've earned the "${achievement.title}" badge!`,
              type: 'success',
              createdAt: new Date().toISOString(),
              read: false
            });
          }
        }
        
        if (habit.category === 'Learning' && achievement.id === 'a2') {
          const readingDays = habit.history.filter(entry => entry.status === 'completed').length;
          const newProgress = Math.min(readingDays, achievement.total);
          
          updatedAchievements[index] = {
            ...achievement,
            progress: newProgress
          };
          
          if (newProgress === achievement.total && !achievement.unlockedAt) {
            updatedAchievements[index].unlockedAt = today;
            setShowAchievement(updatedAchievements[index]);
            addNotification({
              id: Date.now().toString(),
              title: 'Achievement Unlocked!',
              message: `You've earned the "${achievement.title}" badge!`,
              type: 'success',
              createdAt: new Date().toISOString(),
              read: false
            });
          }
        }
        
        if (habit.category === 'Fitness' && achievement.id === 'a3') {
          const workoutDays = habit.history.filter(entry => entry.status === 'completed').length;
          const newProgress = Math.min(workoutDays, achievement.total);
          
          updatedAchievements[index] = {
            ...achievement,
            progress: newProgress
          };
          
          if (newProgress === achievement.total && !achievement.unlockedAt) {
            updatedAchievements[index].unlockedAt = today;
            setShowAchievement(updatedAchievements[index]);
            addNotification({
              id: Date.now().toString(),
              title: 'Achievement Unlocked!',
              message: `You've earned the "${achievement.title}" badge!`,
              type: 'success',
              createdAt: new Date().toISOString(),
              read: false
            });
          }
        }
      });
      
      return {
        ...prevUser,
        achievements: updatedAchievements
      };
    });
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? {...notif, read: true} : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addHabit = (newHabit: Omit<Habit, 'id' | 'createdAt' | 'completed' | 'streak' | 'history'>) => {
    const habit: Habit = {
      ...newHabit,
      id: Date.now().toString(),
      createdAt: today,
      completed: false,
      streak: 0,
      history: []
    };
    
    setHabits(prev => [habit, ...prev]);
    setShowForm(false);
    
    addNotification({
      id: Date.now().toString(),
      title: 'New Habit Added',
      message: `You've created a new habit: ${habit.title}`,
      type: 'success',
      createdAt: new Date().toISOString(),
      read: false
    });
  };

  const updateHabit = (updatedHabit: Habit) => {
    setHabits(prev => 
      prev.map(habit => 
        habit.id === updatedHabit.id ? updatedHabit : habit
      )
    );
    
    setEditingHabit(null);
    setShowForm(false);
    
    addNotification({
      id: Date.now().toString(),
      title: 'Habit Updated',
      message: `You've updated: ${updatedHabit.title}`,
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false
    });
  };

  const deleteHabit = (id: string) => {
    const habitToDelete = habits.find(h => h.id === id);
    if (!habitToDelete) return;
    
    setHabits(prev => prev.filter(habit => habit.id !== id));
    setShowDeleteConfirm(null);
    setUndoAction({habit: habitToDelete, action: 'delete'});
    
    addNotification({
      id: Date.now().toString(),
      title: 'Habit Deleted',
      message: `You've deleted: ${habitToDelete.title}`,
      type: 'warning',
      createdAt: new Date().toISOString(),
      read: false
    });
  };

  const handleUndo = () => {
    if (!undoAction) return;
    
    const { habit, action } = undoAction;
    
    if (action === 'delete') {
      setHabits(prev => [...prev, habit]);
    } else if (action === 'complete' || action === 'uncomplete') {
      toggleHabitCompletion(habit.id);
    }
    
    setUndoAction(null);
  };

  const handleDragStart = (id: string) => {
    setDraggingHabit(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingHabit === id) return;
    
    const draggedHabit = habits.find(h => h.id === draggingHabit);
    const targetHabit = habits.find(h => h.id === id);
    
    if (draggedHabit && targetHabit) {
      const updatedHabits = habits.map(habit => {
        if (habit.id === draggedHabit.id) {
          return { ...habit, priority: targetHabit.priority };
        }
        if (habit.id === targetHabit.id) {
          return { ...habit, priority: draggedHabit.priority };
        }
        return habit;
      });
      
      setHabits(updatedHabits.sort((a, b) => a.priority - b.priority));
    }
  };

  const handleDragEnd = () => {
    setDraggingHabit(null);
  };

  const moveHabitPriority = (id: string, direction: 'up' | 'down') => {
    const habitIndex = habits.findIndex(h => h.id === id);
    if (
      (direction === 'up' && habitIndex === 0) || 
      (direction === 'down' && habitIndex === habits.length - 1)
    ) {
      return;
    }
    
    const swapIndex = direction === 'up' ? habitIndex - 1 : habitIndex + 1;
    const updatedHabits = [...habits];
    const currentPriority = updatedHabits[habitIndex].priority;
    const swapPriority = updatedHabits[swapIndex].priority;
    
    updatedHabits[habitIndex].priority = swapPriority;
    updatedHabits[swapIndex].priority = currentPriority;
    
    setHabits(updatedHabits.sort((a, b) => a.priority - b.priority));
  };

  // ========== NEW FEATURES ==========

  // 1. SMART HABIT SUGGESTIONS
  const getSmartSuggestions = useCallback(() => {
    // Analyze completion patterns
    const completionRates = habits.map(habit => {
      const totalDays = habit.history.length;
      const completedDays = habit.history.filter(h => h.status === 'completed').length;
      return {
        habit,
        completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0
      };
    });

    // Find habits with low completion rates
    const strugglingHabits = completionRates
      .filter(item => item.completionRate < 50)
      .sort((a, b) => a.completionRate - b.completionRate);

    // Find best performing categories
    const categoryPerformance: Record<string, {completed: number, total: number}> = {};
    habits.forEach(habit => {
      if (!categoryPerformance[habit.category]) {
        categoryPerformance[habit.category] = {completed: 0, total: 0};
      }
      categoryPerformance[habit.category].completed += 
        habit.history.filter(h => h.status === 'completed').length;
      categoryPerformance[habit.category].total += habit.history.length;
    });

    // Suggest new habits in strong categories
    const bestCategory = Object.entries(categoryPerformance)
      .reduce((best, [category, stats]) => {
        const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        return rate > best.rate ? {category, rate} : best;
      }, {category: '', rate: 0});

    const suggestions = [];
    
    if (strugglingHabits.length > 0) {
      suggestions.push({
        type: 'improvement',
        message: `You're struggling with "${strugglingHabits[0].habit.title}". Try adjusting the time or breaking it into smaller steps.`,
        habit: strugglingHabits[0].habit
      });
    }

    if (bestCategory.category) {
      const categoryHabits = {
        Wellness: ['Deep breathing', 'Gratitude journaling'],
        Fitness: ['Stretching', 'Walking'],
        Learning: ['Learn a new word', 'Watch educational video'],
        Health: ['Eat vegetables', 'Drink water'],
        Productivity: ['Plan next day', 'Review goals']
      };

      if (categoryHabits[bestCategory.category as keyof typeof categoryHabits]) {
        const newHabitSuggestion = categoryHabits[bestCategory.category as keyof typeof categoryHabits][0];
        suggestions.push({
          type: 'new',
          message: `You're doing well with ${bestCategory.category} habits. Consider adding "${newHabitSuggestion}"`,
          category: bestCategory.category
        });
      }
    }

    // Time-based suggestions
    const now = new Date();
    const hours = now.getHours();
    const timeOfDay = hours < 12 ? 'morning' : hours < 17 ? 'afternoon' : 'evening';
    
    const timeBasedHabits = habits.filter(h => h.bestTime === timeOfDay && !h.completed);
    if (timeBasedHabits.length > 0) {
      suggestions.push({
        type: 'time',
        message: `It's ${timeOfDay} - good time for "${timeBasedHabits[0].title}"`,
        habit: timeBasedHabits[0]
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }, [habits]);

  // 2. TIME-BLOCKING FUNCTIONALITY
  const handleAddTimeBlock = (habit: Habit) => {
    setSelectedHabitForTimeBlock(habit);
    setTimeBlockForm({
      startTime: habit.reminderTime || '',
      endTime: habit.reminderTime ? 
        addMinutesToTime(habit.reminderTime, habit.timeEstimate || 30) : 
        addMinutesToTime('12:00', habit.timeEstimate || 30)
    });
    setShowTimeBlockModal(true);
  };

  const addMinutesToTime = (time: string, minutes: number) => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const saveTimeBlock = () => {
    if (!selectedHabitForTimeBlock || !timeBlockForm.startTime || !timeBlockForm.endTime) return;
    
    const newTimeBlock: TimeBlock = {
      id: Date.now().toString(),
      habitId: selectedHabitForTimeBlock.id,
      startTime: timeBlockForm.startTime,
      endTime: timeBlockForm.endTime,
      date: today
    };
    
    setTimeBlocks(prev => [...prev, newTimeBlock]);
    setShowTimeBlockModal(false);
    addNotification({
      id: Date.now().toString(),
      title: 'Time Block Added',
      message: `Scheduled ${selectedHabitForTimeBlock.title} from ${timeBlockForm.startTime} to ${timeBlockForm.endTime}`,
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false
    });
  };

  const renderTimeBlockView = () => {
    const todayBlocks = timeBlocks.filter(block => block.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    const timeSlots = [];
    for (let hour = 6; hour <= 22; hour++) {
      timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
    }

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
        <div className="relative h-96 overflow-y-auto">
          {timeSlots.map(time => {
            const currentBlock = todayBlocks.find(block => 
              block.startTime <= time && block.endTime > time
            );
            
            const habit = currentBlock ? habits.find(h => h.id === currentBlock.habitId) : null;
            const isStart = currentBlock?.startTime === time;
            const height = currentBlock ? 
              (parseInt(currentBlock.endTime.split(':')[0]) * 60 + parseInt(currentBlock.endTime.split(':')[1]) - 
              (parseInt(currentBlock.startTime.split(':')[0]) * 60 + parseInt(currentBlock.startTime.split(':')[1])) ): 0;
            
            return (
              <div key={time} className="flex border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 py-2 text-xs text-gray-500 dark:text-gray-400">{time}</div>
                <div className="flex-1 relative">
                  {currentBlock && isStart && (
                    <motion.div 
                      className={`absolute left-0 right-0 rounded-lg p-2 ${habit?.color || 'bg-gray-200'} ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                      style={{ height: `${height}px` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="font-medium">{habit?.title}</div>
                      <div className="text-xs">
                        {currentBlock.startTime} - {currentBlock.endTime}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 3. DATA EXPORT FUNCTIONALITY
  const exportData = (format: 'json' | 'csv') => {
    const data = {
      habits,
      user,
      timeBlocks,
      stats: {
        completionRate: (habits.filter(h => h.completed).length / habits.length) * 100,
        totalXp: user.xp,
        streak: user.streak
      }
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `habit-tracker-export-${new Date().toISOString().split('T')[0]}.json`);
    } else {
      // Convert to CSV
      let csv = 'Habit,Category,Completed,Streak,XP\n';
      habits.forEach(habit => {
        csv += `"${habit.title}","${habit.category}",${habit.completed ? 'Yes' : 'No'},${habit.streak},${habit.xp}\n`;
      });
      
      csv += '\n\nTime Blocks\nHabit,Start Time,End Time,Date\n';
      timeBlocks.forEach(block => {
        const habit = habits.find(h => h.id === block.habitId);
        csv += `"${habit?.title || 'Unknown'}","${block.startTime}","${block.endTime}","${block.date}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `habit-tracker-export-${new Date().toISOString().split('T')[0]}.csv`);
    }

    addNotification({
      id: Date.now().toString(),
      title: 'Data Exported',
      message: `Your habits data has been exported as ${format.toUpperCase()}`,
      type: 'success',
      createdAt: new Date().toISOString(),
      read: false
    });
  };

  // 4. MIDNIGHT SUMMARY
  const checkMidnightSummary = () => {
    const completedToday = habits.filter(h => 
      h.history.some(entry => entry.date === today && entry.status === 'completed')
    ).length;
    
    const totalHabits = habits.length;
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    
    addNotification({
      id: Date.now().toString(),
      title: 'Daily Summary',
      message: `You completed ${completedToday}/${totalHabits} habits today (${completionRate}%)`,
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false
    });
  };

  // 5. REMINDERS
  const toggleReminder = (reminderId: string) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, enabled: !reminder.enabled } 
          : reminder
      )
    );
  };

  // 6. ANALYTICS DATA GENERATION
  const generateWeeklyCompletionData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
    
    return days.map((day, index) => {
      // Calculate how many days ago this was (0 = today, 1 = yesterday, etc.)
      const daysAgo = (currentDay - index + 7) % 7;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count completed habits for this day
      const completed = habits.filter(habit => 
        habit.history.some(entry => entry.date === dateStr && entry.status === 'completed')
      ).length;
      
      return {
        day,
        completed
      };
    });
  };

  const generateCategoryDistributionData = () => {
    const categoryCounts: Record<string, number> = {};
    
    habits.forEach(habit => {
      if (!categoryCounts[habit.category]) {
        categoryCounts[habit.category] = 0;
      }
      categoryCounts[habit.category] += 1;
    });
    
    return Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const generateStreakData = () => {
    return [
      { month: 'Jan', currentStreak: 5, longestStreak: 7 },
      { month: 'Feb', currentStreak: 3, longestStreak: 7 },
      { month: 'Mar', currentStreak: 8, longestStreak: 8 },
      { month: 'Apr', currentStreak: 10, longestStreak: 10 },
      { month: 'May', currentStreak: user.streak, longestStreak: user.longestStreak },
    ];
  };

  // Icon component
  const DynamicIcon = ({ name, className = "" }: { name: string, className?: string }) => {
    const iconMap: Record<string, React.ReactNode> = {
      'activity': <Activity className={className} />,
      'award': <Award className={className} />,
      'sun': <Sun className={className} />,
      'moon': <Moon className={className} />,
      'book': <Book className={className} />,
      'code': <Code className={className} />,
      'droplet': <Droplet className={className} />,
      'calendar': <Calendar className={className} />,
      'check': <Check className={className} />,
      'x': <X className={className} />
    };
    
    return <>{iconMap[name] || <Circle className={className} />}</>;
  };

  // Habit Form Component
  const HabitForm = () => {
    const [formData, setFormData] = useState<Omit<Habit, 'id' | 'createdAt' | 'completed' | 'streak' | 'history'>>(
      editingHabit ? {
        title: editingHabit.title,
        description: editingHabit.description,
        category: editingHabit.category,
        color: editingHabit.color,
        icon: editingHabit.icon,
        reminderTime: editingHabit.reminderTime,
        priority: editingHabit.priority,
        xp: editingHabit.xp,
        timeEstimate: editingHabit.timeEstimate,
        bestTime: editingHabit.bestTime
      } : {
        title: '',
        description: '',
        category: 'Wellness',
        color: 'bg-blue-500',
        icon: 'activity',
        reminderTime: '',
        priority: habits.length > 0 ? Math.max(...habits.map(h => h.priority)) + 1 : 1,
        xp: 10,
        timeEstimate: undefined,
        bestTime: undefined
      }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingHabit) {
        updateHabit({
          ...editingHabit,
          ...formData
        });
      } else {
        addHabit(formData);
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{editingHabit ? 'Edit Habit' : 'Add New Habit'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Habit Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="Wellness">Wellness</option>
              <option value="Fitness">Fitness</option>
              <option value="Learning">Learning</option>
              <option value="Health">Health</option>
              <option value="Productivity">Productivity</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex space-x-2">
              {['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500', 'bg-red-500'].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  onClick={() => setFormData({...formData, color})}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {['activity', 'book', 'code', 'droplet', 'sun', 'moon', 'award', 'calendar', 'check', 'x'].map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={`p-2 rounded-lg ${formData.icon === icon ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onClick={() => setFormData({...formData, icon})}
                >
                  <DynamicIcon name={icon} className="w-5 h-5 mx-auto" />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Reminder Time</label>
            <input
              type="time"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.reminderTime}
              onChange={(e) => setFormData({...formData, reminderTime: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Time Estimate (minutes)</label>
            <input
              type="number"
              min="1"
              max="240"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.timeEstimate || ''}
              onChange={(e) => setFormData({...formData, timeEstimate: parseInt(e.target.value) || undefined})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Best Time of Day</label>
            <select
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.bestTime || ''}
              onChange={(e) => setFormData({...formData, bestTime: e.target.value as 'morning' | 'afternoon' | 'evening' | undefined})}
            >
              <option value="">Any time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">XP Reward</label>
            <input
              type="number"
              min="5"
              max="50"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.xp}
              onChange={(e) => setFormData({...formData, xp: parseInt(e.target.value)})}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {editingHabit ? 'Update Habit' : 'Add Habit'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Get today's habits sorted by priority
  const todaysHabits = [...habits].sort((a, b) => a.priority - b.priority);

  // Calculate XP progress
  const xpProgress = (user.xp / user.xpToNextLevel) * 100;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`fixed w-full top-0 z-10 ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg shadow-md`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "easeInOut", repeat: 0 }}
            >
              <Activity className="w-6 h-6 text-blue-500" />
            </motion.div>
            <h1 className="text-xl font-bold">HabitFlow</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* New Reset Button */}
            <motion.button
              className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
              onClick={() => setShowResetConfirm(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </motion.button>

            {/* XP and Level */}
            <div className="hidden md:flex items-center">
              <div className="mr-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">Level {user.level}</div>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${xpProgress}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm font-medium">{user.xp}/{user.xpToNextLevel} XP</div>
            </div>
            
            {/* Streak */}
            <motion.div 
              className="flex items-center space-x-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 px-2 py-1 rounded-md"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">{user.streak}</span>
            </motion.div>
            
            {/* Notifications */}
            <div className="relative">
              <motion.button 
                className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                whileHover={{ scale: 1.1 }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </motion.button>
              
              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    ref={notificationRef}
                    className={`absolute right-0 mt-2 w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl z-20`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold">Notifications</h3>
                      <button 
                        className="text-xs text-blue-500 hover:text-blue-700"
                        onClick={clearNotifications}
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No notifications
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <motion.div 
                            key={notification.id}
                            className={`p-3 border-b border-gray-100 dark:border-gray-700 ${notification.read ? 'opacity-60' : ''}`}
                            onClick={() => markNotificationAsRead(notification.id)}
                            whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(243, 244, 246, 0.5)' }}
                          >
                            <div className="flex items-start">
                              <div className={`mt-1 mr-3 ${
                                notification.type === 'success' ? 'text-green-500' :
                                notification.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                              }`}>
                                {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                 notification.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                                 <Bell className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{notification.title}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Theme toggle */}
            <motion.button
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-300' : 'bg-blue-100 text-blue-800'}`}
              onClick={toggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-32">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-lg p-6 backdrop-blur-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-amber-500" />
              Current Streak
            </h2>
            <div className="flex items-end">
              <div className="text-3xl font-bold">{user.streak}</div>
              <div className="text-sm ml-2 text-gray-500 dark:text-gray-400">days</div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Longest streak: {user.longestStreak} days
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${(user.streak / 10) * 100}%` }}
              ></div>
            </div>
          </motion.div>
          
          <motion.div 
            className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-lg p-6 backdrop-blur-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-500" />
              Today's Progress
            </h2>
            <div className="flex items-end">
              <div className="text-3xl font-bold">
                {habits.filter(h => h.completed).length}/{habits.length}
              </div>
              <div className="text-sm ml-2 text-gray-500 dark:text-gray-400">habits completed</div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {habits.filter(h => h.completed).length === 0 
                ? "Let's get started!" 
                : habits.filter(h => h.completed).length === habits.length 
                  ? "All done for today!" 
                  : "Keep going!"}
            </div>
            
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${(habits.filter(h => h.completed).length / habits.length) * 100}%` }}
              ></div>
            </div>
          </motion.div>
          
          <motion.div 
            className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-lg p-6 backdrop-blur-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
              Level Progress
            </h2>
            <div className="flex items-end">
              <div className="text-3xl font-bold">
                {user.level}
              </div>
              <div className="text-sm ml-2 text-gray-500 dark:text-gray-400">current level</div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {user.xp}/{user.xpToNextLevel} XP to level {user.level + 1}
            </div>
            
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${(user.xp / user.xpToNextLevel) * 100}%` }}
              ></div>
            </div>
          </motion.div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex space-x-4">
            <button 
              className={`pb-2 px-1 font-medium ${activeTab === 'today' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('today')}
            >
              Today
            </button>
            <button 
              className={`pb-2 px-1 font-medium ${activeTab === 'achievements' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
            <button 
              className={`pb-2 px-1 font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            <button 
              className={`pb-2 px-1 font-medium ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </div>
        </div>
        
        {/* Today's Habits */}
        {activeTab === 'today' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Today's Habits</h2>
              <div className="flex space-x-2">
                <motion.button
                  className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => { setShowForm(true); setEditingHabit(null); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Habit</span>
                </motion.button>
                <motion.button
                  className="flex items-center space-x-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => setShowSmartSuggestions(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Suggestions</span>
                </motion.button>
              </div>
            </div>
            
            <div className="space-y-4">
              {todaysHabits.length === 0 ? (
                <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-lg p-8 text-center backdrop-blur-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex justify-center mb-4">
                    <Calendar className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first habit to start building better routines</p>
                  <motion.button
                    className="inline-flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => { setShowForm(true); setEditingHabit(null); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Habit</span>
                  </motion.button>
                </div>
              ) : (
                todaysHabits.map((habit) => (
                  <motion.div 
                    key={habit.id}
                    className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-lg backdrop-blur-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} ${habit.completed ? 'border-green-500' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(habit.id)}
                    onDragOver={(e) => handleDragOver(e, habit.id)}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ boxShadow: theme === 'dark' ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                  >
                    <div className="flex items-center p-4">
                      <motion.button 
                        className={`p-2 rounded-full mr-4 ${habit.completed ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : `${habit.color.replace('bg-', 'bg-opacity-10 text-')}`}`}
                        onClick={() => toggleHabitCompletion(habit.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {habit.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <DynamicIcon name={habit.icon} className="w-6 h-6" />
                        )}
                      </motion.button>
                      
                      <div className="flex-1 mr-4">
                        <h3 className={`font-semibold ${habit.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                          {habit.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {habit.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${habit.color.replace('bg-', 'bg-opacity-15 text-')}`}>
                            {habit.category}
                          </span>
                          
                          {habit.streak > 0 && (
                            <span className="text-xs flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                              <Sparkles className="w-3 h-3" />
                              <span>{habit.streak} day streak</span>
                            </span>
                          )}
                          
                          {habit.reminderTime && (
                            <span className="text-xs flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{habit.reminderTime}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {!habit.completed && (
                          <motion.button
                            className="p-2 text-green-500 hover:text-green-700"
                            onClick={() => setConfirmingDone(habit.id)}
                            whileHover={{ scale: 1.1 }}
                            title="Mark as done"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </motion.button>
                        )}
                        
                        <motion.button
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          onClick={() => moveHabitPriority(habit.id, 'up')}
                          whileHover={{ scale: 1.1 }}
                          disabled={habits.indexOf(habit) === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          onClick={() => moveHabitPriority(habit.id, 'down')}
                          whileHover={{ scale: 1.1 }}
                          disabled={habits.indexOf(habit) === habits.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </motion.button>
                        
                        {habit.timeEstimate && (
                          <motion.button
                            className="p-2 text-gray-500 hover:text-indigo-500"
                            onClick={() => handleAddTimeBlock(habit)}
                            whileHover={{ scale: 1.1 }}
                            title="Schedule time block"
                          >
                            <ClockIcon className="w-4 h-4" />
                          </motion.button>
                        )}
                        
                        <motion.button
                          className="p-2 text-gray-500 hover:text-blue-500"
                          onClick={() => { setEditingHabit(habit); setShowForm(true); }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button
                          className="p-2 text-gray-500 hover:text-red-500"
                          onClick={() => setShowDeleteConfirm(habit.id)}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
                      <div 
                        className={`h-full ${habit.color}`}
                        style={{ width: habit.completed ? '100%' : '0%', transition: 'width 0.5s ease-in-out' }}
                      ></div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Time Block View */}
            {timeBlocks.length > 0 && renderTimeBlockView()}

            {/* Reminders Section */}
            <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-xl shadow-lg mt-6`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Reminders</h3>
                <button 
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => setShowReminderForm(true)}
                >
                  + Add Reminder
                </button>
              </div>
              
              {reminders.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No reminders set up yet
                </p>
              ) : (
                <div className="space-y-3">
                  {reminders.map(reminder => {
                    const habit = habits.find(h => h.id === reminder.habitId);
                    return (
                      <div key={reminder.id} className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                        <div>
                          <div className="font-medium">{habit?.title || 'Unknown Habit'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Daily at {reminder.time}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={reminder.enabled}
                            onChange={() => toggleReminder(reminder.id)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Achievements */}
        {activeTab === 'achievements' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.achievements.map(achievement => (
                <motion.div 
                  key={achievement.id}
                  className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-lg p-6 backdrop-blur-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} ${achievement.unlockedAt ? 'border-amber-500' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5, boxShadow: theme === 'dark' ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-full ${achievement.unlockedAt ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                      <DynamicIcon name={achievement.icon} className="w-6 h-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-bold">{achievement.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span>{achievement.progress}/{achievement.total}</span>
                      {achievement.unlockedAt && (
                        <span className="text-amber-500">
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className={`h-full rounded-full ${achievement.unlockedAt ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
        
        {/* History */}
        {activeTab === 'history' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Habit History</h2>
            
            <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-lg p-6 backdrop-blur-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} mb-8`}>
              <div className="flex flex-wrap gap-2 mb-6">
                {[...Array(14)].map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (13 - i));
                  const dateStr = date.toISOString().split('T')[0];
                  
                  // Get habits completed on this date
                  const habitsForDate = habits.filter(habit => 
                    habit.history.some(h => h.date === dateStr && h.status === 'completed')
                  );
                  
                  const percentComplete = habits.length > 0 
                    ? (habitsForDate.length / habits.length) * 100 
                    : 0;
                  
                  let bgColor = 'bg-gray-200 dark:bg-gray-700';
                  if (percentComplete === 100) bgColor = 'bg-green-500';
                  else if (percentComplete > 50) bgColor = 'bg-green-400';
                  else if (percentComplete > 0) bgColor = 'bg-green-300';
                  
                  return (
                    <div key={dateStr} className="flex flex-col items-center">
                      <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                        {date.getDate()}
                      </div>
                      <div className="text-xs mt-1">
                        {date.toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded mr-1"></div>
                  <span>No habits</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-300 rounded mr-1"></div>
                  <span>Some habits</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
                  <span>Most habits</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                  <span>All habits</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {habits.map(habit => (
                <motion.div 
                  key={habit.id}
                  className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-xl shadow-lg p-6 backdrop-blur-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-full ${habit.color.replace('bg-', 'bg-opacity-15 text-')}`}>
                      <DynamicIcon name={habit.icon} className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-bold">{habit.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{habit.streak} day streak</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-4">
                    {[...Array(10)].map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - i);
                      const dateStr = date.toISOString().split('T')[0];
                      
                      const historyEntry = habit.history.find(h => h.date === dateStr);
                      
                      let statusClass = 'bg-gray-200 dark:bg-gray-700';
                      let statusIcon = null;
                      
                      if (historyEntry) {
                        if (historyEntry.status === 'completed') {
                          statusClass = 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
                          statusIcon = <Check className="w-3 h-3" />;
                        } else if (historyEntry.status === 'missed') {
                          statusClass = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
                          statusIcon = <X className="w-3 h-3" />;
                        }
                      }
                      
                      return (
                        <div 
                          key={dateStr}
                          className={`w-8 h-8 ${statusClass} rounded flex items-center justify-center text-xs`}
                          title={`${new Date(dateStr).toLocaleDateString()}: ${historyEntry?.status || 'no data'}`}
                        >
                          {statusIcon || date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={60}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Completed', value: habit.history.filter(h => h.status === 'completed').length },
                            { name: 'Missed', value: habit.history.filter(h => h.status === 'missed').length },
                          ]}
                          cx="99%"
                          cy="50%"
                          innerRadius={15}
                          outerRadius={25}
                          paddingAngle={5}
                          dataKey="value"
                          startAngle={180}
                          endAngle={0}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <span>Completed: {habit.history.filter(h => h.status === 'completed').length}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        <span>Missed: {habit.history.filter(h => h.status === 'missed').length}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly Completion Heatmap */}
              <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Weekly Completion</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateWeeklyCompletionData()}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Category Distribution */}
              <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Habit Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generateCategoryDistributionData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {generateCategoryDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Streak Performance */}
            <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
              <h3 className="text-lg font-semibold mb-4">Streak Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateStreakData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="currentStreak" stroke="#3b82f6" name="Current Streak" />
                  <Line type="monotone" dataKey="longestStreak" stroke="#10b981" name="Longest Streak" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
      
      {/* Add/Edit Habit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              ref={formRef}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-md mx-4`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <HabitForm />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-md mx-4`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Delete Habit</h2>
                <p>Are you sure you want to delete this habit? This action cannot be undone.</p>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    onClick={() => {
                      deleteHabit(showDeleteConfirm);
                      setShowDeleteConfirm(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Achievement Unlocked Modal */}
      <AnimatePresence>
        {showAchievement && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-md mx-4 text-center`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <DynamicIcon name={showAchievement.icon} className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
              <h3 className="text-xl font-semibold mb-2">{showAchievement.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{showAchievement.description}</p>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => setShowAchievement(null)}
              >
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Smart Suggestions Modal */}
      <AnimatePresence>
        {showSmartSuggestions && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-md mx-4`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                  Smart Suggestions
                </h2>
                <button onClick={() => setShowSmartSuggestions(false)}>
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              
              <div className="space-y-4">
                {getSmartSuggestions().map((suggestion, index) => (
                  <div key={index} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="mb-2">{suggestion.message}</p>
                    {suggestion.habit && (
                      <button 
                        className="text-sm text-blue-500 hover:text-blue-700"
                        onClick={() => {
                          setEditingHabit(suggestion.habit);
                          setShowForm(true);
                          setShowSmartSuggestions(false);
                        }}
                      >
                        Edit this habit
                      </button>
                    )}
                    {suggestion.type === 'new' && (
                      <button 
                        className="text-sm text-blue-500 hover:text-blue-700"
                        onClick={() => {
                          setShowForm(true);
                          setEditingHabit(null);
                          setShowSmartSuggestions(false);
                        }}
                      >
                        Add new habit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Time Block Modal */}
      <AnimatePresence>
        {showTimeBlockModal && selectedHabitForTimeBlock && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              ref={timeBlockRef}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-md mx-4`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h2 className="text-xl font-bold mb-4">
                Schedule Time for {selectedHabitForTimeBlock.title}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={timeBlockForm.startTime}
                    onChange={(e) => setTimeBlockForm({...timeBlockForm, startTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={timeBlockForm.endTime}
                    onChange={(e) => setTimeBlockForm({...timeBlockForm, endTime: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowTimeBlockModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={saveTimeBlock}
                  >
                    Save Time Block
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-md mx-4`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Reset All Progress</h2>
                <p>Are you sure you want to reset all your progress? This will:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
                  <li>Set all habits to incomplete</li>
                  <li>Reset all streaks to 0</li>
                  <li>Clear your XP and level</li>
                  <li>Reset all achievements</li>
                  <li>Clear your history and time blocks</li>
                </ul>
                <p className="font-medium text-red-500">This action cannot be undone!</p>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    onClick={resetAllProgress}
                  >
                    Reset Everything
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Completion Confirmation Modal */}
      <AnimatePresence>
        {confirmingDone && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-md mx-4`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="space-y-4">
                <div className="flex items-center text-amber-500">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <h2 className="text-xl font-bold">Confirm Completion</h2>
                </div>
                <p>Are you sure you want to mark this habit as done?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone. You'll earn {habits.find(h => h.id === confirmingDone)?.xp || 0} XP.
                </p>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setConfirmingDone(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    onClick={() => markHabitAsDone(confirmingDone)}
                  >
                    Mark as Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Undo Notification */}
      <AnimatePresence>
        {undoAction && (
          <motion.div 
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex items-center justify-between z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center">
              <RefreshCcw className="w-5 h-5 mr-2 text-blue-500" />
              <span>Habit {undoAction.action}d</span>
            </div>
            <button 
              className="text-blue-500 hover:text-blue-700 font-medium"
              onClick={handleUndo}
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            Offline mode - changes will sync when you're back online
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Buttons */}
      <div className="fixed bottom-4 right-4 z-10">
        <div className="flex space-x-2">
          <motion.button
            className="p-3 bg-green-500 text-white rounded-full shadow-lg"
            onClick={() => exportData('json')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Export as JSON"
          >
            <FileText className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            className="p-3 bg-purple-500 text-white rounded-full shadow-lg"
            onClick={() => exportData('csv')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Export as CSV"
          >
            <Download className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}