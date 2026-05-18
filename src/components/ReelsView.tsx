import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Music,
  User,
  Camera,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'motion/react';

interface ReelPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  video: string;
  likes: number;
  comments: number;
  shares: number;
  music?: string;
}

const ReelItem: React.FC<{ post: ReelPost; active: boolean; near: boolean }> = ({ post, active, near }) => {
  const [isPlaying, setIsPlaying] = useState(active);
  const [liked, setLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && near) {
      if (active) {
        videoRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [active, near]);

  return (
    <div className="h-full w-full relative snap-start bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={near ? post.video : ''}
        loop
        muted={false}
        playsInline
        className="h-full w-full object-cover"
        onClick={() => {
          if (videoRef.current?.paused) {
            videoRef.current.play();
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        }}
      />

      {/* Overlays */}
      <div className="absolute inset-x-0 bottom-0 p-4 pb-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
        <div className="flex justify-between items-end">
          <div className="flex-1 pr-12 pb-2">
            <div className="flex items-center gap-3 mb-3 pointer-events-auto">
              <img src={post.userAvatar} className="w-8 h-8 rounded-full border border-white/20" alt="" />
              <span className="text-sm font-bold text-white">{post.userName}</span>
              <button className="text-sm font-bold border border-white/40 px-2 py-0.5 rounded text-white ml-2">Follow</button>
            </div>
            <p className="text-sm text-white line-clamp-2 mb-3">{post.text}</p>
            <div className="flex items-center gap-2 text-white">
              <Music className="w-4 h-4" />
              <div className="overflow-hidden w-full text-xs">
                 <div className="whitespace-nowrap animate-marquee">
                   {post.music || `${post.userName} · Original audio`}
                 </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 items-center pb-2 pointer-events-auto">
             <div className="flex flex-col items-center">
                <button onClick={() => setLiked(!liked)}>
                   <Heart className={cn("w-7 h-7", liked ? "text-red-500 fill-red-500" : "text-white")} />
                </button>
                <span className="text-[11px] font-bold text-white mt-1">{post.likes}</span>
             </div>
             <div className="flex flex-col items-center">
                <MessageCircle className="w-7 h-7 text-white" />
                <span className="text-[11px] font-bold text-white mt-1">{post.comments}</span>
             </div>
             <div className="flex flex-col items-center">
                <Share2 className="w-7 h-7 text-white" />
             </div>
             <MoreHorizontal className="w-6 h-6 text-white" />
             <div className="w-7 h-7 rounded border-2 border-white/40 overflow-hidden">
                <img src={post.userAvatar} className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReelsView: React.FC = () => {
  const [reels, setReels] = useState<ReelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('video', '!=', ''),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      setReels(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReelPost)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-full w-full bg-black relative">
      <div className="absolute top-4 left-4 z-50">
         <h2 className="text-xl font-bold text-white">Reels</h2>
      </div>
      <div className="absolute top-4 right-4 z-50">
         <Camera className="w-7 h-7 text-white" />
      </div>

      <div 
        className="h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
        onScroll={(e) => {
          const idx = Math.round(e.currentTarget.scrollTop / e.currentTarget.clientHeight);
          if (idx !== activeIndex) setActiveIndex(idx);
        }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
          </div>
        ) : reels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center">
            <p className="text-zinc-500 font-bold">No reels found</p>
          </div>
        ) : (
          reels.map((reel, idx) => (
            <ReelItem 
              key={reel.id} 
              post={reel} 
              active={idx === activeIndex} 
              near={Math.abs(idx - activeIndex) <= 1} 
            />
          ))
        )}
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
