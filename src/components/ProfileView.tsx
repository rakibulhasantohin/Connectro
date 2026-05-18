import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Grid, 
  Video, 
  MessageSquare, 
  ChevronLeft,
  X,
  Loader2,
  Users,
  MoreHorizontal,
  Bookmark,
  Bell,
  CheckCircle2,
  BadgeCheck,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, getDocs, collection, query, where, orderBy, limit, deleteDoc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { PostCard } from './PostCard';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileViewProps {
  targetUserId?: string | null;
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
  onOpenChat?: (chatId: string) => void;
  setIsCreatePostOpen?: (isOpen: boolean) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  targetUserId, 
  onBack, 
  onViewProfile,
  onOpenChat
}) => {
  const { user, userData: currentUserData } = useUser();
  const [targetUserData, setTargetUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'reels' | 'tagged'>('grid');
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const isOwnProfile = !targetUserId || targetUserId === user?.uid;
  const displayData = isOwnProfile ? currentUserData : targetUserData;

  useEffect(() => {
    const uid = targetUserId || user?.uid;
    if (!uid) return;

    // Fetch user data
    const unsubUser = onSnapshot(
      doc(db, 'users', uid), 
      (doc) => {
        if (doc.exists()) setTargetUserData(doc.data());
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
    );

    // Fetch posts
    const qPosts = query(collection(db, 'posts'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(
      qPosts, 
      (snap) => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'posts')
    );

    // Check following
    if (user && !isOwnProfile) {
      const followId = `${user.uid}_${uid}`;
      const unsubFollow = onSnapshot(
        doc(db, 'follows', followId), 
        (d) => {
          setIsFollowing(d.exists());
        },
        (error) => handleFirestoreError(error, OperationType.GET, `follows/${followId}`)
      );

      // Check friend request
      const unsubRequest = onSnapshot(
        query(collection(db, 'friendRequests'), where('fromUserId', '==', user.uid), where('toUserId', '==', uid), where('status', '==', 'pending')),
        (snap) => {
          setIsRequested(!snap.empty);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'friendRequests')
      );

      return () => {
        unsubUser();
        unsubPosts();
        unsubFollow();
        unsubRequest();
      };
    }

    return () => {
      unsubUser();
      unsubPosts();
    };
  }, [targetUserId, user]);

  const handleFollow = async () => {
    if (!user || !targetUserId || followLoading) return;
    setFollowLoading(true);
    const followId = `${user.uid}_${targetUserId}`;
    try {
      const batch = writeBatch(db);
      if (isFollowing) {
        batch.delete(doc(db, 'follows', followId));
        batch.update(doc(db, 'users', user.uid), { following: increment(-1) });
        batch.update(doc(db, 'users', targetUserId), { followers: increment(-1) });
      } else {
        batch.set(doc(db, 'follows', followId), { followerId: user.uid, followingId: targetUserId, createdAt: serverTimestamp() });
        batch.update(doc(db, 'users', user.uid), { following: increment(1) });
        batch.update(doc(db, 'users', targetUserId), { followers: increment(1) });
        
        // Add notification
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          toUserId: targetUserId,
          fromUserId: user.uid,
          fromUserName: `${currentUserData?.firstName} ${currentUserData?.lastName}`,
          fromUserAvatar: currentUserData?.avatar || '',
          type: 'follow',
          text: 'started following you',
          read: false,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.WRITE, `follows/${followId}`);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user || !targetUserId || requestLoading || isRequested) return;
    setRequestLoading(true);
    try {
      const batch = writeBatch(db);
      const requestId = `${user.uid}_${targetUserId}`;
      const requestRef = doc(db, 'friendRequests', requestId);
      
      batch.set(requestRef, {
        fromUserId: user.uid,
        toUserId: targetUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        toUserId: targetUserId,
        fromUserId: user.uid,
        fromUserName: `${currentUserData?.firstName} ${currentUserData?.lastName}`,
        fromUserAvatar: currentUserData?.avatar || '',
        type: 'friend_request',
        text: 'sent you a friend request',
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit();
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.WRITE, 'friendRequests');
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) return <div className="bg-black min-h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-700" /></div>;

  return (
    <div className="bg-black min-h-full text-white pb-20">
      {/* Header Bar */}
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 bg-black z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1">
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-bold">{displayData?.firstName?.toLowerCase()}{displayData?.lastName?.toLowerCase()}</h2>
            <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20" />
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Bell className="w-6 h-6" />
          <MoreHorizontal className="w-6 h-6" />
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full p-[3px] connectro-gradient">
              <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-900">
                <img src={displayData?.avatar} className="w-full h-full object-cover" alt="" />
              </div>
            </div>
            {isOwnProfile && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-black">
                <PlusIcon className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 flex justify-around text-center">
            <div>
              <p className="text-lg font-bold">{posts.length}</p>
              <p className="text-xs text-zinc-400">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold">{displayData?.followers || 0}</p>
              <p className="text-xs text-zinc-400">Followers</p>
            </div>
            <div>
              <p className="text-lg font-bold">{displayData?.following || 0}</p>
              <p className="text-xs text-zinc-400">Following</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-0.5">
          <p className="text-sm font-bold">{displayData?.firstName} {displayData?.lastName}</p>
          <p className="text-sm text-zinc-400">{displayData?.category || 'Public Figure'}</p>
          <p className="text-sm">{displayData?.bio || 'Building the future of social.'}</p>
          {displayData?.website && (
            <a href={displayData.website} className="text-sm text-blue-400 font-medium block">
              {displayData.website.replace('https://', '')}
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOwnProfile ? (
            <>
              <button className="flex-1 bg-zinc-900 h-9 rounded-lg text-sm font-bold active:scale-95 transition-transform">
                Edit Profile
              </button>
              <button className="flex-1 bg-zinc-900 h-9 rounded-lg text-sm font-bold active:scale-95 transition-transform">
                Share Profile
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleFollow}
                className={cn(
                  "flex-1 h-9 rounded-lg text-sm font-bold active:scale-95 transition-transform",
                  isFollowing ? "bg-zinc-900 border border-zinc-800" : "bg-blue-500 text-white"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button 
                onClick={handleAddFriend}
                disabled={isRequested}
                className={cn(
                  "flex-1 h-9 rounded-lg text-sm font-bold active:scale-95 transition-transform",
                  isRequested ? "bg-zinc-900 text-zinc-500 border border-zinc-900" : "bg-zinc-900 text-white border border-zinc-800"
                )}
              >
                {isRequested ? 'Requested' : 'Add Friend'}
              </button>
              <button 
                onClick={() => onOpenChat?.([user?.uid, targetUserId].sort().join('_'))}
                className="flex-1 bg-zinc-900 h-9 rounded-lg text-sm font-bold active:scale-95 transition-transform border border-zinc-800"
              >
                Message
              </button>
            </>
          )}
          <button className="bg-zinc-900 w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-transform">
            <UserPlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-zinc-900 mt-4">
        <button 
          onClick={() => setActiveTab('grid')}
          className={cn(
            "flex-1 h-12 flex items-center justify-center relative",
            activeTab === 'grid' ? "text-white" : "text-zinc-500"
          )}
        >
          <Grid className="w-6 h-6" />
          {activeTab === 'grid' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white" />}
        </button>
        <button 
          onClick={() => setActiveTab('reels')}
          className={cn(
            "flex-1 h-12 flex items-center justify-center relative",
            activeTab === 'reels' ? "text-white" : "text-zinc-500"
          )}
        >
          <Video className="w-6 h-6" />
          {activeTab === 'reels' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white" />}
        </button>
        <button 
          onClick={() => setActiveTab('tagged')}
          className={cn(
            "flex-1 h-12 flex items-center justify-center relative",
            activeTab === 'tagged' ? "text-white" : "text-zinc-500"
          )}
        >
          <UserIcon className="w-6 h-6" />
          {activeTab === 'tagged' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white" />}
        </button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map(post => (
          <div key={post.id} className="aspect-square bg-zinc-900 overflow-hidden relative">
            <img src={post.image || post.video} className="w-full h-full object-cover" alt="" />
            {post.video && (
              <div className="absolute top-2 right-2">
                <Video className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
