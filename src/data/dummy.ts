import { 
  Home, 
  Users, 
  MonitorPlay, 
  LayoutDashboard, 
  Bell, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Calendar,
  ThumbsUp,
  Heart,
  MessageSquare
} from 'lucide-react';

export type TabType = 'home' | 'reels' | 'friends' | 'groups' | 'dashboard' | 'notifications' | 'menu' | 'profile' | 'messages';

export const CURRENT_USER = {
  name: 'Sheikh Tuhin',
  avatar: '', // Empty for new user simulation
  cover: '',  // Empty for new user simulation
  followers: '154',
  following: '474',
  posts: '7',
  bio: 'What a pity I feel for eating for myself! 🤍 ... See more',
  details: [
    { icon: Briefcase, label: 'Digital creator' },
    { icon: GraduationCap, label: 'Abdul Awal Degree College' },
    { icon: MapPin, label: 'Gazipur, Dhaka, Bangladesh' },
    { icon: Home, label: 'Netrokona' },
    { icon: Calendar, label: 'May 5' },
  ]
};

export const STORIES = [
  { 
    id: 1, 
    name: 'Create story', 
    avatar: CURRENT_USER.avatar, 
    image: CURRENT_USER.avatar, 
    isUser: true,
    timestamp: Date.now()
  },
  { 
    id: 2, 
    name: 'Your story', 
    avatar: 'https://picsum.photos/seed/user2/150/150', 
    image: 'https://picsum.photos/seed/story1/300/500', 
    isUser: false,
    timestamp: Date.now() - 3600000 // 1 hour ago
  },
  { 
    id: 3, 
    name: 'Keya Payel', 
    avatar: 'https://picsum.photos/seed/keya/150/150', 
    image: 'https://picsum.photos/seed/story2/300/500', 
    isUser: false,
    timestamp: Date.now() - 7200000 // 2 hours ago
  },
  { 
    id: 4, 
    name: 'Umme Rafia', 
    avatar: 'https://picsum.photos/seed/rafia/150/150', 
    image: 'https://picsum.photos/seed/story3/300/500', 
    isUser: false,
    timestamp: Date.now() - 86400000 + 3600000 // 23 hours ago
  },
];

export const POSTS = [
  {
    id: 1,
    user: { name: 'NEWS24', avatar: 'https://picsum.photos/seed/news24/150/150', verified: true },
    time: '3 h',
    privacy: 'Public',
    text: 'কেন ২০৩০ সালের অপেক্ষায় বিশ্ব মুসলিমরা? বিস্তারিত কমেন্টে।',
    image: 'https://picsum.photos/seed/mosque/800/600',
    likes: '4.8K',
    comments: 86,
    shares: 41
  },
  {
    id: 2,
    user: { name: 'BanglaVision', avatar: 'https://picsum.photos/seed/banglavision/150/150', verified: true },
    time: '28 m',
    privacy: 'Public',
    text: "যুদ্বের ট্যাংক চালাচ্ছেন কিম জং উনের মেয়ে, সাহসী দৃশ্যে তোলপাড়।",
    image: 'https://picsum.photos/seed/tank/800/500',
    likes: '1.2K',
    comments: 45,
    shares: 12
  },
  {
    id: 3,
    user: { name: 'Tech Insider', avatar: 'https://picsum.photos/seed/tech/150/150', verified: true },
    time: '1 h',
    privacy: 'Public',
    text: "Check out this amazing futuristic concept car! 🚗✨ #tech #future #innovation",
    video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    likes: '8.5K',
    comments: 234,
    shares: 89
  }
];

export const NOTIFICATIONS = [
  { id: 1, type: 'like', users: ['Moin Uddin', 'Ra Ra'], count: 11, text: "recently liked Ullekhjoggo's reel", time: '1h', avatar: 'https://picsum.photos/seed/notif1/100/100', icon: ThumbsUp, iconColor: 'bg-blue-500' },
  { id: 2, type: 'react', users: ['Ruqayyah Anaya Rawda'], count: 12, text: "reacted to your story. See it and view more stories.", time: '25m', avatar: 'https://picsum.photos/seed/notif2/100/100', icon: Heart, iconColor: 'bg-red-500' },
  { id: 3, type: 'comment', users: ['Hannan Mia'], text: "commented on আমাদের Ai's reel.", time: '2h', avatar: 'https://picsum.photos/seed/notif3/100/100', icon: MessageSquare, iconColor: 'bg-green-500' },
];

export const GROUPS = [
  { id: 1, name: 'Ai sob ki bhai 😑', posts: '25+ new posts', avatar: 'https://picsum.photos/seed/gp1/100/100' },
  { id: 2, name: 'হালাল বিনোদন', posts: '25+ new posts', avatar: 'https://picsum.photos/seed/gp2/100/100' },
  { id: 3, name: 'Memes That Removes Sadness', posts: '25+ new posts', avatar: 'https://picsum.photos/seed/gp3/100/100' },
  { id: 4, name: 'PMO Bangladesh - প্রধানমন্ত্রীর কার্যালয়', posts: 'Admin • 3.9K members', avatar: 'https://picsum.photos/seed/gp4/100/100', verified: true },
];

export const LIKED_USERS = [
  { id: 1, name: 'Moin Uddin', avatar: 'https://picsum.photos/seed/user1/100/100', mutual: 12 },
  { id: 2, name: 'Ra Ra', avatar: 'https://picsum.photos/seed/user2/100/100', mutual: 5 },
  { id: 3, name: 'Ruqayyah Anaya Rawda', avatar: 'https://picsum.photos/seed/user3/100/100', mutual: 8 },
  { id: 4, name: 'Hannan Mia', avatar: 'https://picsum.photos/seed/user4/100/100', mutual: 2 },
  { id: 5, name: 'Keya Payel', avatar: 'https://picsum.photos/seed/keya/150/150', mutual: 15 },
  { id: 6, name: 'Umme Rafia', avatar: 'https://picsum.photos/seed/rafia/150/150', mutual: 3 },
  { id: 7, name: 'Sheikh Tuhin', avatar: 'https://picsum.photos/seed/tuhin/150/150', mutual: 0 },
  { id: 8, name: 'BanglaVision', avatar: 'https://picsum.photos/seed/banglavision/150/150', mutual: 1 },
];

export const INSIGHTS_DATA = [
  { name: 'Feb 20', views: 100 },
  { name: 'Feb 25', views: 150 },
  { name: 'Mar 02', views: 120 },
  { name: 'Mar 04', views: 3500 },
  { name: 'Mar 06', views: 1000 },
  { name: 'Mar 08', views: 2000 },
  { name: 'Mar 11', views: 1200 },
  { name: 'Mar 16', views: 100 },
];
