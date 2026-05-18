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
  Users,
  Eye,
  Heart,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, limit, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { TabType } from '../data/dummy';
import { PostCard } from './PostCard';
import { LazyImage } from './LazyImage';
import { MUSIC_OPTIONS } from '../constants';
import { StoryEditor } from './StoryEditor';
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
  const storyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [feedTab, setFeedTab] = useState<'for-you' | 'following'>('for-you');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [selectedStoryFile, setSelectedStoryFile] = useState<File | null>(null);

  // Fetch following IDs
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'follows'), 
      where('followerId', '==', user.uid),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().followingId);
      setFollowingIds(ids);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'follows'));
    return () => unsubscribe();
  }, [user]);

  // Fetch friend IDs
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'friendships'),
      where('uids', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => {
        const uids = doc.data().uids;
        return uids.find((id: string) => id !== user.uid);
      }).filter(Boolean);
      setFriendIds(ids);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'friendships'));
    return () => unsubscribe();
  }, [user]);

  // Fetch stories
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
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stories'));

    return () => unsubscribe();
  }, []);

  // Fetch posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
      setLoadingPosts(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'posts'));
    return () => unsubscribe();
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
      }, 50); 
    }
    return () => { if (storyIntervalRef.current) clearInterval(storyIntervalRef.current); };
  }, [activeStoryIndex]);

  const handleNextStory = () => {
    if (activeStoryIndex !== null) {
      if (activeStoryIndex < stories.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
      else setActiveStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
  };

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && userData) {
      if (file.type.startsWith('image/')) {
        setSelectedStoryFile(file);
      } else {
        setUploadingStory(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            await addDoc(collection(db, 'stories'), {
              userId: user.uid,
              userName: `${userData.firstName} ${userData.lastName}`,
              userAvatar: userData.avatar || '',
              image: reader.result,
              createdAt: serverTimestamp(),
              type: 'video',
              views: []
            });
          } catch (error) {
            console.error("Error adding story:", error);
          } finally {
            setUploadingStory(false);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleShareStory = async (imageDataUrl: string) => {
    if (!user || !userData) return;
    setUploadingStory(true);
    setSelectedStoryFile(null);
    try {
      await addDoc(collection(db, 'stories'), {
        userId: user.uid,
        userName: `${userData.firstName} ${userData.lastName}`,
        userAvatar: userData.avatar || '',
        image: imageDataUrl,
        createdAt: serverTimestamp(),
        type: 'image',
        views: []
      });
    } catch (error) {
      console.error("Error adding story:", error);
    } finally {
      setUploadingStory(false);
    }
  };

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <div className="flex flex-col bg-black min-h-full">
      <input 
        type="file" 
        ref={storyInputRef} 
        onChange={handleAddStory} 
        className="hidden" 
        accept="image/*,video/*"
      />

      {selectedStoryFile && (
        <StoryEditor 
          file={selectedStoryFile} 
          onShare={handleShareStory} 
          onClose={() => setSelectedStoryFile(null)} 
        />
      )}

      {/* Stories Section */}
      <section className="bg-black py-3 px-3 overflow-x-auto no-scrollbar border-b border-zinc-900">
        <div className="flex gap-4">
          {/* Your Story */}
          <div className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer" onClick={() => storyInputRef.current?.click()}>
            <div className="w-[66px] h-[66px] rounded-full p-[2px] transition-all duration-300 flex items-center justify-center relative">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-zinc-900 group">
                {userData?.avatar ? (
                  <img src={userData.avatar} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-zinc-700" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-black">
                <Plus className="w-3.5 h-3.5 text-white" strokeWidth={4} />
              </div>
              {uploadingStory && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-20">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium truncate w-full text-center">Your story</span>
          </div>

          {/* Other Stories */}
          {stories.map((story, index) => {
            if (story.userId === user?.uid) return null;
            const hasViewed = story.views?.includes(user?.uid || '');
            const isLive = index === 0 || story.isLive; // Simulating some live accounts
            
            return (
              <div 
                key={story.id} 
                className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group"
                onClick={() => setActiveStoryIndex(index)}
              >
                <div className={cn(
                  "w-[66px] h-[66px] rounded-full p-[2px] relative",
                  hasViewed ? "bg-zinc-800" : "connectro-gradient"
                )}>
                  <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-900">
                    <img src={story.userAvatar} alt={story.userName} className="w-full h-full object-cover" />
                  </div>
                  {isLive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 px-1.5 py-0.5 rounded border-2 border-black text-[8px] font-black text-white whitespace-nowrap">
                      LIVE
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-medium truncate w-full text-center">
                  {story.userName.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feed */}
      <div className="flex-1 flex flex-col pt-2">
        {loadingPosts && posts.length === 0 ? (
          <div className="flex flex-col gap-8 py-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse px-0 space-y-4">
                <div className="flex items-center gap-3 px-4">
                  <div className="w-8 h-8 bg-zinc-900 rounded-full" />
                  <div className="w-32 h-3 bg-zinc-900 rounded" />
                </div>
                <div className="w-full aspect-square bg-zinc-900" />
              </div>
            ))}
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onViewProfile={onViewProfile} />
          ))
        )}
      </div>

      {/* Story Viewer Overlay */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <div className="absolute top-4 left-0 right-0 z-10 px-3 flex flex-col gap-3">
              <div className="flex gap-1 w-full h-0.5">
                {stories.map((_, i) => (
                  <div key={i} className="h-full flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-75" 
                      style={{ 
                        width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? `${storyProgress}%` : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <img src={activeStory.userAvatar} className="w-8 h-8 rounded-full border border-white/20" />
                  <span className="text-white font-bold text-xs">{activeStory.userName}</span>
                  <span className="text-white/50 text-[10px] ml-1">
                    {(() => {
                      const diff = Date.now() - activeStory.timestamp;
                      const mins = Math.floor(diff / 60000);
                      const hours = Math.floor(mins / 60);
                      if (hours > 0) return `${hours}h`;
                      if (mins > 0) return `${mins}m`;
                      return 'Just now';
                    })()}
                  </span>
                </div>
                <button onClick={() => setActiveStoryIndex(null)} className="text-white p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative bg-zinc-900 flex items-center justify-center">
              {activeStory.type === 'video' ? (
                <video src={activeStory.image} autoPlay muted playsInline className="max-h-full w-full object-contain" />
              ) : (
                <img src={activeStory.image} className="max-h-full w-full object-contain" />
              )}
              
              <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrevStory} />
              <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNextStory} />
            </div>

            <div className="p-4 flex items-center gap-4 bg-black pb-8">
              <div className="flex-1 rounded-full border border-zinc-800 px-4 py-2 text-zinc-400 text-sm">
                Send message
              </div>
              <Heart className="w-6 h-6 text-white" />
              <Send className="w-6 h-6 text-white -rotate-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
