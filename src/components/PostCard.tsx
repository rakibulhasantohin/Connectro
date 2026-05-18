import React, { useState, useRef, useEffect } from 'react';
import { LazyImage } from './LazyImage';
import { CommentModal } from './CommentModal';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  MoreHorizontal, 
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  BadgeCheck,
  User,
  ChevronDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Share2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useUser } from '../contexts/UserContext';
import { doc, updateDoc, addDoc, collection, Timestamp, increment, deleteDoc, onSnapshot, query, setDoc, getDocs, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

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
    createdAt?: any;
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
  { type: 'like', icon: "👍", color: 'text-blue-500', label: 'Like' },
  { type: 'love', icon: "❤️", color: 'text-red-500', label: 'Love' },
  { type: 'care', icon: "🥰", color: 'text-yellow-500', label: 'Care' },
  { type: 'haha', icon: "😆", color: 'text-yellow-500', label: 'Haha' },
  { type: 'wow', icon: "😮", color: 'text-yellow-500', label: 'Wow' },
  { type: 'sad', icon: "😢", color: 'text-yellow-500', label: 'Sad' },
  { type: 'angry', icon: "😡", color: 'text-red-600', label: 'Angry' },
];

export const PostCard: React.FC<PostCardProps> = ({ post, onViewProfile }) => {
  const { userData, user: currentUser } = useUser();
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Normalize data
  const displayName = post.user?.name || post.userName || 'User';
  const displayAvatar = post.user?.avatar || post.userAvatar || '';
  const isVerified = post.user?.verified || false;
  const postUserId = post.userId;
  const isOwner = postUserId === currentUser?.uid;

  useEffect(() => {
    if (!currentUser) return;
    const unsubSaved = onSnapshot(
      doc(db, 'users', currentUser.uid, 'savedPosts', post.id.toString()), 
      (doc) => {
        setIsSaved(doc.exists());
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/savedPosts/${post.id}`)
    );

    const reactionsRef = collection(db, 'posts', post.id.toString(), 'reactions');
    const unsubReactions = onSnapshot(
      query(reactionsRef), 
      (snapshot) => {
        const data: ReactionData[] = [];
        let currentReaction: string | null = null;
        snapshot.forEach(doc => {
          const r = doc.data() as ReactionData;
          data.push(r);
          if (r.userId === currentUser.uid) currentReaction = r.type;
        });
        setReactions(data);
        setUserReaction(currentReaction);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `posts/${post.id}/reactions`)
    );

    return () => {
      unsubSaved();
      unsubReactions();
    };
  }, [post.id, currentUser]);

  const handleReaction = async (type: string) => {
    if (!currentUser) return;
    setShowReactionPicker(false);
    
    // Optimistic Update
    const prevReaction = userReaction;
    const isNew = !userReaction;
    setUserReaction(type === userReaction ? null : type);
    
    const reactionRef = doc(db, 'posts', post.id.toString(), 'reactions', currentUser.uid);
    const postRef = doc(db, 'posts', post.id.toString());

    try {
      if (prevReaction === type) {
        await deleteDoc(reactionRef);
        await updateDoc(postRef, { likes: increment(-1) });
      } else {
        await setDoc(reactionRef, {
          userId: currentUser.uid,
          userName: `${userData?.firstName} ${userData?.lastName}`,
          userAvatar: userData?.avatar || '',
          type,
          createdAt: serverTimestamp()
        });
        if (isNew) {
          await updateDoc(postRef, { likes: increment(1) });
          if (!isOwner && postUserId) {
            await addDoc(collection(db, 'notifications'), {
              toUserId: postUserId,
              fromUserId: currentUser.uid,
              fromUserName: `${userData?.firstName} ${userData?.lastName}`,
              fromUserAvatar: userData?.avatar || '',
              type: 'like',
              postId: post.id.toString(),
              createdAt: serverTimestamp(),
              read: false
            });
          }
        }
      }
    } catch (error) {
      console.error("Error reaction:", error);
      // Rollback on error
      setUserReaction(prevReaction);
    }
  };

  const handleDoubleTap = () => {
    setShowDoubleTapHeart(true);
    if (!userReaction) handleReaction('love');
    setTimeout(() => setShowDoubleTapHeart(false), 800);
  };

  const handleToggleSave = async () => {
    if (!currentUser) return;
    const savedRef = doc(db, 'users', currentUser.uid, 'savedPosts', post.id.toString());
    if (isSaved) await deleteDoc(savedRef);
    else await setDoc(savedRef, { savedAt: serverTimestamp(), postId: post.id.toString() });
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id.toString()));
      if (postUserId) {
        await updateDoc(doc(db, 'users', postUserId), { postCount: increment(-1) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return 'Just now';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString();
  };

  return (
    <article className="bg-black border-b border-zinc-900/50 pb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewProfile?.(postUserId || '')}>
          <div className="w-8 h-8 rounded-full p-[2px] connectro-gradient">
            <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-900">
              <img src={displayAvatar} className="w-full h-full object-cover" alt="" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold text-white">{displayName}</span>
            {isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />}
          </div>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className="text-white p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Media */}
      <div 
        className="relative aspect-square bg-zinc-900 overflow-hidden select-none"
        onDoubleClick={handleDoubleTap}
      >
        {post.video ? (
          <video src={post.video} autoPlay muted loop playsInline className="w-full h-full object-cover" />
        ) : (
          <img src={post.image} className="w-full h-full object-cover" alt="" />
        )}
        
        <AnimatePresence>
          {showDoubleTapHeart && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onMouseEnter={() => setShowReactionPicker(true)}
              onClick={() => handleReaction('like')}
              className={cn(
                "transition-transform active:scale-90",
                userReaction ? "text-red-500" : "text-white"
              )}
            >
              <Heart className={cn("w-6 h-6", userReaction === 'love' || userReaction === 'like' ? "fill-current" : "")} />
            </button>
            
            <AnimatePresence>
              {showReactionPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -45, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute left-0 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1.5 flex gap-2.5 z-[100] shadow-2xl"
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  {REACTION_TYPES.map((r) => (
                    <button 
                      key={r.type}
                      onClick={() => handleReaction(r.type)}
                      className="text-2xl hover:scale-150 transition-transform active:scale-95 px-0.5"
                      title={r.label}
                    >
                      {r.icon}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button onClick={() => setShowComments(true)} className="text-white active:scale-90 transition-all">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="text-white active:scale-90 transition-all">
            <Send className="w-6 h-6 -rotate-12" />
          </button>
        </div>
        
        <button onClick={handleToggleSave} className="text-white active:scale-90 transition-all">
          <Bookmark className={cn("w-6 h-6", isSaved && "fill-current")} />
        </button>
      </div>

      {/* Likes */}
      <div className="px-3 pb-1.5">
        {reactions.length > 0 && (
          <p className="text-[13px] font-bold text-white">
            {reactions.length === 1 
              ? `${reactions[0].userName} liked this`
              : `${reactions.length.toLocaleString()} likes`}
          </p>
        )}
      </div>

      {/* Caption */}
      <div className="px-3 space-y-1">
        <p className="text-[13px] text-white leading-tight">
          <span className="font-bold mr-2">{displayName}</span>
          {post.text}
        </p>
        
        {post.comments > 0 && (
          <button 
            onClick={() => setShowComments(true)}
            className="text-[13px] text-zinc-500 mt-1 block"
          >
            View all {post.comments} comments
          </button>
        )}
        
        <span className="text-[10px] text-zinc-500 uppercase tracking-tight block mt-1">
          {formatTime(post.createdAt)}
        </span>
      </div>

      {/* Menus */}
      {showMenu && isOwner && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-end">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-zinc-900 rounded-t-3xl p-6 pb-12 space-y-4"
          >
            <button onClick={handleDelete} className="w-full text-red-500 font-bold py-3 text-center border-b border-zinc-800">
              Delete Post
            </button>
            <button onClick={() => setShowMenu(false)} className="w-full text-white font-medium py-3 text-center">
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {showComments && (
        <CommentModal postId={post.id.toString()} onClose={() => setShowComments(false)} />
      )}
    </article>
  );
};
