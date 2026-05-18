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
  Loader2,
  Image,
  Sticker,
  Heart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc,
  increment
} from 'firebase/firestore';
import { motion } from 'motion/react';

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

  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`));

    if (user) {
      updateDoc(doc(db, 'chats', chatId), { [`unreadCount.${user.uid}`]: 0 }).catch(console.error);
    }

    return () => unsub();
  }, [chatId, user]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !user || sending) return;

    const text = inputText;
    setInputText('');
    setSending(true);

    try {
      const otherUserId = chatId.split('_').find(id => id !== user.uid);
      const chatRef = doc(db, 'chats', chatId);
      
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: increment(1)
      });

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp()
      });
      scrollToBottom();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col text-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-900 sticky top-0 bg-black z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1">
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div className="flex items-center gap-3">
            <img src={otherUserData?.avatar} className="w-9 h-9 rounded-full object-cover" />
            <div>
              <p className="text-sm font-bold leading-tight">{otherUserData?.firstName} {otherUserData?.lastName}</p>
              <p className="text-[10px] text-zinc-500">Active 2h ago</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Phone className="w-6 h-6" />
          <Video className="w-6 h-6" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
        <div className="flex flex-col items-center py-10">
           <img src={otherUserData?.avatar} className="w-20 h-20 rounded-full mb-3" />
           <p className="text-xl font-bold">{otherUserData?.firstName} {otherUserData?.lastName}</p>
           <p className="text-sm text-zinc-500">Connectro · {otherUserData?.firstName?.toLowerCase()}</p>
           <button className="mt-4 bg-zinc-900 px-4 py-1.5 rounded-lg text-sm font-bold">View Profile</button>
        </div>

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          const isLastFromUser = idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId;
          
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px]",
                isMe ? "bg-blue-600 text-white" : "bg-zinc-900 text-white",
                !isMe && isLastFromUser ? "rounded-bl-md" : "",
                isMe && isLastFromUser ? "rounded-br-md" : ""
              )}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4">
        <div className="bg-zinc-900 rounded-full flex items-center px-4 py-2 gap-3 min-h-[44px]">
          <button className="bg-blue-600 rounded-full p-1.5">
            <Camera className="w-4 h-4 text-white fill-white" />
          </button>
          <form className="flex-1" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Message..." 
              className="bg-transparent border-none p-0 text-sm w-full focus:ring-0 placeholder:text-zinc-500"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </form>
          {inputText.trim() ? (
            <button 
              onClick={handleSendMessage}
              className="text-blue-500 font-bold text-sm"
            >
              Send
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <Mic className="w-5 h-5 text-white" />
              <ImageIcon className="w-5 h-5 text-white" />
              <Sticker className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
