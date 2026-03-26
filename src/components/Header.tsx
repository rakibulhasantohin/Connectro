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

  return (
    <div className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-zinc-100/80">
      <div className="flex justify-between items-center px-5 py-4">
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={() => setTab('home')}
        >
          <h1 className="text-2xl font-black text-primary italic tracking-tight">
            Connectro
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-zinc-700 hover:text-primary transition-colors active:scale-90">
            <Search className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
