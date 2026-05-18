import React from 'react';
import { 
  PlusSquare, 
  Heart, 
  ChevronDown
} from 'lucide-react';
import { TabType } from '../data/dummy';
import { cn } from '../lib/utils';

interface HeaderProps {
  currentTab: TabType;
  setTab: (t: TabType) => void;
  onPlusClick?: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setTab, onPlusClick, onLogoClick }) => {
  if (currentTab === 'messages') return null; // Messages view has its own header

  return (
    <div className="bg-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-900/50">
      <div className="flex justify-between items-center px-4 h-12">
        <div className="flex items-center gap-1 cursor-pointer" onClick={onLogoClick || (() => setTab('home'))}>
          <h1 className="font-script text-2xl text-white pt-1">
            Connectro
          </h1>
          <ChevronDown className="w-4 h-4 text-white mt-1" />
        </div>
        
        <div className="flex items-center gap-5">
          <button 
            onClick={onPlusClick}
            className="text-white active:scale-90 transition-transform"
          >
            <PlusSquare className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setTab('notifications')}
            className={cn(
              "text-white active:scale-90 transition-transform relative",
              currentTab === 'notifications' && "text-white"
            )}
          >
            <Heart className="w-6 h-6" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-black shadow-sm"></div>
          </button>
        </div>
      </div>
    </div>
  );
};
