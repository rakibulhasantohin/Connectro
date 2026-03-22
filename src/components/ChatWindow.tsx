import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Phone, 
  Video, 
  Info, 
  Plus, 
  Camera, 
  Image as ImageIcon, 
  Mic, 
  Smile, 
  Send,
  MoreVertical,
  User,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  Timestamp, 
  doc, 
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc,
  increment
} from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface ChatWindowProps {
  chatId: string;
  otherUser: any;
  onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, otherUser, onBack }) => {
  const { user } = useUser();
  const [otherUserData, setOtherUserData] = useState<any>(otherUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch other user data if not provided
  useEffect(() => {
    if (otherUser) {
      setOtherUserData(otherUser);
      return;
    }

    if (!chatId || !user) return;

    const fetchOtherUser = async () => {
      try {
        const otherUserId = chatId.split('_').find(id => id !== user.uid);
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            setOtherUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching other user:", error);
      }
    };

    fetchOtherUser();
  }, [chatId, otherUser, user]);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    // Mark as read
    if (user) {
      const chatRef = doc(db, 'chats', chatId);
      getDoc(chatRef).then(docSnap => {
        if (docSnap.exists()) {
          updateDoc(chatRef, {
            [`unreadCount.${user.uid}`]: 0
          }).catch(err => console.error("Error marking as read:", err));
        }
      });
    }

    return () => unsubscribe();
  }, [chatId, user]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !user || !otherUserData || sending) return;

    setSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      // Ensure chat document exists
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user.uid, chatId.split('_').find(id => id !== user.uid)],
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          unreadCount: {
            [user.uid]: 0,
            [chatId.split('_').find(id => id !== user.uid) || '']: 1
          }
        });
      }

      const messageData = {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      // Update chat metadata
      const otherUserId = chatId.split('_').find(id => id !== user.uid);
      if (otherUserId) {
        await updateDoc(chatRef, {
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          [`unreadCount.${otherUserId}`]: increment(1)
        });
      }

      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-100 bg-white/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full transition-colors active:scale-90">
            <ChevronLeft className="w-6 h-6 text-primary" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-100 group-hover:scale-105 transition-transform">
                {otherUserData?.avatar ? (
                  <img src={otherUserData.avatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-300" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h4 className="text-sm font-black text-zinc-900 tracking-tight leading-none mb-1">{otherUserData?.firstName} {otherUserData?.lastName}</h4>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Active now</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-10 h-10 flex items-center justify-center text-primary hover:bg-zinc-50 rounded-full transition-all active:scale-90"><Phone className="w-5 h-5" /></button>
          <button className="w-10 h-10 flex items-center justify-center text-primary hover:bg-zinc-50 rounded-full transition-all active:scale-90"><Video className="w-5 h-5" /></button>
          <button className="w-10 h-10 flex items-center justify-center text-primary hover:bg-zinc-50 rounded-full transition-all active:scale-90"><Info className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 bg-zinc-50/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-10">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-white shadow-xl">
              {otherUserData?.avatar ? (
                <img src={otherUserData.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-zinc-300" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tighter mb-1">{otherUserData?.firstName} {otherUserData?.lastName}</h3>
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-6">You're friends on Connectro</p>
            <button className="bg-zinc-100 text-zinc-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">View Profile</button>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.uid;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
            
            return (
              <div key={msg.id} className={cn(
                "flex gap-2 max-w-[85%]",
                isMe ? "ml-auto flex-row-reverse" : "mr-auto"
              )}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-auto mb-1">
                    {showAvatar ? (
                      otherUserData?.avatar ? (
                        <img src={otherUserData.avatar} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-300" />
                        </div>
                      )
                    ) : <div className="w-8 h-8" />}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className={cn(
                    "px-4 py-2.5 rounded-[1.5rem] text-sm font-medium shadow-sm",
                    isMe 
                      ? "bg-primary text-white rounded-br-none" 
                      : "bg-white text-zinc-900 border border-zinc-100 rounded-bl-none"
                  )}>
                    {msg.text}
                  </div>
                  {idx === messages.length - 1 && isMe && (
                    <div className="flex justify-end pr-1">
                      <CheckCheck className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-zinc-100 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button type="button" className="w-9 h-9 flex items-center justify-center text-primary hover:bg-zinc-50 rounded-full transition-all active:scale-90"><Plus className="w-5 h-5" /></button>
            <button type="button" className="w-9 h-9 flex items-center justify-center text-primary hover:bg-zinc-50 rounded-full transition-all active:scale-90"><Camera className="w-5 h-5" /></button>
            <button type="button" className="w-9 h-9 flex items-center justify-center text-primary hover:bg-zinc-50 rounded-full transition-all active:scale-90"><ImageIcon className="w-5 h-5" /></button>
            <button type="button" className="w-9 h-9 flex items-center justify-center text-primary hover:bg-zinc-50 rounded-full transition-all active:scale-90"><Mic className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Aa" 
              className="w-full bg-zinc-100 border-none rounded-full py-2.5 px-4 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim() || sending}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90",
              inputText.trim() ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-primary"
            )}
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
