import React from 'react';
import { 
  Settings, 
  ChevronRight, 
  Users, 
  Store, 
  Bookmark, 
  Calendar, 
  History,
  Megaphone,
  Heart,
  HelpCircle,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { TabType } from '../data/dummy';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { auth } from '../firebase';
import { LazyImage } from './LazyImage';

interface MenuViewProps {
  setTab: (t: TabType) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({ setTab }) => {
  const { userData } = useUser();

  const handleLogout = () => {
    auth.signOut();
  };

  const shortcuts = [
    { icon: Users, label: 'Friends', color: 'text-blue-600', bg: 'bg-blue-50', tab: 'friends' as TabType },
    { icon: Users, label: 'Groups', color: 'text-indigo-600', bg: 'bg-indigo-50', tab: 'groups' as TabType },
    { icon: Store, label: 'Market', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Bookmark, label: 'Saved', color: 'text-rose-600', bg: 'bg-rose-50' },
    { icon: History, label: 'Memories', color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Calendar, label: 'Events', color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="bg-[#F0F2F5] min-h-full pb-24 font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <LazyImage 
            src={userData?.avatar} 
            alt="Avatar" 
            containerClassName="w-10 h-10 rounded-full overflow-hidden border border-zinc-200" 
          />
          <h2 className="text-xl font-bold text-primary tracking-tight">Digital Curator</h2>
        </div>
        <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <Settings className="w-6 h-6 text-zinc-600" />
        </button>
      </div>
      
      <div className="p-4 flex flex-col gap-4">
        {/* Profile Card */}
        <div 
          className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-all border border-transparent active:scale-[0.98]"
          onClick={() => setTab('profile')}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <LazyImage 
                src={userData?.avatar} 
                alt="Avatar" 
                containerClassName="w-16 h-16 rounded-full overflow-hidden border border-zinc-100" 
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-lg leading-tight">
                {userData?.firstName} {userData?.lastName}
              </h3>
              <p className="text-zinc-500 text-sm font-medium">View Profile</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-zinc-400" />
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map((item, i) => (
            <div 
              key={i} 
              onClick={() => item.tab && setTab(item.tab)}
              className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-3 cursor-pointer hover:bg-zinc-50 transition-all active:scale-[0.97] group"
            >
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", item.bg)}>
                <item.icon className={cn("w-6 h-6", item.color)} />
              </div>
              <span className="font-bold text-zinc-800 text-sm">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Community Tools */}
        <div className="mt-2">
          <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1">Community Tools</h4>
          <div className="flex flex-col gap-2">
            <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-all active:scale-[0.99]">
              <div className="w-10 h-10 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-bold text-zinc-800">Ad Center</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-all active:scale-[0.99]">
              <div className="w-10 h-10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-bold text-zinc-800">Fundraisers</span>
            </div>
          </div>
        </div>

        {/* Settings & Support */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-2">
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 border-b border-zinc-50 transition-all">
            <div className="flex items-center gap-4">
              <Settings className="w-6 h-6 text-zinc-500" />
              <span className="font-bold text-zinc-800">Settings & Privacy</span>
            </div>
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-all">
            <div className="flex items-center gap-4">
              <HelpCircle className="w-6 h-6 text-zinc-500" />
              <span className="font-bold text-zinc-800">Help & Support</span>
            </div>
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-zinc-200 text-zinc-800 py-4 rounded-2xl font-bold text-base mt-2 hover:bg-zinc-300 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

