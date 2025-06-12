// Simplified battery-based pricing system - Focus on battery amounts only

export interface SimpleBatteryPlan {
  name: string;
  price: number;
  totalBattery: number;
  dailyBattery: number; // totalBattery / 30
  description: string;
  estimatedChats: {
    budget: number; // daily chats with budget models
    premium: number; // daily chats with premium models
  };
}

// Simplified plans focusing on battery amounts
export const SIMPLE_BATTERY_PLANS: SimpleBatteryPlan[] = [
  {
    name: 'Starter',
    price: 4.99,
    totalBattery: 6000,
    dailyBattery: 200, // 200 BU per day
    description: '200 battery units per day',
    estimatedChats: {
      budget: 40, // with DeepSeek/Nano
      premium: 4, // with GPT-4.1
    },
  },
  {
    name: 'Daily',
    price: 12.99,
    totalBattery: 18000,
    dailyBattery: 600, // 600 BU per day
    description: '600 battery units per day',
    estimatedChats: {
      budget: 120,
      premium: 12,
    },
  },
  {
    name: 'Power',
    price: 29.99,
    totalBattery: 45000,
    dailyBattery: 1500, // 1,500 BU per day
    description: '1,500 battery units per day',
    estimatedChats: {
      budget: 300,
      premium: 30,
    },
  },
  {
    name: 'Ultimate',
    price: 79.99,
    totalBattery: 150000,
    dailyBattery: 5000, // 5,000 BU per day
    description: '5,000 battery units per day',
    estimatedChats: {
      budget: 1000,
      premium: 100,
    },
  },
];

// Simple battery top-up options
export const SIMPLE_BATTERY_TOPUPS = [
  {
    units: 1000,
    price: 1.49,
    label: 'Quick Boost',
    description: '~20 GPT-4.1 mini chats',
  },
  {
    units: 5000,
    price: 5.99,
    label: 'Week Pack',
    description: '~100 GPT-4.1 mini chats',
  },
  {
    units: 15000,
    price: 14.99,
    label: 'Month Pack',
    description: '~300 GPT-4.1 mini chats',
    popular: true,
  },
  {
    units: 50000,
    price: 44.99,
    label: 'Mega Pack',
    description: '~1000 GPT-4.1 mini chats',
  },
];
