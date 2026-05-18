import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  Search as SearchIcon, 
  MoreHorizontal, 
  User, 
  Loader2,
  Check,
  MessageCircle,
  Play
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs, 
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { LazyImage } from './LazyImage';
import { cn } from '../lib/utils';

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  createdAt: any;
  fromUserData?: any;
}

interface FriendsViewProps {
  onViewProfile: (userId: string) => void;
  onOpenChat?: (chatId: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onViewProfile, onOpenChat }) => {
  const { user, userData } = useUser();
  const [explorePosts, setExplorePosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [requestedUsers, setRequestedUsers] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Fetch user's following list to show "Following" instead of "Follow"
    const unsubFollowing = onSnapshot(
      query(collection(db, 'follows'), where('followerId', '==', user.uid)), 
      (snap) => {
        const ids = new Set(snap.docs.map(d => d.data().followingId));
        setFollowingUsers(ids);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'follows')
    );

    // Fetch user's pending friend requests sent to show "Requested"
    const unsubSentRequests = onSnapshot(
      query(collection(db, 'friendRequests'), where('fromUserId', '==', user.uid), where('status', '==', 'pending')), 
      (snap) => {
        const ids = new Set(snap.docs.map(d => d.data().toUserId));
        setRequestedUsers(ids);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'friendRequests')
    );

    // Fetch Explore content (recent posts)
    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(24));
    const unsubPosts = onSnapshot(
      qPosts, 
      (snap) => {
        setExplorePosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'posts')
    );

    // Fetch Suggestions
    const qUsers = query(collection(db, 'users'), limit(15));
    const unsubUsers = onSnapshot(
      qUsers, 
      (snap) => {
        const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setSuggestions(users.filter(u => u.uid !== user?.uid).slice(0, 5));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    // Fetch Incoming Friend Requests
    const qRequests = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubRequests = onSnapshot(
      qRequests, 
      async (snap) => {
        const requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
        
        // Fetch user data for each request (Simplified, in real apps use a shared cache)
        const requestsWithData = await Promise.all(requests.map(async (req) => {
          const uDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', req.fromUserId), limit(1)));
          const uData = uDoc.docs[0]?.data();
          return { ...req, fromUserData: uData };
        }));

        setIncomingRequests(requestsWithData);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'friendRequests')
    );

    return () => {
      unsubPosts();
      unsubUsers();
      unsubRequests();
      unsubFollowing();
      unsubSentRequests();
    };
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      const q = query(
        collection(db, 'users'),
        where('firstName', '>=', searchQuery),
        where('firstName', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      getDocs(q).then(snap => {
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setIsSearching(false);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleFollow = async (targetUserId: string) => {
    if (!user || !userData) return;
    const followId = `${user.uid}_${targetUserId}`;
    const isAlreadyFollowing = followingUsers.has(targetUserId);
    
    try {
      const batch = writeBatch(db);
      if (isAlreadyFollowing) {
        batch.delete(doc(db, 'follows', followId));
        batch.update(doc(db, 'users', user.uid), { following: increment(-1) });
        batch.update(doc(db, 'users', targetUserId), { followers: increment(-1) });
      } else {
        batch.set(doc(db, 'follows', followId), { 
          followerId: user.uid, 
          followingId: targetUserId, 
          createdAt: serverTimestamp() 
        });
        batch.update(doc(db, 'users', user.uid), { following: increment(1) });
        batch.update(doc(db, 'users', targetUserId), { followers: increment(1) });
        
        // Add notification
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          toUserId: targetUserId,
          fromUserId: user.uid,
          fromUserName: `${userData.firstName} ${userData.lastName}`,
          fromUserAvatar: userData.avatar || '',
          type: 'follow',
          text: 'started following you',
          read: false,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!user || !userData) return;
    if (requestedUsers.has(targetUserId)) return;

    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        toUserId: targetUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'notifications'), {
        toUserId: targetUserId,
        fromUserId: user.uid,
        fromUserName: `${userData.firstName} ${userData.lastName}`,
        fromUserAvatar: userData.avatar || '',
        type: 'friend_request',
        text: 'sent you a friend request',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user) return;
    
    const batch = writeBatch(db);
    const friendshipId = [user.uid, request.fromUserId].sort().join('_');
    const chatId = friendshipId; // One-to-one chat ID

    try {
      // 1. Create Friendship
      batch.set(doc(db, 'friendships', friendshipId), {
        uids: [user.uid, request.fromUserId],
        createdAt: serverTimestamp()
      });

      // 2. Create/Initialize Chat
      batch.set(doc(db, 'chats', chatId), {
        participants: [user.uid, request.fromUserId],
        lastMessage: 'You are now friends!',
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [user.uid]: 0,
          [request.fromUserId]: 0
        }
      }, { merge: true });

      // 3. Delete Request
      batch.delete(doc(db, 'friendRequests', request.id));

      // 4. Update user friend counts
      batch.update(doc(db, 'users', user.uid), { friendsCount: increment(1) });
      batch.update(doc(db, 'users', request.fromUserId), { friendsCount: increment(1) });

      // 5. Add notification for acceptance
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        toUserId: request.fromUserId,
        fromUserId: user.uid,
        fromUserName: `${userData?.firstName} ${userData?.lastName}`,
        fromUserAvatar: userData?.avatar || '',
        type: 'friend_accept',
        text: 'accepted your friend request',
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit();
    } catch (e) {
      console.error("Accept failed:", e);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (e) {
      console.error("Decline failed:", e);
    }
  };

  return (
    <div className="flex flex-col bg-black min-h-full">
      {/* Search Header */}
      <div className="px-4 py-3 sticky top-0 z-50 bg-black">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search"
            className="w-full bg-zinc-900 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          )}
        </div>
      </div>

      {searchQuery.trim().length > 0 ? (
        <div className="flex-1 px-4 space-y-4 pt-2">
          {/* ... Search results stays same ... */}
          {isSearching ? (
            <div className="flex justify-center pt-8">
              <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(u => (
              <div key={u.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewProfile(u.uid)}>
                  <img src={u.avatar} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-bold text-white">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-zinc-500">{u.category || 'User'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(u.uid);
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all w-24",
                      followingUsers.has(u.uid) ? "bg-zinc-800 text-white" : "bg-blue-500 text-white"
                    )}
                  >
                    {followingUsers.has(u.uid) ? 'Following' : 'Follow'}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFriend(u.uid);
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all w-24",
                      requestedUsers.has(u.uid) ? "bg-zinc-800 text-zinc-500" : "bg-zinc-900 text-white"
                    )}
                    disabled={requestedUsers.has(u.uid)}
                  >
                    {requestedUsers.has(u.uid) ? 'Requested' : 'Add Friend'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-500 pt-8">No results found for "{searchQuery}"</p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Friend Requests Section */}
          {incomingRequests.length > 0 && (
            <div className="px-4 py-4 border-b border-zinc-900">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Friend Requests</h3>
              </div>
              <div className="space-y-4">
                {incomingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewProfile(req.fromUserId)}>
                      <img src={req.fromUserData?.avatar} className="w-11 h-11 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-white">{req.fromUserData?.firstName} {req.fromUserData?.lastName}</p>
                        <p className="text-[10px] text-zinc-500">Sent you a friend request</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAcceptRequest(req)}
                        className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleDeclineRequest(req.id)}
                        className="bg-zinc-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explore Grid */}
          <div className="grid grid-cols-3 gap-0.5">
            {explorePosts.map((post, idx) => (
              <div 
                key={post.id} 
                className={cn(
                  "relative aspect-square bg-zinc-900 group cursor-pointer",
                  idx % 10 === 0 && "col-span-2 row-span-2 aspect-auto"
                )}
              >
                {post.image ? (
                  <img src={post.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="px-4 py-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Suggested for you</h3>
              <button className="text-blue-500 text-xs font-bold">See All</button>
            </div>
            <div className="space-y-4">
              {suggestions.map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  {/* ... Suggestions content ... */}
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewProfile(u.uid)}>
                    <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-white">{u.firstName} {u.lastName}</p>
                      <p className="text-[10px] text-zinc-500">Suggested for you</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleFollow(u.uid)}
                      className={cn(
                        "text-xs font-bold active:scale-95",
                        followingUsers.has(u.uid) ? "text-zinc-500" : "text-blue-500"
                      )}
                    >
                      {followingUsers.has(u.uid) ? 'Following' : 'Follow'}
                    </button>
                    <button 
                      onClick={() => handleAddFriend(u.uid)}
                      className={cn(
                        "text-xs font-bold active:scale-95 ml-2",
                        requestedUsers.has(u.uid) ? "text-zinc-500" : "text-zinc-300"
                      )}
                      disabled={requestedUsers.has(u.uid)}
                    >
                      {requestedUsers.has(u.uid) ? 'Requested' : 'Add Friend'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
