import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Globe, 
  MoreHorizontal, 
  X, 
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ThumbsUp,
  BadgeCheck,
  User,
  Check,
  Edit2,
  Laugh,
  Sparkles,
  Angry,
  Lock,
  Users as UsersIcon,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useUser } from '../contexts/UserContext';
import { doc, updateDoc, addDoc, collection, Timestamp, increment, deleteDoc, onSnapshot, query, setDoc, getDocs } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

interface ReactionData {
  userId: string;
  userName: string;
  userAvatar: string;
  type: string;
}

interface PostCardProps {
  post: {
    id: string | number;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    user?: { name: string; avatar: string; verified?: boolean };
    createdAt?: string;
    time?: string;
    privacy: string;
    text: string;
    image?: string;
    video?: string;
    likes: number | string;
    comments: number;
    shares: number;
  };
  onViewProfile?: (userId: string) => void;
}

const REACTION_TYPES = [
  { type: 'like', icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Like' },
  { type: 'love', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Love' },
  { type: 'haha', icon: Laugh, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Haha' },
  { type: 'wow', icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Wow' },
  { type: 'angry', icon: Angry, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Angry' },
];

export const PostCard: React.FC<PostCardProps> = ({ post, onViewProfile }) => {
  const { userData } = useUser();
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(post.text);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Normalize data
  const displayName = post.user?.name || post.userName || 'Unknown User';
  const displayAvatar = post.user?.avatar || post.userAvatar || '';
  const isVerified = post.user?.verified || false;
  const postUserId = post.userId;
  const isOwner = postUserId === auth.currentUser?.uid;

  useEffect(() => {
    if (!auth.currentUser) return;
    const savedRef = doc(db, 'users', auth.currentUser.uid, 'savedPosts', post.id.toString());
    const unsubscribe = onSnapshot(savedRef, (doc) => {
      setIsSaved(doc.exists());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/savedPosts/${post.id}`);
    });
    return () => unsubscribe();
  }, [post.id]);

  useEffect(() => {
    const reactionsRef = collection(db, 'posts', post.id.toString(), 'reactions');
    const q = query(reactionsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reactionsData: ReactionData[] = [];
      let currentUserReaction: string | null = null;
      
      snapshot.forEach((doc) => {
        const data = doc.data() as ReactionData;
        reactionsData.push(data);
        if (data.userId === auth.currentUser?.uid) {
          currentUserReaction = data.type;
        }
      });
      
      setReactions(reactionsData);
      setUserReaction(currentUserReaction);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `posts/${post.id}/reactions`);
    });

    return () => unsubscribe();
  }, [post.id]);

  const createNotification = async (type: string) => {
    if (!auth.currentUser || isOwner || !postUserId) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        toUserId: postUserId,
        fromUserId: auth.currentUser.uid,
        fromUserName: userData?.firstName + ' ' + userData?.lastName,
        fromUserAvatar: userData?.avatar || '',
        type,
        postId: post.id.toString(),
        createdAt: Timestamp.now(),
        read: false
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const handleReaction = async (type: string) => {
    if (!auth.currentUser) return;
    setShowReactionPicker(false);

    const reactionRef = doc(db, 'posts', post.id.toString(), 'reactions', auth.currentUser.uid);
    const postRef = doc(db, 'posts', post.id.toString());

    try {
      if (userReaction === type) {
        // Remove reaction
        await deleteDoc(reactionRef);
        await updateDoc(postRef, {
          likes: increment(-1)
        });
      } else {
        // Add or change reaction
        const isNew = !userReaction;
        await setDoc(reactionRef, {
          userId: auth.currentUser.uid,
          userName: userData?.firstName + ' ' + userData?.lastName,
          userAvatar: userData?.avatar || '',
          type,
          createdAt: Timestamp.now()
        });

        if (isNew) {
          await updateDoc(postRef, {
            likes: increment(1)
          });
          await createNotification(type);
        }
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const handleLikeClick = () => {
    if (userReaction) {
      handleReaction(userReaction);
    } else {
      handleReaction('love');
    }
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionPicker(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleComment = async () => {
    try {
      await updateDoc(doc(db, 'posts', post.id.toString()), {
        comments: increment(1)
      });
      await createNotification('comment');
    } catch (error) {
      console.error("Error commenting:", error);
    }
  };

  const handleShare = async () => {
    try {
      await updateDoc(doc(db, 'posts', post.id.toString()), {
        shares: increment(1)
      });
      await createNotification('share');
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleToggleSave = async () => {
    if (!auth.currentUser) return;
    const savedRef = doc(db, 'users', auth.currentUser.uid, 'savedPosts', post.id.toString());
    try {
      if (isSaved) {
        await deleteDoc(savedRef);
      } else {
        await setDoc(savedRef, {
          savedAt: Timestamp.now(),
          postId: post.id.toString()
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'posts', post.id.toString()), {
        text: editedText
      });
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleUpdatePrivacy = async (newPrivacy: string) => {
    try {
      await updateDoc(doc(db, 'posts', post.id.toString()), {
        privacy: newPrivacy
      });
      setShowPrivacyMenu(false);
      setShowMenu(false);
    } catch (error) {
      console.error("Error updating privacy:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    if (!postUserId) return;

    try {
      await deleteDoc(doc(db, 'posts', post.id.toString()));
      
      // Decrement postCount in user document
      const userRef = doc(db, 'users', postUserId);
      await updateDoc(userRef, {
        postCount: increment(-1)
      });
      
      setShowMenu(false);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };
  
  const formatTime = (dateValue?: any) => {
    if (!dateValue) return post.time || 'Just now';
    try {
      let date: Date;
      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      } else {
        date = new Date(dateValue);
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
      return date.toLocaleDateString();
    } catch (e) {
      return post.time || 'Just now';
    }
  };

  const displayTime = formatTime(post.createdAt);

  const formatCount = (count: number | string) => {
    if (typeof count === 'string') return count;
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  const displayLikes = formatCount(reactions.length);
  
  // Video states
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleProfileClick = () => {
    if (onViewProfile && postUserId) {
      onViewProfile(postUserId);
    }
  };

  const currentUserReactionData = REACTION_TYPES.find(r => r.type === userReaction);
  const CurrentReactionIcon = currentUserReactionData?.icon || Heart;

  return (
    <article className="bg-white rounded-[2rem] shadow-sm border border-zinc-100/80 mb-4 overflow-hidden mx-4">
      <div className="flex justify-between items-center px-5 py-4">
        <div className="flex items-center gap-3">
          <div onClick={handleProfileClick} className="cursor-pointer group relative">
            <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden bg-zinc-100 border border-zinc-200/50 group-hover:border-primary/50 transition-colors">
              {displayAvatar ? (
                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 
                onClick={handleProfileClick}
                className="text-[15px] font-bold text-zinc-900 leading-tight hover:text-primary cursor-pointer transition-colors"
              >
                {displayName}
              </h3>
              {isVerified && (
                <BadgeCheck className="w-4 h-4 text-primary fill-primary/10" />
              )}
            </div>
            <div className="flex items-center text-xs text-zinc-500 font-medium gap-1.5 mt-0.5">
              <span>{displayTime}</span>
              <span>•</span>
              {post.privacy === 'public' && <Globe className="w-3 h-3" />}
              {post.privacy === 'friends' && <UsersIcon className="w-3 h-3" />}
              {post.privacy === 'private' && <Lock className="w-3 h-3" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleToggleSave}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90",
              isSaved ? "text-amber-500 bg-amber-50" : "text-zinc-400 hover:bg-zinc-50"
            )}
          >
            <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-zinc-50 text-zinc-400 transition-all active:scale-90"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && isOwner && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 p-1 z-50">
                <button 
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" /> Edit Text
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Privacy
                    </div>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {showPrivacyMenu && (
                    <div className="absolute right-full top-0 mr-2 w-40 bg-white rounded-xl shadow-xl border border-zinc-100 p-1">
                      <button 
                        onClick={() => handleUpdatePrivacy('public')}
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-2 text-xs font-bold rounded-lg",
                          post.privacy === 'public' ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        <Globe className="w-3 h-3" /> Public
                      </button>
                      <button 
                        onClick={() => handleUpdatePrivacy('friends')}
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-2 text-xs font-bold rounded-lg",
                          post.privacy === 'friends' ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        <UsersIcon className="w-3 h-3" /> Friends
                      </button>
                      <button 
                        onClick={() => handleUpdatePrivacy('private')}
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-2 text-xs font-bold rounded-lg",
                          post.privacy === 'private' ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        <Lock className="w-3 h-3" /> Private
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" /> Delete Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 text-[15px] text-zinc-800 leading-relaxed whitespace-pre-wrap">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="text-sm text-zinc-500 hover:text-zinc-700">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-1 text-sm text-primary font-bold hover:text-primary-hover">
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        ) : (
          post.text
        )}
      </div>

      {post.image && (
        <div className="px-3 pb-3">
          <div className="w-full bg-zinc-100 rounded-[1.5rem] overflow-hidden relative group cursor-pointer">
            <img 
              src={post.image} 
              alt="Post" 
              loading="lazy"
              className="w-full h-auto max-h-[500px] object-cover transition-transform duration-1000 ease-out group-hover:scale-105" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
          </div>
        </div>
      )}

      {post.video && (
        <div className="px-3 pb-3">
          <div className="w-full bg-black rounded-[1.5rem] overflow-hidden relative group aspect-video flex items-center justify-center">
            <video 
              ref={videoRef}
              src={post.video} 
              className="w-full h-full object-contain cursor-pointer"
              muted={isMuted}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                setProgress(0);
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
            />
            
            {!isPlaying && (
              <button 
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors z-10"
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transform transition-transform hover:scale-110 active:scale-95">
                  <Play className="w-6 h-6 text-white fill-current ml-1" />
                </div>
              </button>
            )}

            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <div className="px-4 py-3 flex flex-col gap-2">
                <div className="relative w-full h-1 group/progress mb-1">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={handleProgressChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                  />
                  <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary relative transition-all duration-75" 
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform z-40" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-primary transition-colors">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="text-white text-xs font-bold tracking-tight">
                    {videoRef.current && !isNaN(videoRef.current.duration) ? 
                      `${Math.floor(videoRef.current.currentTime / 60)}:${Math.floor(videoRef.current.currentTime % 60).toString().padStart(2, '0')} / ${Math.floor(videoRef.current.duration / 60)}:${Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0')}` 
                      : '0:00 / 0:00'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(reactions.length > 0 || Number(post.comments) > 0 || Number(post.shares) > 0) && (
        <div className="px-5 py-3 flex justify-between items-center text-zinc-500 text-[13px] border-t border-zinc-50">
          <div className="flex items-center gap-4">
            {reactions.length > 0 && (
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setShowLikes(true)}
              >
                <div className="flex -space-x-1.5">
                  {Array.from(new Set(reactions.map(r => r.type))).slice(0, 3).map((type, idx) => {
                    const rData = REACTION_TYPES.find(r => r.type === type);
                    const Icon = rData?.icon || Heart;
                    return (
                      <div 
                        key={type} 
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm",
                          rData?.bg || 'bg-rose-500'
                        )}
                        style={{ zIndex: 10 - idx }}
                      >
                        <Icon className={cn("w-2.5 h-2.5 fill-current", rData?.color || 'text-white')} />
                      </div>
                    );
                  })}
                </div>
                <span className="font-bold text-zinc-600 group-hover:text-primary transition-colors text-xs">
                  {userReaction ? (
                    reactions.length === 1 ? 'You' : `You and ${formatCount(reactions.length - 1)} others`
                  ) : (
                    formatCount(reactions.length)
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-4 font-bold text-zinc-400 text-xs">
            {Number(post.comments) > 0 && (
              <span className="hover:text-zinc-600 cursor-pointer">{formatCount(post.comments)} comments</span>
            )}
            {Number(post.shares) > 0 && (
              <span className="hover:text-zinc-600 cursor-pointer">{formatCount(post.shares)} shares</span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center px-3 py-2 border-t border-zinc-100/80 relative">
        {showReactionPicker && (
          <div 
            className="absolute bottom-full left-4 mb-2 bg-white rounded-full shadow-2xl border border-zinc-100 p-1.5 flex gap-1.5 animate-in slide-in-from-bottom-4 duration-200 z-[60]"
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            {REACTION_TYPES.map((r) => (
              <button
                key={r.type}
                onClick={() => handleReaction(r.type)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-125 active:scale-90",
                  r.bg
                )}
              >
                <r.icon className={cn("w-5 h-5 fill-current", r.color)} />
              </button>
            ))}
          </div>
        )}
        <button 
          onClick={handleLikeClick}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={cn(
            "flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl transition-all active:scale-95",
            userReaction ? (currentUserReactionData?.bg || "bg-rose-50") : "text-zinc-500 hover:bg-zinc-50"
          )}
        >
          <CurrentReactionIcon className={cn("w-5 h-5", userReaction && (currentUserReactionData?.color || "text-rose-500 fill-current"))} />
          <span className={cn("text-xs font-bold", userReaction && (currentUserReactionData?.color || "text-rose-500"))}>
            {currentUserReactionData?.label || 'Like'}
          </span>
        </button>
        <button 
          onClick={handleComment}
          className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl hover:bg-zinc-50 text-zinc-500 transition-all active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-bold">Comment</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl hover:bg-zinc-50 text-zinc-500 transition-all active:scale-95"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-xs font-bold">Share</span>
        </button>
      </div>

      {/* Likes Modal Redesign */}
      {showLikes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100">
              <div className="flex gap-6">
                <button className="text-primary font-black border-b-2 border-primary pb-2 text-xs uppercase tracking-widest">All</button>
                <div className="flex items-center gap-2 text-zinc-400 font-bold pb-2 text-xs cursor-pointer hover:text-zinc-600 transition-colors uppercase tracking-widest">
                  <div className="w-4 h-4 rounded-md bg-rose-500 flex items-center justify-center">
                    <Heart className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
                  <span>{displayLikes}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowLikes(false)}
                className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-90"
              >
                <X className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              {reactions.map((reaction) => (
                <div key={reaction.userId} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden border-2 border-zinc-50 group-hover:border-primary/30 transition-all duration-500">
                        {reaction.userAvatar ? (
                          <img 
                            src={reaction.userAvatar} 
                            alt={reaction.userName} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-zinc-400" />
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 rounded-lg p-1 border-2 border-white shadow-sm",
                        REACTION_TYPES.find(r => r.type === reaction.type)?.bg || 'bg-rose-500'
                      )}>
                        {(() => {
                          const Icon = REACTION_TYPES.find(r => r.type === reaction.type)?.icon || Heart;
                          return <Icon className={cn("w-2.5 h-2.5 fill-current", REACTION_TYPES.find(r => r.type === reaction.type)?.color || 'text-white')} />;
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[15px] text-zinc-900 leading-tight">{reaction.userName}</span>
                    </div>
                  </div>
                  <button className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-primary-hover transition-all active:scale-90 shadow-md shadow-primary/20">
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
