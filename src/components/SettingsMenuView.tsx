import React from 'react';
import { 
  ChevronLeft, 
  Search, 
  UserCircle, 
  ChevronRight,
  Bookmark,
  History,
  Activity,
  Bell,
  Clock,
  ExternalLink,
  BarChart3,
  Wrench,
  CreditCard,
  Lock,
  Star,
  Users,
  Ban,
  Eye,
  MessageCircle,
  AtSign,
  MessageSquare,
  Share2,
  AlertCircle,
  HelpCircle,
  Info,
  LogOut,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsMenuViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const MenuItem = ({ icon: Icon, label, sublabel, rightElement, onClick }: any) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-4 active:bg-zinc-900 transition-colors cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="text-white">
        <Icon className="w-6 h-6" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[14px] font-medium text-white">{label}</p>
        {sublabel && <p className="text-[12px] text-zinc-500 leading-tight mt-0.5">{sublabel}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {rightElement}
      <ChevronRight className="w-4 h-4 text-zinc-600" />
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 pt-6 pb-2">
    <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight">{title}</p>
  </div>
);

export const SettingsMenuView: React.FC<SettingsMenuViewProps> = ({ onBack, onLogout }) => {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[600] bg-black flex flex-col text-white"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-6 sticky top-0 bg-black z-10 border-b border-zinc-900">
        <button onClick={onBack} className="p-1">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <h2 className="text-xl font-bold">Settings and activity</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Search */}
        <div className="px-4 py-4">
          <div className="relative bg-zinc-900 rounded-xl flex items-center px-4 py-2">
            <Search className="w-4 h-4 text-zinc-500 mr-3" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent border-none p-0 text-sm w-full focus:ring-0 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Your Account */}
        <SectionHeader title="Your account" />
        <div className="bg-zinc-950/50">
          <div className="flex items-center justify-between p-4 active:bg-zinc-900 cursor-pointer">
            <div className="flex items-center gap-4">
              <UserCircle className="w-8 h-8 text-white" />
              <div>
                <p className="text-sm font-bold">Accounts Center</p>
                <p className="text-xs text-zinc-500">Password, security, personal details, ad preferences</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        {/* How you use Connectro */}
        <SectionHeader title="How you use Connectro" />
        <div className="divide-y divide-zinc-900/50">
          <MenuItem icon={Bookmark} label="Saved" />
          <MenuItem icon={History} label="Archive" />
          <MenuItem icon={Activity} label="Your activity" />
          <MenuItem icon={Bell} label="Notifications" />
          <MenuItem icon={Clock} label="Time management" />
        </div>

        {/* For professionals */}
        <SectionHeader title="For professionals" />
        <div className="divide-y divide-zinc-900/50">
          <MenuItem icon={BarChart3} label="Insights" />
          <MenuItem icon={Wrench} label="Account type and tools" />
          <MenuItem icon={CreditCard} label="Ads payments" />
        </div>

        {/* Who can see your content */}
        <SectionHeader title="Who can see your content" />
        <div className="divide-y divide-zinc-900/50">
          <MenuItem icon={Lock} label="Account privacy" rightElement={<span className="text-xs text-zinc-500">Public</span>} />
          <MenuItem icon={Star} label="Close Friends" rightElement={<span className="text-xs text-zinc-500">0</span>} />
          <MenuItem icon={Users} label="Crossposting" />
          <MenuItem icon={Ban} label="Blocked" rightElement={<span className="text-xs text-zinc-500">2</span>} />
        </div>

        {/* How others can interact with you */}
        <SectionHeader title="How others can interact with you" />
        <div className="divide-y divide-zinc-900/50">
          <MenuItem icon={MessageCircle} label="Messages and story replies" />
          <MenuItem icon={AtSign} label="Tags and mentions" />
          <MenuItem icon={MessageSquare} label="Comments" />
          <MenuItem icon={Share2} label="Sharing and reuse" />
        </div>

        {/* More info and support */}
        <SectionHeader title="More info and support" />
        <div className="divide-y divide-zinc-900/50">
          <MenuItem icon={HelpCircle} label="Help" />
          <MenuItem icon={Info} label="About" />
          <MenuItem icon={AlertCircle} label="Account Status" />
        </div>

        {/* Login */}
        <div className="mt-8 px-4 space-y-4">
          <button className="w-full flex items-center gap-3 text-blue-500 font-bold py-2">
            <Plus className="w-5 h-5" />
            Add account
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 text-red-500 font-bold py-2"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </div>
    </motion.div>
  );
};
