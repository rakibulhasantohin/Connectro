import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  X, 
  Search, 
  MoreHorizontal, 
  User, 
  Loader2,
  Check,
  Clock,
  MessageCircle
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDocs, 
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { cn } from '../lib/utils';

interface FriendsViewProps {
  onViewProfile: (userId: string) => void;
  onOpenChat?: (chatId: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onViewProfile, onOpenChat }) => {
  const { user, userData } = useUser();
  const [activeTab, setActiveTab] = useState<'suggestions' | 'friends'>('suggestions');
  const [newUsers, setNewUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [requestingIds, setRequestingIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch new users (excluding current user)
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          mutual: Math.floor(Math.random() * 20)
        }))
        .filter(u => u.id !== user.uid);
      setNewUsers(usersData);
      setLoading(false);
    });

    // Fetch incoming friend requests
    const incomingQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.uid)
    );

    const unsubscribeIncoming = onSnapshot(incomingQuery, async (snapshot) => {
      const requests = [];
      for (const requestDoc of snapshot.docs) {
        const data = requestDoc.data();
        const fromUserDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', data.fromUserId), limit(1)));
        const fromUserData = fromUserDoc.docs[0]?.data();
        requests.push({
          id: requestDoc.id,
          ...data,
          fromUser: fromUserData
        });
      }
      setIncomingRequests(requests);
    });

    // Fetch sent friend requests
    const sentQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', user.uid)
    );

    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().toUserId);
      setSentRequestIds(ids);
    });

    // Fetch friendships and friend data
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('uids', 'array-contains', user.uid)
    );

    const unsubscribeFriendships = onSnapshot(friendshipsQuery, async (snapshot) => {
      const ids = snapshot.docs.map(doc => {
        const data = doc.data();
        return data.uids.find((id: string) => id !== user.uid);
      });
      setFriendIds(ids);

      // Fetch friend details
      const friendDetails = [];
      for (const friendId of ids) {
        const friendDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', friendId), limit(1)));
        if (!friendDoc.empty) {
          friendDetails.push({ id: friendId, ...friendDoc.docs[0].data() });
        }
      }
      setFriends(friendDetails);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeIncoming();
      unsubscribeSent();
      unsubscribeFriendships();
    };
  }, [user]);

  const handleMessage = (friendId: string) => {
    if (!user || !onOpenChat) return;
    const chatId = [user.uid, friendId].sort().join('_');
    onOpenChat(chatId);
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!user || !userData) return;
    
    setRequestingIds(prev => [...prev, targetUserId]);
    
    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        toUserId: targetUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Create notification
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

    } catch (error) {
      console.error("Error adding friend:", error);
    } finally {
      setRequestingIds(prev => prev.filter(id => id !== targetUserId));
    }
  };

  const handleAcceptRequest = async (request: any) => {
    if (!user) return;
    
    try {
      // 1. Delete request
      await deleteDoc(doc(db, 'friendRequests', request.id));
      
      // 2. Create friendship
      const friendshipId = [user.uid, request.fromUserId].sort().join('_');
      await setDoc(doc(db, 'friendships', friendshipId), {
        uids: [user.uid, request.fromUserId],
        createdAt: serverTimestamp()
      });

      // 3. Create chat
      await setDoc(doc(db, 'chats', friendshipId), {
        participants: [user.uid, request.fromUserId],
        lastMessage: 'You are now friends! Say hi.',
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [user.uid]: 0,
          [request.fromUserId]: 0
        }
      });

      // 4. Create notification
      await addDoc(collection(db, 'notifications'), {
        toUserId: request.fromUserId,
        fromUserId: user.uid,
        fromUserName: `${userData?.firstName} ${userData?.lastName}`,
        fromUserAvatar: userData?.avatar || '',
        type: 'friend_accept',
        text: 'accepted your friend request',
        read: false,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-zinc-50 min-h-full pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-zinc-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Friends</h2>
          <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center hover:bg-zinc-200 transition-all cursor-pointer">
            <MoreHorizontal className="w-5 h-5 text-zinc-600" />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Search friends by name..."
            className="w-full bg-zinc-100 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('suggestions')}
            className={cn(
              "px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95",
              activeTab === 'suggestions' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            )}
          >
            Suggestions
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            className={cn(
              "px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95",
              activeTab === 'friends' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            )}
          >
            Your Friends
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 space-y-6">
        {activeTab === 'suggestions' ? (
          <>
            {/* Friend Requests Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Friend Requests</h3>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {incomingRequests.length} Pending
            </span>
          </div>
          
          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-zinc-100 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 bg-zinc-50 rounded-3xl flex items-center justify-center shadow-inner">
                <UserPlus className="w-8 h-8 text-zinc-200" />
              </div>
              <div>
                <p className="text-zinc-900 font-black">No new requests</p>
                <p className="text-zinc-400 text-xs font-medium mt-1">When you have friend requests, they'll appear here.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {incomingRequests.map((req) => (
                <div key={req.id} className="bg-white p-4 rounded-[2rem] shadow-sm border border-zinc-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
                    {req.fromUser?.avatar ? (
                      <img src={req.fromUser.avatar} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-zinc-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-zinc-900 truncate">{req.fromUser?.firstName} {req.fromUser?.lastName}</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sent a request</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAcceptRequest(req)}
                      className="bg-primary text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/15 active:scale-95 transition-all"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => handleDeclineRequest(req.id)}
                      className="bg-zinc-100 text-zinc-500 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 active:scale-95 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* People You May Know (New Users) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">
              {searchQuery ? 'Search Results' : 'New to Connectro'}
            </h3>
            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {searchQuery ? 'Found users' : 'People you may know'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-zinc-400 text-xs font-black uppercase tracking-widest">Finding new members</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {newUsers
                .filter(u => 
                  `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((u) => {
                  const isFriend = friendIds.includes(u.id);
                  const isSent = sentRequestIds.includes(u.id);
                  const isRequesting = requestingIds.includes(u.id);

                  return (
                    <div 
                      key={u.id}
                      className="bg-white p-4 rounded-[2rem] shadow-sm border border-zinc-100 flex items-center gap-4 group hover:shadow-md transition-all"
                    >
                      <div 
                        onClick={() => onViewProfile(u.id)}
                        className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0 cursor-pointer border-2 border-white shadow-sm"
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 
                          onClick={() => onViewProfile(u.id)}
                          className="font-black text-zinc-900 truncate cursor-pointer hover:text-primary transition-colors"
                        >
                          {u.firstName} {u.lastName}
                        </h4>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                          {u.category || 'New Member'}
                        </p>
                        {u.mutual > 0 && (
                          <p className="text-[10px] font-bold text-zinc-400 mt-0.5">
                            {u.mutual} mutual connections
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {isFriend ? (
                          <button 
                            onClick={() => handleMessage(u.id)}
                            className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all active:scale-95"
                          >
                            <MessageCircle className="w-3 h-3" /> Message
                          </button>
                        ) : isSent ? (
                          <button className="bg-zinc-100 text-zinc-500 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-default">
                            <Clock className="w-3 h-3" /> Sent
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAddFriend(u.id)}
                            disabled={isRequesting}
                            className={cn(
                              "bg-primary text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/15 flex items-center justify-center gap-2 min-w-[100px]",
                              isRequesting ? "opacity-70 cursor-not-allowed" : "hover:bg-indigo-700"
                            )}
                          >
                            {isRequesting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserPlus className="w-3 h-3" />
                            )}
                            {isRequesting ? 'Sending...' : 'Add Friend'}
                          </button>
                        )}
                        <button className="bg-zinc-50 text-zinc-400 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95">
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              
              {newUsers.filter(u => 
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-zinc-400 font-bold">
                    {searchQuery ? `No users found matching "${searchQuery}"` : 'No other members found yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        </>
      ) : (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">Your Friends</h3>
              <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {friends.length} Total
              </span>
            </div>

            {friends.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-zinc-100 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center shadow-inner">
                  <User className="w-10 h-10 text-zinc-200" />
                </div>
                <div>
                  <p className="text-zinc-900 font-black text-lg">No friends yet</p>
                  <p className="text-zinc-400 text-sm font-medium mt-1">Start connecting with people to see them here!</p>
                </div>
                <button 
                  onClick={() => setActiveTab('suggestions')}
                  className="mt-4 bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {friends
                  .filter(f => 
                    `${f.firstName} ${f.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((f) => (
                    <div 
                      key={f.id}
                      className="bg-white p-4 rounded-[2rem] shadow-sm border border-zinc-100 flex items-center gap-4 group hover:shadow-md transition-all"
                    >
                      <div 
                        onClick={() => onViewProfile(f.id)}
                        className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0 cursor-pointer border-2 border-white shadow-sm"
                      >
                        {f.avatar ? (
                          <img src={f.avatar} alt={f.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 
                          onClick={() => onViewProfile(f.id)}
                          className="font-black text-zinc-900 truncate cursor-pointer hover:text-primary transition-colors"
                        >
                          {f.firstName} {f.lastName}
                        </h4>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                          {f.category || 'Friend'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleMessage(f.id)}
                          className="bg-primary text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/15 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <MessageCircle className="w-3 h-3" /> Message
                        </button>
                        <button 
                          onClick={() => onViewProfile(f.id)}
                          className="bg-zinc-100 text-zinc-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 active:scale-95 transition-all"
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
