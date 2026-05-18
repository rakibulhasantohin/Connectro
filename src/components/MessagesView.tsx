import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Settings,
  Edit3,
  ChevronLeft,
  CheckCheck,
  Plus,
  Video,
  Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { LazyImage } from './LazyImage';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs,
  limit
} from 'firebase/firestore';
import { ChatWindow } from './ChatWindow';
import { motion } from 'motion/react';

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
  onBack?: () => void;
}

const formatTime = (ts: any) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString();
};

export const MessagesView: React.FC<MessagesViewProps> = ({ 
  onViewProfile, 
  selectedChatId, 
  setSelectedChatId,
  onBack
}) => {
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
          try {
            const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', otherUserId), limit(1)));
            const otherUser = userSnap.docs[0]?.data();
            chatsData.push({ ...data, id: chatDoc.id, otherUser });
          } catch (e) { 
            console.error(e); 
          }
        }
      }
      setChats(chatsData);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chats'));

    return () => unsubscribe();
  }, [user]);

  // Active users / Notes shim
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), limit(10));
    getDocs(q).then(snap => {
      setActiveUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(u => u.uid !== user.uid));
    });
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
    <div className="bg-black min-h-screen flex flex-col text-white pb-20">
      {/* Header */}
      <div className="px-4 py-4 flex justify-between items-center sticky top-0 bg-black z-30">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1">
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div className="flex items-center gap-1">
            <h2 className="text-xl font-bold">{user?.displayName || 'Messenger'}</h2>
            <div className="bg-red-500 w-1.5 h-1.5 rounded-full mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Video className="w-6 h-6" />
          <Edit3 className="w-6 h-6" />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative bg-zinc-900 rounded-xl flex items-center px-4 py-2.5">
          <Search className="w-4 h-4 text-zinc-500 mr-3" />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none p-0 text-sm w-full focus:ring-0 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Notes / Active Users */}
      <div className="mt-6 flex overflow-x-auto px-4 gap-5 no-scrollbar pb-4">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-16 h-16">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center p-0.5">
              <img src={user?.photoURL || ''} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute -top-6 -right-2 bg-white text-black px-3 py-1.5 rounded-2xl rounded-bl-sm text-[10px] font-medium shadow-lg max-w-[80px] break-words">
              Note...
            </div>
            <div className="absolute bottom-0 right-0 bg-zinc-800 rounded-full p-1 border-2 border-black">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-[11px] text-zinc-500">Your note</span>
        </div>

        {activeUsers.map(u => (
          <div key={u.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer" onClick={() => setSelectedChatId([user?.uid, u.uid].sort().join('_'))}>
            <div className="relative w-16 h-16">
               <img src={u.avatar} className="w-full h-full rounded-full object-cover" />
               <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />
            </div>
            <span className="text-[11px] text-zinc-500 truncate w-16 text-center">{u.firstName}</span>
          </div>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 px-4 mt-4 space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-sm font-bold">Messages</span>
          <button className="text-blue-500 text-sm font-medium">Requests</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-zinc-500">No messages yet</p>
          </div>
        ) : (
          chats.map(chat => {
            const hasUnread = chat.unreadCount?.[user?.uid || ''] || 0 > 0;
            return (
              <div 
                key={chat.id} 
                className="flex items-center gap-3 active:bg-zinc-900 p-1 rounded-lg transition-colors cursor-pointer"
                onClick={() => setSelectedChatId(chat.id)}
              >
                <div className="relative shrink-0">
                  <img src={chat.otherUser?.avatar} className="w-14 h-14 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", hasUnread ? "font-bold text-white" : "text-zinc-300 font-medium")}>
                    {chat.otherUser?.firstName} {chat.otherUser?.lastName}
                  </p>
                  <p className={cn("text-xs truncate max-w-[200px]", hasUnread ? "font-bold text-white" : "text-zinc-500")}>
                    {chat.lastMessage} · {formatTime(chat.lastMessageAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {hasUnread ? (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  ) : (
                    <Camera className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
