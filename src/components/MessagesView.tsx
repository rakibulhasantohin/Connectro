import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreHorizontal, 
  User, 
  Bell, 
  Heart, 
  MessageCircle, 
  Share2, 
  AlertCircle,
  Settings,
  Edit3,
  Camera,
  ChevronLeft,
  Check,
  CheckCheck,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  Timestamp, 
  deleteDoc, 
  doc, 
  getDocs,
  limit
} from 'firebase/firestore';
import { ChatWindow } from './ChatWindow';

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: any;
  unreadCount?: { [uid: string]: number };
  otherUser?: any;
}

interface MessagesViewProps {
  onViewProfile: (userId: string) => void;
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
}

const TimeAgo: React.FC<{ timestamp: any }> = ({ timestamp }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!timestamp) {
        setTimeAgo('');
        return;
      }
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
      
      if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds}s`);
      } else if (diffInSeconds < 3600) {
        setTimeAgo(`${Math.floor(diffInSeconds / 60)}m`);
      } else if (diffInSeconds < 86400) {
        setTimeAgo(`${Math.floor(diffInSeconds / 3600)}h`);
      } else if (diffInSeconds < 604800) {
        setTimeAgo(`${Math.floor(diffInSeconds / 86400)}d`);
      } else {
        setTimeAgo(date.toLocaleDateString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>{timeAgo}</span>;
};

export const MessagesView: React.FC<MessagesViewProps> = ({ onViewProfile, selectedChatId, setSelectedChatId }) => {
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData: Chat[] = [];
      
      for (const chatDoc of snapshot.docs) {
        const data = chatDoc.data() as Chat;
        const otherUserId = data.participants.find(id => id !== user.uid);
        
        if (otherUserId) {
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', otherUserId), limit(1)));
          const otherUser = userDoc.docs[0]?.data();
          chatsData.push({
            ...data,
            id: chatDoc.id,
            otherUser
          });
        }
      }
      
      setChats(chatsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch active users (friends)
  useEffect(() => {
    if (!user) return;
    
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('uids', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(friendshipsQuery, async (snapshot) => {
      const ids = snapshot.docs.map(doc => {
        const data = doc.data();
        return data.uids.find((id: string) => id !== user.uid);
      }).filter(Boolean);

      if (ids.length === 0) {
        setActiveUsers([]);
        return;
      }

      // Fetch friend details
      const friendDetails = [];
      const idsToFetch = ids.slice(0, 10); // Limit to 10 for active users bar
      
      for (const friendId of idsToFetch) {
        const friendDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', friendId), limit(1)));
        if (!friendDoc.empty) {
          friendDetails.push({ id: friendId, ...friendDoc.docs[0].data() });
        }
      }
      setActiveUsers(friendDetails);
    });
    
    return () => unsubscribe();
  }, [user]);

  if (selectedChatId) {
    const chat = chats.find(c => c.id === selectedChatId);
    return (
      <ChatWindow 
        chatId={selectedChatId} 
        otherUser={chat?.otherUser} 
        onBack={() => setSelectedChatId(null)} 
      />
    );
  }

  return (
    <div className="bg-white min-h-full pb-24 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-100">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Messages</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90 relative">
            <Settings className="w-5 h-5 text-zinc-900" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">7</span>
          </button>
          <button className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90">
            <Search className="w-5 h-5 text-zinc-900" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-2">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full bg-zinc-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Active Users (Stories style) */}
      <div className="mt-4">
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 pb-4">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-full bg-zinc-50 border-2 border-zinc-100 flex items-center justify-center relative cursor-pointer hover:bg-zinc-100 transition-all">
              <Plus className="w-6 h-6 text-zinc-400" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className="w-4 h-4 bg-zinc-200 rounded-full"></div>
              </div>
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Your note</span>
          </div>
          {activeUsers.map((u) => (
            <div 
              key={u.id} 
              onClick={() => {
                const chatId = [user?.uid, u.id].sort().join('_');
                setSelectedChatId(chatId);
              }}
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full p-0.5 border-2 border-primary group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white relative">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-zinc-300" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
              </div>
              <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest truncate w-16 text-center">{u.firstName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 px-6 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Syncing messages...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10">
            <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
              <MessageCircle className="w-8 h-8 text-zinc-200" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tighter mb-2">No conversations yet</h3>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Start a conversation with your friends to see them here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {chats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setSelectedChatId(chat.id)}
                className="flex gap-4 items-center p-3 rounded-[2rem] hover:bg-zinc-50 transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-zinc-100 group-hover:scale-105 transition-transform">
                    {chat.otherUser?.avatar ? (
                      <img src={chat.otherUser.avatar} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                        <User className="w-7 h-7 text-zinc-300" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-black text-zinc-900 tracking-tight truncate">{chat.otherUser?.firstName} {chat.otherUser?.lastName}</h4>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <TimeAgo timestamp={chat.lastMessageAt} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={cn(
                      "text-sm truncate",
                      chat.unreadCount?.[user?.uid || ''] ? "font-black text-zinc-900" : "text-zinc-500 font-medium"
                    )}>
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount?.[user?.uid || ''] ? (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    ) : (
                      <CheckCheck className="w-3 h-3 text-zinc-300" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all z-30">
        <Edit3 className="w-6 h-6" />
      </button>
    </div>
  );
};
