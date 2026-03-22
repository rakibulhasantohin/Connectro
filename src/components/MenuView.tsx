import React from 'react';
import { 
  Settings, 
  Search, 
  Clock, 
  ChevronDown, 
  Users, 
  BarChart2, 
  Flag, 
  Bookmark, 
  Calendar, 
  UserPlus, 
  HelpCircle, 
  Globe, 
  LogOut,
  User,
  Shield,
  Command,
  Video,
  Cpu
} from 'lucide-react';
import { TabType } from '../data/dummy';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { auth } from '../firebase';

interface MenuViewProps {
  setTab: (t: TabType) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({ setTab }) => {
  const { userData } = useUser();

  const handleLogout = () => {
    auth.signOut();
  };
  const shortcuts = [
    { icon: Users, label: 'Connectro Network', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { icon: BarChart2, label: 'Core Insights', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Flag, label: 'Nodes', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Bookmark, label: 'Stored Data', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Video, label: 'Live Streams', color: 'text-rose-500', bg: 'bg-rose-50' },
    { icon: Clock, label: 'Timeline', color: 'text-sky-500', bg: 'bg-sky-50' },
    { icon: Cpu, label: 'Connectro Labs', color: 'text-violet-500', bg: 'bg-violet-50' },
    { icon: UserPlus, label: 'Expand Network', color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
  ];

  const accordionItems = [
    { icon: HelpCircle, label: 'Support Center' },
    { icon: Settings, label: 'System Config' },
    { icon: Shield, label: 'Security & Privacy' },
    { icon: Globe, label: 'Connectro Ecosystem' },
  ];

  return (
    <div className="bg-zinc-50 min-h-full pb-24">
      <div className="bg-white/90 backdrop-blur-xl px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Command className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Connectro Command</h2>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90"><Settings className="w-5 h-5 text-zinc-900" /></button>
          <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90"><Search className="w-5 h-5 text-zinc-900" /></button>
        </div>
      </div>
      
      <div className="p-6 flex flex-col gap-6">
        {/* Profile Link */}
        <div 
          className="bg-white p-4 rounded-[2.5rem] shadow-sm flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-all group border border-zinc-100/80"
          onClick={() => setTab('profile')}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-50 p-0.5 group-hover:rotate-3 transition-transform">
              {userData?.avatar ? (
                <img src={userData.avatar} alt="Avatar" className="w-full h-full rounded-[1.2rem] object-cover" />
              ) : (
                <div className="w-full h-full rounded-[1.2rem] bg-zinc-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-zinc-300" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-black text-zinc-900 text-lg tracking-tight leading-none">{userData?.firstName} {userData?.lastName}</h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1.5">View Connectro Profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-zinc-100 transition-colors">
              <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
            </div>
          </div>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-2 gap-4">
          {shortcuts.map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col gap-3 cursor-pointer hover:bg-zinc-50 transition-all border border-zinc-100/80 group">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", item.bg)}>
                <item.icon className={cn("w-6 h-6", item.color)} />
              </div>
              <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest leading-tight">{item.label}</span>
            </div>
          ))}
        </div>

        <button className="w-full bg-zinc-100 text-zinc-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-sm">Expand Command List</button>

        {/* Accordion Menus */}
        <div className="flex flex-col gap-2 mt-2">
          {accordionItems.map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-zinc-50 border border-zinc-100/80 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                  <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-black text-zinc-900 uppercase tracking-widest text-[10px]">{item.label}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </div>
          ))}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest mt-4 flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95 border border-rose-100"
        >
          <LogOut className="w-4 h-4" /> Terminate Session
        </button>
      </div>
    </div>
  );
};
