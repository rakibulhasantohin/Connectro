import React from 'react';
import { 
  Menu, 
  Plus, 
  Search, 
  MessageCircle, 
  Home, 
  Video, 
  Users, 
  LayoutDashboard, 
  Bell,
  User,
  Hexagon,
  UserPlus
} from 'lucide-react';
import { TabType } from '../data/dummy';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';

interface HeaderProps {
  currentTab: TabType;
  setTab: (t: TabType) => void;
  onPlusClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setTab, onPlusClick }) => {
  const { userData } = useUser();
  const tabs = [
    { id: 'home', icon: Home },
    { id: 'reels', icon: Video },
    { id: 'friends', icon: UserPlus },
    { id: 'groups', icon: Users },
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'notifications', icon: Bell },
    { id: 'profile', icon: userData?.avatar, isAvatar: true },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-zinc-100/80">
      <div className="flex justify-between items-center px-5 py-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90 cursor-pointer group"
            onClick={() => setTab('menu')}
          >
            <Menu className="w-5 h-5 text-zinc-600 group-hover:text-primary transition-colors" />
          </div>
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => setTab('home')}
          >
            <div className="w-9 h-9 bg-primary rounded-[14px] flex items-center justify-center shadow-lg shadow-primary/25 group-hover:rotate-12 transition-all duration-500">
              <Hexagon className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">
              Connectro
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={onPlusClick}
            className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90"
          >
            <Plus className="w-5 h-5 text-zinc-900" />
          </button>
          <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90">
            <Search className="w-5 h-5 text-zinc-900" />
          </button>
          <button 
            onClick={() => setTab('messages')}
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 relative",
              currentTab === 'messages' ? "bg-primary/10 text-primary" : "bg-zinc-50 hover:bg-zinc-100 text-zinc-900"
            )}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white"></span>
          </button>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex justify-between items-center px-3 pb-2">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setTab(tab.id as TabType)}
            className={cn(
              "flex-1 flex justify-center items-center py-3.5 relative transition-all group",
              currentTab === tab.id ? "text-primary" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            {tab.isAvatar ? (
              <div className={cn(
                "w-9 h-9 rounded-[14px] overflow-hidden border-2 transition-all flex items-center justify-center bg-zinc-100",
                currentTab === tab.id ? "border-primary shadow-lg shadow-primary/15 scale-110" : "border-transparent"
              )}>
                {tab.icon ? (
                  <img src={tab.icon as string} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-zinc-400" />
                )}
              </div>
            ) : (
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-300",
                currentTab === tab.id ? "bg-primary/10 scale-110" : "group-hover:bg-zinc-50"
              )}>
                <tab.icon className="w-6 h-6" strokeWidth={currentTab === tab.id ? 2.5 : 2} />
              </div>
            )}
            {currentTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
