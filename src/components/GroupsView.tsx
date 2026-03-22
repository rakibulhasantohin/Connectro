import React from 'react';
import { Plus, Settings, Search, MoreHorizontal, CheckCircle, Users } from 'lucide-react';
import { GROUPS } from '../data/dummy';
import { cn } from '../lib/utils';

export const GroupsView: React.FC = () => {
  return (
    <div className="bg-white min-h-full pb-24">
      <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-50 sticky top-0 bg-white/90 backdrop-blur-xl z-10">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Hubs</h2>
        <div className="flex gap-2.5">
          <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90"><Plus className="w-5 h-5 text-zinc-900" /></button>
          <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90"><Settings className="w-5 h-5 text-zinc-900" /></button>
          <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90"><Search className="w-5 h-5 text-zinc-900" /></button>
        </div>
      </div>
      <div className="flex gap-3 px-6 py-4 border-b border-zinc-50 overflow-x-auto no-scrollbar bg-white sticky top-[65px] z-10">
        {['Discover', 'Your Hubs', 'Recent', 'Trending'].map((tab, i) => (
          <button key={i} className={cn(
            "px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95",
            i === 1 ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
          )}>
            {tab}
          </button>
        ))}
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">Active Hubs</h3>
          <button className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 rounded-xl transition-colors"><MoreHorizontal className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {GROUPS.map(gp => (
            <div key={gp.id} className="flex items-center gap-4 cursor-pointer hover:bg-zinc-50 p-3 rounded-[2rem] transition-all group border border-transparent hover:border-zinc-100">
              {gp.avatar ? (
                <img src={gp.avatar} alt={gp.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-50 group-hover:border-primary/20 transition-all" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center border-2 border-zinc-50">
                  <Users className="w-8 h-8 text-zinc-300" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-zinc-900 tracking-tight group-hover:text-primary transition-colors">{gp.name}</h4>
                  {gp.verified && (
                    <div className="w-4 h-4 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                  <span>{gp.posts} posts today</span>
                  <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
              <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
