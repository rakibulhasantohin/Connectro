import React, { useState, useEffect } from 'react';
import { Search, MoreHorizontal, User, Bell, Heart, MessageCircle, Share2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';

interface Notification {
  id: string;
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  type: 'like' | 'comment' | 'share' | 'follow' | 'love' | 'haha' | 'wow' | 'angry' | 'friend_request' | 'friend_accept';
  postId: string;
  createdAt: any;
  read: boolean;
}

export const NotificationsView: React.FC = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Filter for notifications in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'like': return 'liked your post';
      case 'love': return 'loved your post';
      case 'haha': return 'laughed at your post';
      case 'wow': return 'is wowed by your post';
      case 'angry': return 'is angry at your post';
      case 'comment': return 'commented on your post';
      case 'share': return 'shared your post';
      case 'follow': return 'started following you';
      case 'friend_request': return 'sent you a friend request';
      case 'friend_accept': return 'accepted your friend request';
      default: return 'interacted with you';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return { Icon: Heart, color: 'bg-rose-500' };
      case 'love': return { Icon: Heart, color: 'bg-rose-500' };
      case 'haha': return { Icon: MessageCircle, color: 'bg-amber-500' };
      case 'wow': return { Icon: Bell, color: 'bg-purple-500' };
      case 'angry': return { Icon: Bell, color: 'bg-orange-500' };
      case 'comment': return { Icon: MessageCircle, color: 'bg-indigo-500' };
      case 'share': return { Icon: Share2, color: 'bg-emerald-500' };
      case 'follow': return { Icon: User, color: 'bg-blue-500' };
      case 'friend_request': return { Icon: User, color: 'bg-primary' };
      case 'friend_accept': return { Icon: User, color: 'bg-emerald-500' };
      default: return { Icon: Bell, color: 'bg-zinc-500' };
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white min-h-full pb-24">
      <div className="flex justify-between items-center px-6 py-4 sticky top-0 bg-white/90 backdrop-blur-xl z-10 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Connectro Alerts</h2>
        </div>
        <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90"><Search className="w-5 h-5 text-zinc-900" /></button>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-6 mt-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
          <h3 className="font-black text-zinc-900 uppercase tracking-widest text-[10px]">Recent Activity (24h)</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loading alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10">
            <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
              <Bell className="w-8 h-8 text-zinc-200" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tighter mb-2">No new alerts</h3>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
              When someone likes, comments or shares your posts, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map(notif => {
              const { Icon, color } = getNotificationIcon(notif.type);
              return (
                <div key={notif.id} className="flex gap-4 items-start p-4 rounded-[2.5rem] bg-white border border-zinc-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-100 p-0.5 group-hover:rotate-3 transition-transform">
                      {notif.fromUserAvatar ? (
                        <img src={notif.fromUserAvatar} alt="User" className="w-full h-full rounded-[14px] object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-[14px] bg-zinc-100 flex items-center justify-center">
                          <User className="w-7 h-7 text-zinc-300" />
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 rounded-xl p-1.5 border-2 border-white shadow-lg",
                      color
                    )}>
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-zinc-900 leading-snug font-medium">
                      <span className="font-black text-zinc-900">{notif.fromUserName}</span> {getNotificationText(notif.type)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{formatTime(notif.createdAt)}</span>
                      <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Connectro Core</span>
                    </div>
                  </div>
                  <div className="relative group/menu">
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 rounded-xl transition-colors"><MoreHorizontal className="w-4 h-4 text-zinc-400" /></button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white border border-zinc-100 shadow-xl rounded-xl p-1 z-20 min-w-[120px]">
                      <button 
                        onClick={() => handleDelete(notif.id)}
                        className="w-full text-left px-3 py-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        Delete Alert
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 py-8 mt-4">
        <div className="bg-zinc-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-zinc-200">
          <div className="relative z-10">
            <h4 className="text-xl font-black tracking-tighter mb-2">Connectro Privacy</h4>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
              Alerts are automatically cleared after 24 hours to keep your feed fresh.
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-10">
            <AlertCircle className="w-32 h-32" />
          </div>
        </div>
      </div>
    </div>
  );
};
