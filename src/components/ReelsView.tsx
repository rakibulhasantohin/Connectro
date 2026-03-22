import React from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Music 
} from 'lucide-react';

export const ReelsView: React.FC = () => {
  return (
    <div className="h-[calc(100vh-120px)] bg-zinc-950 relative overflow-hidden rounded-b-[3rem]">
      <div className="absolute inset-0 flex items-center justify-center">
        <img src="https://picsum.photos/seed/reel1/800/1200" alt="Reel" className="h-full w-auto object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-zinc-950/90"></div>
      </div>
      
      {/* Reel Actions */}
      <div className="absolute right-5 bottom-32 flex flex-col gap-8 items-center z-10">
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-2xl">
            <Heart className="w-7 h-7 text-white fill-white" />
          </button>
          <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-lg">15.4K</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-2xl">
            <MessageCircle className="w-7 h-7 text-white fill-white" />
          </button>
          <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-lg">342</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-2xl">
            <Share2 className="w-7 h-7 text-white fill-white" />
          </button>
          <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-lg">1.3K</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-2xl">
            <Bookmark className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-lg">661</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors">
          <MoreHorizontal className="w-6 h-6 text-white/60" />
        </button>
      </div>

      {/* Reel Info */}
      <div className="absolute left-6 bottom-10 right-24 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <img src="https://picsum.photos/seed/tzone/50/50" alt="Avatar" className="w-11 h-11 rounded-2xl border-2 border-white/20 shadow-2xl" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-sm tracking-tight drop-shadow-lg">Connectro Flow</span>
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">@connectro_flow</span>
          </div>
          <button className="ml-2 bg-primary text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95 shadow-lg shadow-primary/25">Follow</button>
        </div>
        <p className="text-white text-sm font-medium leading-relaxed line-clamp-2 drop-shadow-lg opacity-90">
          Experience the future of social interaction with Connectro Flow. Smooth, fast, and beautiful. #connectro #flow #future
        </p>
        <div className="flex items-center gap-2 mt-4 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 w-fit">
          <Music className="w-3.5 h-3.5 text-primary" />
          <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Connectro Original Audio</span>
        </div>
      </div>
    </div>
  );
};
