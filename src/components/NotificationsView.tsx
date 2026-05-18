import React, { useState, useEffect } from 'react';
import { User, Bell, Heart, Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';

interface Notification {
  id: string;
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  type: string;
  postId?: string;
  createdAt: any;
  read: boolean;
}

interface NotificationsViewProps {
  onViewProfile?: (userId: string) => void;
  onBack?: () => void;
}

const formatTime = (ts: any) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
};

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onViewProfile, onBack }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
    return () => unsub();
  }, [user]);

  const getNotifText = (n: Notification) => {
    switch (n.type) {
      case 'like': return 'liked your photo.';
      case 'love': return 'loved your photo.';
      case 'comment': return 'commented on your photo.';
      case 'follow': return 'started following you.';
      case 'friend_request': return 'sent you a friend request.';
      case 'friend_accept': return 'accepted your friend request.';
      default: return 'interacted with you.';
    }
  };

  const sections = [
    { title: 'New', data: notifications.slice(0, 3) },
    { title: 'Today', data: notifications.slice(3, 10) },
    { title: 'Earlier', data: notifications.slice(10) }
  ].filter(s => s.data.length > 0);

  return (
    <div className="bg-black min-h-full text-white pb-20">
      <div className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-black z-30 border-b border-zinc-900/50">
        <button onClick={onBack} className="p-1">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>

      <div className="px-4 py-2 space-y-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8" />
            </div>
            <p className="font-bold">Activity On Your Posts</p>
            <p className="text-sm text-zinc-500 max-w-[200px] mx-auto mt-2">When someone likes or comments on one of your posts, you'll see it here.</p>
          </div>
        ) : (
          sections.map(section => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-bold">{section.title}</h3>
              <div className="space-y-4">
                {section.data.map(notif => (
                  <div key={notif.id} className="flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0" onClick={() => onViewProfile?.(notif.fromUserId)}>
                        <img src={notif.fromUserAvatar || ''} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="text-sm leading-tight">
                        <span 
                          className="font-bold cursor-pointer hover:text-zinc-400"
                          onClick={() => onViewProfile?.(notif.fromUserId)}
                        >
                          {notif.fromUserName}
                        </span>
                        {' '}{getNotifText(notif)}
                        <span className="text-zinc-500 ml-1">{formatTime(notif.createdAt)}</span>
                      </div>
                    </div>
                    {/* Thumb or Follow button */}
                    {notif.type === 'follow' || notif.type === 'friend_request' ? (
                      <button className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-transform">
                        Follow
                      </button>
                    ) : (
                      <div className="w-11 h-11 bg-zinc-900 rounded overflow-hidden flex-shrink-0">
                        {/* If we had the post image in notification, we'd show it here */}
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-3 h-3 text-zinc-700 fill-zinc-700" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
