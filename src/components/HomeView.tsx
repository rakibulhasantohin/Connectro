import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Smile,
  MoreHorizontal,
  X,
  Music,
  Check,
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  User, 
  Loader2,
  Music2,
  Globe,
  Camera,
  MapPin,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { TabType } from '../data/dummy';
import { PostCard } from './PostCard';
import { MUSIC_OPTIONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface HomeViewProps {
  setTab: (t: TabType) => void;
  onViewProfile: (userId: string) => void;
  isCreatePostOpen: boolean;
  setIsCreatePostOpen: (o: boolean) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  setTab, 
  onViewProfile, 
  isCreatePostOpen, 
  setIsCreatePostOpen 
}) => {
  const { userData, user } = useUser();
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const postInputRef = useRef<HTMLInputElement>(null);
  const storyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch stories from Firestore
  useEffect(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'stories'),
      where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().createdAt as Timestamp)?.toMillis() || Date.now()
      }));
      setStories(storiesData);
      setLoadingStories(false);
    }, (error) => {
      console.error("Error fetching stories:", error);
      setLoadingStories(false);
    });

    return () => unsubscribe();
  }, []);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [startY, setStartY] = useState(0);

  // Fetch posts from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [refreshTrigger]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    if (endY - startY > 100 && window.scrollY === 0) {
      setLoadingPosts(true);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Update user story with real data
  useEffect(() => {
    setStories(prev => prev.map(s => s.isUser ? { ...s, avatar: userData?.avatar, image: userData?.avatar } : s));
  }, [userData]);

  // Expiration logic: Remove stories older than 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      setStories(prev => prev.filter(s => s.isUser || (now - (s as any).timestamp < twentyFourHours)));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Story Progress logic
  useEffect(() => {
    if (activeStoryIndex !== null) {
      setStoryProgress(0);
      if (storyIntervalRef.current) clearInterval(storyIntervalRef.current);
      
      storyIntervalRef.current = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            handleNextStory();
            return 100;
          }
          return prev + 1;
        });
      }, 50); // 5 seconds total (50ms * 100)
    } else {
      if (storyIntervalRef.current) clearInterval(storyIntervalRef.current);
    }
    return () => {
      if (storyIntervalRef.current) clearInterval(storyIntervalRef.current);
    };
  }, [activeStoryIndex]);

  const handleNextStory = () => {
    if (activeStoryIndex !== null) {
      if (activeStoryIndex < stories.length - 1) {
        setActiveStoryIndex(activeStoryIndex + 1);
      } else {
        setActiveStoryIndex(null);
      }
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  const compressImage = (dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && userData) {
      setUploadingStory(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressedImage = await compressImage(reader.result as string);
          await addDoc(collection(db, 'stories'), {
            userId: user.uid,
            userName: `${userData.firstName} ${userData.lastName}`,
            userAvatar: userData.avatar || '',
            image: compressedImage,
            music: selectedMusic,
            createdAt: serverTimestamp(),
            type: file.type.startsWith('video') ? 'video' : 'image'
          });
          setSelectedMusic(null);
          setShowMusicPicker(false);
        } catch (error) {
          console.error("Error adding story:", error);
          throw new Error(JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            operationType: 'create',
            path: 'stories',
            authInfo: {
              userId: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
              isAnonymous: user.isAnonymous,
              tenantId: user.tenantId,
              providerInfo: user.providerData.map(provider => ({
                providerId: provider.providerId,
                displayName: provider.displayName,
                email: provider.email,
                photoUrl: provider.photoURL
              }))
            }
          }));
        } finally {
          setUploadingStory(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <div 
      className="flex flex-col gap-3 bg-zinc-50 pb-4 relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <input 
        type="file" 
        ref={storyInputRef} 
        onChange={handleAddStory} 
        className="hidden" 
        accept="image/*,video/*"
      />
      {/* Stories Section */}
      <div className="bg-white py-6 border-b border-zinc-100 shadow-sm">
        <div className="flex gap-4 px-6 overflow-x-auto no-scrollbar">
          {/* Create Story */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div 
              onClick={() => setShowMusicPicker(true)}
              className="relative group cursor-pointer"
            >
              <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-dashed border-zinc-200 group-hover:border-indigo-500 transition-all duration-300 flex items-center justify-center bg-zinc-50 group-hover:bg-indigo-50/30">
                {userData?.avatar ? (
                  <img src={userData.avatar} alt="Me" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                ) : (
                  <div className="w-full h-full bg-zinc-100" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              {uploadingStory && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[2rem] flex items-center justify-center z-20">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              )}
            </div>
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Connectro Story</span>
          </div>

          {/* User Stories */}
          {!loadingStories && stories.map((story, index) => (
            <div key={story.id} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div 
                onClick={() => setActiveStoryIndex(index)}
                className="w-20 h-20 rounded-[2rem] p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg shadow-indigo-100"
              >
                <div className="w-full h-full rounded-[1.75rem] border-2 border-white overflow-hidden bg-zinc-100">
                  <img src={story.userAvatar} alt={story.userName} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-[11px] font-black text-zinc-900 truncate w-20 text-center">
                {story.userName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Post Section */}
      <div className="bg-white p-6 mb-1 border-b border-zinc-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0 border-2 border-white shadow-md">
            {userData?.avatar ? (
              <img src={userData.avatar} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                <User className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsCreatePostOpen(true)}
            className="flex-1 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 text-left px-5 py-3.5 rounded-2xl transition-all text-sm font-bold border border-zinc-100 active:scale-[0.99]"
          >
            What's on your mind, {userData?.firstName || 'Connectro'}?
          </button>
        </div>
        <div className="flex items-center justify-between pt-2">
          <button 
            onClick={() => { setIsCreatePostOpen(true); setTimeout(() => postInputRef.current?.click(), 100); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-zinc-50 transition-all group active:scale-95"
          >
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors shadow-sm shadow-emerald-100/50">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-black text-zinc-600 uppercase tracking-tight">Photo</span>
          </button>
          <button 
            onClick={() => { setIsCreatePostOpen(true); setTimeout(() => postInputRef.current?.click(), 100); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-zinc-50 transition-all group active:scale-95"
          >
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors shadow-sm shadow-indigo-100/50">
              <Video className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-black text-zinc-600 uppercase tracking-tight">Video</span>
          </button>
          <button 
            onClick={() => setIsCreatePostOpen(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-zinc-50 transition-all group active:scale-95"
          >
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors shadow-sm shadow-rose-100/50">
              <Smile className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-xs font-black text-zinc-600 uppercase tracking-tight">Feeling</span>
          </button>
        </div>
      </div>

      {/* Music Picker Modal */}
      {showMusicPicker && (
        <div className="fixed inset-0 z-[250] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-zinc-100">
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-zinc-900">Connectro Music</h3>
              <button onClick={() => setShowMusicPicker(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar">
              {MUSIC_OPTIONS.map(music => (
                <div 
                  key={music.id}
                  onClick={() => setSelectedMusic(music.title)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200",
                    selectedMusic === music.title 
                      ? "bg-indigo-50 border-2 border-indigo-500 shadow-sm" 
                      : "hover:bg-zinc-50 border-2 border-transparent"
                  )}
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                    <Music2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-zinc-900">{music.title}</p>
                    <p className="text-xs text-zinc-500 font-bold">{music.artist}</p>
                  </div>
                  {selectedMusic === music.title && (
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm text-zinc-600 font-bold bg-white p-3 rounded-xl border border-zinc-100">
                <Music className="w-4 h-4 text-indigo-500" />
                <span>{selectedMusic ? `Selected: ${selectedMusic}` : 'No music selected'}</span>
              </div>
              <button 
                disabled={uploadingStory}
                onClick={() => storyInputRef.current?.click()}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {uploadingStory ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                Select Photo/Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center"
          >
            <div className="absolute top-6 left-6 right-6 z-10 flex flex-col gap-4">
              <div className="flex gap-1.5 w-full">
                {stories.map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-75" 
                      style={{ 
                        width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? `${storyProgress}%` : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl border-2 border-white/20 overflow-hidden shadow-xl">
                    {activeStory.userAvatar ? (
                      <img src={activeStory.userAvatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <User className="w-6 h-6 text-zinc-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-black text-sm tracking-tight">{activeStory.userName}</span>
                    <span className="text-white/50 text-[10px] font-black uppercase tracking-widest">
                      {(() => {
                        const diff = Date.now() - activeStory.timestamp;
                        const mins = Math.floor(diff / 60000);
                        const hours = Math.floor(mins / 60);
                        if (hours > 0) return `${hours}h ago`;
                        if (mins > 0) return `${mins}m ago`;
                        return 'Just now';
                      })()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activeStory.music && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl text-white text-xs font-black border border-white/10">
                      <Music className="w-3 h-3 text-indigo-400 animate-pulse" />
                      <span>{activeStory.music}</span>
                    </div>
                  )}
                  <button onClick={() => setActiveStoryIndex(null)} className="p-3 text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative w-full h-full max-w-lg flex items-center justify-center p-4">
              <div className="w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 relative">
                {(activeStory as any).type === 'video' ? (
                  <video 
                    src={activeStory.image} 
                    autoPlay 
                    className="w-full h-full object-cover" 
                    onEnded={handleNextStory}
                  />
                ) : (
                  <img src={activeStory.image} className="w-full h-full object-cover" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
              </div>
              
              <button 
                onClick={handlePrevStory}
                className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl text-white transition-all active:scale-90 border border-white/10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={handleNextStory}
                className="absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl text-white transition-all active:scale-90 border border-white/10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="flex flex-col gap-4 px-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-black text-zinc-900 tracking-tighter">All posts</h3>
          <button 
            onClick={() => { setLoadingPosts(true); setRefreshTrigger(prev => prev + 1); }}
            className="bg-zinc-100 px-4 py-2 rounded-xl font-black text-xs text-zinc-900 hover:bg-zinc-200"
          >
            Refresh
          </button>
        </div>
        {loadingPosts ? (
          <div className="bg-white p-12 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 shadow-sm border border-zinc-100">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <span className="text-zinc-500 font-black text-sm uppercase tracking-widest">Connectro Feed Loading</span>
          </div>
        ) : posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.id} post={post} onViewProfile={onViewProfile} />
          ))
        ) : (
          <div className="bg-white p-16 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 shadow-sm text-center border border-zinc-100">
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center shadow-inner">
              <Globe className="w-10 h-10 text-zinc-200" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900">Your Connectro is Empty</h3>
              <p className="text-zinc-400 max-w-[250px] mx-auto mt-2 font-medium">Follow some creators or share your first moment to build your feed.</p>
            </div>
            <button 
              onClick={() => setTab('dashboard')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Explore Creators
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
