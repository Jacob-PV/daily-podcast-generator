import { Topic } from '@/types';

export const topics: Topic[] = [
  {
    id: 'technology',
    name: 'Technology',
    icon: '🚀',
    color: '#3B82F6',
    category: 'Tech & Science',
  },
  {
    id: 'ai',
    name: 'AI & Machine Learning',
    icon: '🤖',
    color: '#8B5CF6',
    category: 'Tech & Science',
  },
  {
    id: 'science',
    name: 'Science',
    icon: '🔬',
    color: '#06B6D4',
    category: 'Tech & Science',
  },
  {
    id: 'business',
    name: 'Business & Finance',
    icon: '📈',
    color: '#10B981',
    category: 'Business',
  },
  {
    id: 'startups',
    name: 'Startups',
    icon: '💡',
    color: '#F59E0B',
    category: 'Business',
  },
  {
    id: 'crypto',
    name: 'Crypto & Web3',
    icon: '💰',
    color: '#EAB308',
    category: 'Business',
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    icon: '💪',
    color: '#EC4899',
    category: 'Lifestyle',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: '⚽',
    color: '#EF4444',
    category: 'Entertainment',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎬',
    color: '#F97316',
    category: 'Entertainment',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    color: '#A855F7',
    category: 'Entertainment',
  },
  {
    id: 'world',
    name: 'World News',
    icon: '🌍',
    color: '#14B8A6',
    category: 'News',
  },
  {
    id: 'politics',
    name: 'Politics',
    icon: '🏛️',
    color: '#6366F1',
    category: 'News',
  },
];

export const getTopicById = (id: string): Topic | undefined => {
  return topics.find((topic) => topic.id === id);
};

export const getTopicsByIds = (ids: string[]): Topic[] => {
  return topics.filter((topic) => ids.includes(topic.id));
};
