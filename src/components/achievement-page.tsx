'use client';

import { motion } from 'framer-motion';
import {
  Github,
  Trophy,
  Sparkles,
  Code2,
  Zap,
  Brain,
  Server,
  Shield,
  Key,
  MessageSquare,
  Palette,
  Globe,
  Users,
  Cpu,
  Database,
  Cloud,
  Lock,
  Layers,
  Settings,
  BarChart,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Features arranged in a smart reveal sequence - starting from corners, then sides, then filling in
const features = [
  // Core features - corners first
  {
    icon: Brain,
    text: '20+ AI Models',
    color: 'from-purple-500 to-pink-600',
    position: 'top-10 left-10',
    order: 1,
  },
  {
    icon: Server,
    text: 'Local Ollama Support',
    color: 'from-green-500 to-emerald-600',
    position: 'top-10 right-10',
    order: 2,
  },
  {
    icon: Shield,
    text: 'Privacy First',
    color: 'from-red-500 to-pink-600',
    position: 'bottom-10 left-10',
    order: 3,
  },
  {
    icon: Key,
    text: 'BYOK or Our Keys',
    color: 'from-orange-500 to-yellow-600',
    position: 'bottom-10 right-10',
    order: 4,
  },

  // Key differentiators - mid positions
  {
    icon: Cpu,
    text: 'Claude Opus 4',
    color: 'from-violet-500 to-purple-600',
    position: 'top-1/4 left-20',
    order: 5,
  },
  {
    icon: Zap,
    text: 'Battery Pricing',
    color: 'from-yellow-500 to-amber-600',
    position: 'top-1/4 right-20',
    order: 6,
  },
  {
    icon: Globe,
    text: 'Web Search',
    color: 'from-teal-500 to-green-600',
    position: 'bottom-1/4 left-20',
    order: 7,
  },
  {
    icon: Palette,
    text: 'Image Generation',
    color: 'from-purple-500 to-indigo-600',
    position: 'bottom-1/4 right-20',
    order: 8,
  },

  // Additional features - filling in
  {
    icon: MessageSquare,
    text: 'Multi-Conversation',
    color: 'from-blue-500 to-cyan-600',
    position: 'top-20 left-1/3',
    order: 9,
  },
  {
    icon: Database,
    text: 'Conversation History',
    color: 'from-amber-500 to-orange-600',
    position: 'top-20 right-1/3',
    order: 10,
  },
  {
    icon: Cloud,
    text: 'Edge Deployment',
    color: 'from-sky-500 to-blue-600',
    position: 'bottom-20 left-1/3',
    order: 11,
  },
  {
    icon: Lock,
    text: 'Encrypted Storage',
    color: 'from-gray-500 to-slate-600',
    position: 'bottom-20 right-1/3',
    order: 12,
  },

  // Final details - center sides
  {
    icon: Layers,
    text: 'Model Comparison',
    color: 'from-indigo-500 to-blue-600',
    position: 'top-1/2 left-10',
    order: 13,
  },
  {
    icon: BarChart,
    text: 'Usage Analytics',
    color: 'from-cyan-500 to-teal-600',
    position: 'top-1/2 right-10',
    order: 14,
  },
  {
    icon: Settings,
    text: 'Custom Settings',
    color: 'from-emerald-500 to-teal-600',
    position: 'left-1/2 bottom-10',
    order: 15,
  },
  {
    icon: Users,
    text: 'Team Sharing',
    color: 'from-pink-500 to-rose-600',
    position: 'left-1/2 top-10',
    order: 16,
  },
];

// Typewriter component for animated text
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayedText(text.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 50); // Type one character every 50ms

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  return <span>{displayedText}</span>;
}

export default function AchievementPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-4 text-white">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />

      {/* Floating particles effect */}
      <div className="absolute inset-0">
        {mounted &&
          [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-purple-400/30"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              animate={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              transition={{
                duration: Math.random() * 10 + 20,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          ))}
      </div>

      {/* Feature widgets scattered around */}
      {features
        .sort((a, b) => a.order - b.order)
        .map((feature, index) => {
          const Icon = feature.icon;
          const baseDelay = 2000; // Start after main content (2 seconds)
          const staggerDelay = 300; // 300ms between each widget
          const animationDelay = baseDelay + index * staggerDelay;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                delay: animationDelay / 1000, // Convert to seconds
                duration: 0.8,
                type: 'spring',
                stiffness: 100,
                damping: 15,
              }}
              className={`absolute ${feature.position} hidden lg:block`}
            >
              <div className="group">
                <motion.div
                  className={`relative bg-gradient-to-br p-4 ${feature.color} transform rounded-2xl shadow-lg transition-all duration-500 hover:scale-110`}
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-black/50" />
                  <Icon className="relative z-10 h-6 w-6 text-white" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (animationDelay + 400) / 1000, // Show text 400ms after icon
                    duration: 0.5,
                  }}
                  className="mt-2 text-center text-xs whitespace-nowrap text-gray-300"
                >
                  <TypewriterText text={feature.text} delay={animationDelay + 600} />
                </motion.p>
              </div>
            </motion.div>
          );
        })}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        {/* Trophy animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.3,
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
          className="relative mb-8 inline-block"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-50 blur-3xl" />
          <Trophy className="relative z-10 h-32 w-32 text-yellow-400" />
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="h-8 w-8 text-yellow-300" />
          </motion.div>
        </motion.div>

        {/* Main title with gradient */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-4 bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 bg-clip-text text-6xl font-black text-transparent md:text-8xl"
        >
          3RD PLACE
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-12 text-2xl font-semibold text-gray-300 md:text-3xl"
        >
          T3 Cloneathon Champion
        </motion.p>

        {/* Project name with glow effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-purple-500/30 blur-2xl" />
            <h2 className="relative z-10 flex items-center justify-center gap-3 text-4xl font-bold md:text-5xl">
              <Code2 className="h-10 w-10 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                OmniChat
              </span>
              <Zap className="h-10 w-10 text-pink-400" />
            </h2>
          </div>
          <p className="mt-4 text-lg text-gray-400">
            Multi-LLM Chat Interface built for developers
          </p>
        </motion.div>

        {/* GitHub button with hover effect */}
        <motion.a
          href="https://github.com/marcusziade/omnichat"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:from-purple-500 hover:to-pink-500 hover:shadow-2xl hover:shadow-purple-500/25"
        >
          <Github className="h-6 w-6" />
          View on GitHub
        </motion.a>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-16 flex items-center justify-center gap-2 text-gray-500"
        >
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-gray-700" />
          <span className="text-sm">Built with passion</span>
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-gray-700" />
        </motion.div>
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
    </div>
  );
}
