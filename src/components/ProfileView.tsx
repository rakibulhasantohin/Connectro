import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Edit3, 
  MoreHorizontal, 
  Grid, 
  Video, 
  UserCheck, 
  MessageSquare, 
  ChevronLeft,
  Home,
  Settings,
  Music,
  Check,
  Plus,
  BadgeCheck,
  ArrowLeft,
  Search,
  Image as ImageIcon,
  User,
  UserPlus,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  LayoutDashboard,
  Flag,
  Music2,
  X,
  Loader2,
  Globe,
  Users,
  Upload,
  CheckCircle,
  FileText,
  Cake,
  Instagram,
  Pencil,
  MoreVertical,
  ChevronDown,
  Bold,
  Italic
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { doc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, getDoc, limit, setDoc, deleteDoc, increment, Timestamp, serverTimestamp } from 'firebase/firestore';
import { PostCard } from './PostCard';
import { motion, AnimatePresence } from 'motion/react';
import { MUSIC_OPTIONS } from '../constants';

interface ProfileViewProps {
  targetUserId?: string | null;
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
  setIsCreatePostOpen?: (isOpen: boolean) => void;
  onOpenChat?: (chatId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  targetUserId, 
  onBack, 
  onViewProfile,
  setIsCreatePostOpen,
  onOpenChat
}) => {
  const { user, userData: currentUserData } = useUser();
  const [targetUserData, setTargetUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const isOwnProfile = !targetUserId || targetUserId === user?.uid;
  const displayData = isOwnProfile ? currentUserData : targetUserData;

  const [activeTab, setActiveTab] = useState('All');
  const [avatar, setAvatar] = useState(displayData?.avatar || '');
  const [cover, setCover] = useState(displayData?.cover || '');
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Reels') return !!post.video;
    if (activeTab === 'Photos') return !!post.image;
    return false;
  });

  useEffect(() => {
    if (displayData) {
      setAvatar(displayData.avatar || '');
      setCover(displayData.cover || '');
      setEditFormData(displayData);
    }
  }, [displayData]);

  // Fetch target user data if not own profile
  useEffect(() => {
    if (!targetUserId || targetUserId === user?.uid) {
      setTargetUserData(null);
      return;
    }

    setLoadingUser(true);
    const unsubscribe = onSnapshot(doc(db, 'users', targetUserId), (doc) => {
      if (doc.exists()) {
        setTargetUserData(doc.data());
      }
      setLoadingUser(false);
    }, (error) => {
      console.error("Error fetching target user:", error);
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, [targetUserId, user?.uid]);

  // Check if following
  useEffect(() => {
    if (!user || !targetUserId || targetUserId === user.uid) return;

    const followId = `${user.uid}_${targetUserId}`;
    const unsubscribe = onSnapshot(doc(db, 'follows', followId), (doc) => {
      setIsFollowing(doc.exists());
    });

    return () => unsubscribe();
  }, [user, targetUserId]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result as string;
        setAvatar(url);
        try {
          await updateDoc(doc(db, 'users', user.uid), { avatar: url });
          
          // Create post for profile picture update
          await addDoc(collection(db, 'posts'), {
            userId: user.uid,
            userName: `${currentUserData?.firstName} ${currentUserData?.lastName}`.trim() || user.displayName || 'User',
            userAvatar: url,
            text: `updated their profile picture.`,
            image: url,
            privacy: 'Public',
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: 0,
            shares: 0
          });
        } catch (err) {
          console.error("Error updating avatar:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result as string;
        setCover(url);
        try {
          await updateDoc(doc(db, 'users', user.uid), { cover: url });
          
          // Create post for cover photo update
          await addDoc(collection(db, 'posts'), {
            userId: user.uid,
            userName: `${currentUserData?.firstName} ${currentUserData?.lastName}`.trim() || user.displayName || 'User',
            userAvatar: avatar || '',
            text: `updated their cover photo.`,
            image: url,
            privacy: 'Public',
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: 0,
            shares: 0
          });
        } catch (err) {
          console.error("Error updating cover:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const uid = targetUserId || user?.uid;
    if (!uid) return;

    const q = query(
      collection(db, 'posts'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setPostsLoading(false);
    }, (error) => {
      console.error("Error fetching profile posts:", error);
      setPostsLoading(false);
    });

    return () => unsubscribe();
  }, [targetUserId, user?.uid]);

  // Fetch some random users as "Friends" for now
  useEffect(() => {
    const q = query(collection(db, 'users'), where('onboardingCompleted', '==', true), limit(6));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== (targetUserId || user?.uid)); // Don't show current profile user in friends list
      setFriends(usersData);
      setFriendsLoading(false);
    });
    return () => unsubscribe();
  }, [targetUserId, user?.uid]);

  const personalDetails = [
    { icon: MapPin, label: displayData?.location || 'Gazipur, Dhaka, Bangladesh' },
    { icon: Home, label: displayData?.hometown || 'Netrokona' },
    { icon: Cake, label: displayData?.dob || 'May 5' },
  ];
  const educationDetails = [
    { icon: GraduationCap, label: displayData?.college || 'Abdul Awal Degree College' },
  ];
  const hobbies = displayData?.hobbies || ['Listening to Music', 'Traveling', 'Photography', 'Vlogging', 'Content Creation'];
  const interests = displayData?.interests || ['Bachelor Point', 'Testament: The Story Of Moses'];

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const wrapText = (tag: string) => {
    if (!bioRef.current) return;
    const textarea = bioRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editFormData.bio || '';
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + tag + selectedText + tag + text.substring(end);
    
    if (newText.length > 150) {
      showToast('Bio cannot exceed 150 characters');
      return;
    }
    
    setEditFormData({ ...editFormData, bio: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, end + tag.length);
    }, 0);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), editFormData);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const [friendStatus, setFriendStatus] = useState<'none' | 'sent' | 'received' | 'friends'>('none');
  const [friendshipLoading, setFriendshipLoading] = useState(true);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !targetUserId || isOwnProfile) {
      setFriendshipLoading(false);
      return;
    }

    setFriendshipLoading(true);
    const friendshipId = [user.uid, targetUserId].sort().join('_');
    
    // Listen for friendship
    const unsubFriendship = onSnapshot(doc(db, 'friendships', friendshipId), (fDoc) => {
      if (fDoc.exists()) {
        setFriendStatus('friends');
        setFriendshipLoading(false);
      } else {
        // Check for outgoing request
        const qOutgoing = query(
          collection(db, 'friendRequests'),
          where('fromUserId', '==', user.uid),
          where('toUserId', '==', targetUserId)
        );
        const unsubOutgoing = onSnapshot(qOutgoing, (outSnap) => {
          if (!outSnap.empty) {
            setFriendStatus('sent');
            setRequestId(outSnap.docs[0].id);
            setFriendshipLoading(false);
          } else {
            // Check for incoming request
            const qIncoming = query(
              collection(db, 'friendRequests'),
              where('fromUserId', '==', targetUserId),
              where('toUserId', '==', user.uid)
            );
            const unsubIncoming = onSnapshot(qIncoming, (inSnap) => {
              if (!inSnap.empty) {
                setFriendStatus('received');
                setRequestId(inSnap.docs[0].id);
              } else {
                setFriendStatus('none');
                setRequestId(null);
              }
              setFriendshipLoading(false);
            });
            return () => unsubIncoming();
          }
        });
        return () => unsubOutgoing();
      }
    });

    return () => unsubFriendship();
  }, [user, targetUserId, isOwnProfile]);

  const handleAddFriend = async () => {
    if (!user || !targetUserId || !currentUserData) return;
    setFriendshipLoading(true);
    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        toUserId: targetUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        fromUserId: user.uid,
        fromUserName: `${currentUserData.firstName} ${currentUserData.lastName}`,
        fromUserAvatar: currentUserData.avatar || '',
        type: 'friend_request',
        text: 'sent you a friend request',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding friend:", error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestId) return;
    setFriendshipLoading(true);
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (error) {
      console.error("Error cancelling request:", error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!user || !targetUserId || !requestId || !currentUserData) return;
    setFriendshipLoading(true);
    try {
      // 1. Delete request
      await deleteDoc(doc(db, 'friendRequests', requestId));
      
      // 2. Create friendship
      const friendshipId = [user.uid, targetUserId].sort().join('_');
      await setDoc(doc(db, 'friendships', friendshipId), {
        uids: [user.uid, targetUserId],
        createdAt: serverTimestamp()
      });

      // 3. Create chat
      await setDoc(doc(db, 'chats', friendshipId), {
        participants: [user.uid, targetUserId],
        lastMessage: 'You are now friends! Say hi.',
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [user.uid]: 0,
          [targetUserId]: 0
        }
      });

      // 4. Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        fromUserId: user.uid,
        fromUserName: `${currentUserData.firstName} ${currentUserData.lastName}`,
        fromUserAvatar: currentUserData.avatar || '',
        type: 'friend_accept',
        text: 'accepted your friend request',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleMessage = () => {
    if (!user || !targetUserId) return;
    
    // Switch to messages tab and select this chat
    const chatId = [user.uid, targetUserId].sort().join('_');
    if (onOpenChat) {
      onOpenChat(chatId);
    }
  };

  const handleFollow = async () => {
    if (!user || !targetUserId || followLoading) return;
    setFollowLoading(true);

    const followId = `${user.uid}_${targetUserId}`;
    const followRef = doc(db, 'follows', followId);
    const currentUserRef = doc(db, 'users', user.uid);
    const targetUserRef = doc(db, 'users', targetUserId);

    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(followRef);
        await updateDoc(currentUserRef, { following: increment(-1) });
        await updateDoc(targetUserRef, { followers: increment(-1) });
      } else {
        // Follow
        await setDoc(followRef, {
          followerId: user.uid,
          followingId: targetUserId,
          createdAt: Timestamp.now()
        });
        await updateDoc(currentUserRef, { following: increment(1) });
        await updateDoc(targetUserRef, { followers: increment(1) });
        
        // Create notification
        await addDoc(collection(db, 'notifications'), {
          toUserId: targetUserId,
          fromUserId: user.uid,
          fromUserName: `${currentUserData?.firstName} ${currentUserData?.lastName}`,
          fromUserAvatar: currentUserData?.avatar || '',
          type: 'follow',
          postId: 'profile',
          createdAt: Timestamp.now(),
          read: false
        });
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && currentUserData) {
      setUploadingStory(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await addDoc(collection(db, 'stories'), {
            userId: user.uid,
            userName: `${currentUserData.firstName} ${currentUserData.lastName}`,
            userAvatar: currentUserData.avatar || '',
            image: reader.result as string,
            music: selectedMusic,
            createdAt: new Date().toISOString(),
            type: file.type.startsWith('video') ? 'video' : 'image'
          });
          setSelectedMusic(null);
          setShowMusicPicker(false);
          alert('Story uploaded successfully! You can view it in the Home feed.');
        } catch (error) {
          console.error("Error adding story:", error);
          alert('Failed to upload story. Please try again.');
        } finally {
          setUploadingStory(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-zinc-50 min-h-full pb-20">
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={handleAvatarChange} 
        className="hidden" 
        accept="image/*"
      />
      <input 
        type="file" 
        ref={coverInputRef} 
        onChange={handleCoverChange} 
        className="hidden" 
        accept="image/*"
      />
      <input 
        type="file" 
        ref={storyInputRef}
        onChange={handleStoryUpload} 
        className="hidden" 
        accept="image/*,video/*"
      />

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[300] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Edit Profile</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-90"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Basic Info</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">First Name</label>
                    <input 
                      type="text" 
                      value={editFormData.firstName || ''} 
                      onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Last Name</label>
                    <input 
                      type="text" 
                      value={editFormData.lastName || ''} 
                      onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bio</label>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      (editFormData.bio?.length || 0) > 140 ? "text-rose-500" : "text-zinc-400"
                    )}>
                      {editFormData.bio?.length || 0} / 150
                    </span>
                  </div>
                  <div className="relative">
                    <textarea 
                      ref={bioRef}
                      value={editFormData.bio || ''} 
                      onChange={(e) => {
                        if (e.target.value.length <= 150) {
                          setEditFormData({...editFormData, bio: e.target.value});
                        }
                      }}
                      placeholder="Tell your story..."
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary outline-none min-h-[120px] resize-none pb-12"
                    />
                    <div className="absolute bottom-3 left-3 flex gap-1">
                      <button 
                        onClick={() => wrapText('**')}
                        className="w-8 h-8 bg-white border border-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-50 transition-all active:scale-90 shadow-sm"
                        title="Bold"
                      >
                        <Bold className="w-4 h-4 text-zinc-600" />
                      </button>
                      <button 
                        onClick={() => wrapText('*')}
                        className="w-8 h-8 bg-white border border-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-50 transition-all active:scale-90 shadow-sm"
                        title="Italic"
                      >
                        <Italic className="w-4 h-4 text-zinc-600" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Category</label>
                  <input 
                    type="text" 
                    value={editFormData.category || ''} 
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    placeholder="e.g. Digital creator"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Personal Details</h4>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    type="text" 
                    value={editFormData.location || ''} 
                    onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hometown</label>
                  <input 
                    type="text" 
                    value={editFormData.hometown || ''} 
                    onChange={(e) => setEditFormData({...editFormData, hometown: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">College</label>
                  <input 
                    type="text" 
                    value={editFormData.college || ''} 
                    onChange={(e) => setEditFormData({...editFormData, college: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Instagram Handle</label>
                  <input 
                    type="text" 
                    value={editFormData.instagram || ''} 
                    onChange={(e) => setEditFormData({...editFormData, instagram: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100">
              <button 
                onClick={handleUpdateProfile}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-primary/25 active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Music Picker Modal */}
      {showMusicPicker && (
        <div className="fixed inset-0 z-[250] bg-zinc-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-100">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">
                  Connectro Audio
                </h3>
              </div>
              <button onClick={() => setShowMusicPicker(false)} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90 border border-zinc-100">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto no-scrollbar">
              {MUSIC_OPTIONS.map(music => (
                <div 
                  key={music.id}
                  onClick={() => setSelectedMusic(music.title)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[1.8rem] cursor-pointer transition-all duration-300 group",
                    selectedMusic === music.title 
                      ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]" 
                      : "bg-zinc-50 hover:bg-zinc-100 border border-transparent hover:border-zinc-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:rotate-6",
                    selectedMusic === music.title ? "bg-white/20" : "bg-white"
                  )}>
                    <Music2 className={cn("w-6 h-6", selectedMusic === music.title ? "text-white" : "text-primary")} />
                  </div>
                  <div className="flex-1">
                    <p className={cn("font-black uppercase tracking-widest text-[11px]", selectedMusic === music.title ? "text-white" : "text-zinc-900")}>{music.title}</p>
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-0.5", selectedMusic === music.title ? "text-white/70" : "text-zinc-500")}>{music.artist}</p>
                  </div>
                  {selectedMusic === music.title && (
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white p-4 rounded-2xl border border-zinc-100">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>{selectedMusic ? `Linked: ${selectedMusic}` : 'No signal detected'}</span>
              </div>
              <button 
                disabled={uploadingStory}
                onClick={() => storyInputRef.current?.click()}
                className="w-full bg-primary text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
              >
                {uploadingStory ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                Transmit Signal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative h-64 sm:h-80 bg-zinc-200 group/cover overflow-hidden">
        {cover ? (
          <img src={cover} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover/cover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-900 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
          </div>
        )}
        
        {isOwnProfile && (
          <button 
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-xl p-2.5 rounded-xl text-white border border-white/20 hover:bg-white/30 transition-all shadow-2xl active:scale-90 z-20"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}

        {/* Top Navigation */}
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center">
          <button onClick={onBack} className="bg-black/20 backdrop-blur-md p-2.5 rounded-2xl text-white hover:bg-black/30 transition-all active:scale-90">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button className="bg-black/20 backdrop-blur-md p-2.5 rounded-2xl text-white hover:bg-black/30 transition-all active:scale-90"><Pencil className="w-5 h-5" /></button>
            <button className="bg-black/20 backdrop-blur-md p-2.5 rounded-2xl text-white hover:bg-black/30 transition-all active:scale-90"><Search className="w-5 h-5" /></button>
            <button className="bg-black/20 backdrop-blur-md p-2.5 rounded-2xl text-white hover:bg-black/30 transition-all active:scale-90"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="px-5 sm:px-8 relative">
        <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-6 relative z-20">
          <div className="relative group/avatar">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-zinc-100 relative">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-zinc-300" />
                </div>
              )}
            </div>
            {isOwnProfile && (
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-zinc-100 p-2.5 rounded-full text-zinc-900 border-4 border-white shadow-lg hover:bg-zinc-200 transition-all active:scale-90"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="pb-2">
            <button className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 hover:bg-zinc-200 transition-all active:scale-90 relative">
              <ChevronDown className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></div>
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">
              {displayData?.firstName} {displayData?.lastName}
            </h2>
            {displayData?.verified && <BadgeCheck className="w-6 h-6 text-primary fill-primary/10" />}
          </div>
          
          <div className="flex items-center gap-2 text-zinc-500 font-black text-xs uppercase tracking-widest">
            <span>{displayData?.followers || 0} followers</span>
            <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
            <span>{displayData?.following || 0} following</span>
            <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
            <span>{displayData?.postCount || 0} posts</span>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs">
            <span>Profile</span>
            <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
            <span>{displayData?.category || 'Digital creator'}</span>
          </div>
          <div className={cn(
            "text-zinc-800 font-medium text-[15px] leading-relaxed max-w-md",
            !showFullBio && "line-clamp-2"
          )}>
            <Markdown
              components={{
                p: ({ children }) => <span className="block">{children}</span>,
                strong: ({ children }) => <strong className="font-black text-zinc-900">{children}</strong>,
                em: ({ children }) => <em className="italic text-zinc-700">{children}</em>,
              }}
            >
              {displayData?.bio || 'What a pity I feel for eating for myself! 🤍'}
            </Markdown>
          </div>
          <button 
            onClick={() => setShowFullBio(!showFullBio)}
            className="text-zinc-400 font-bold text-sm hover:text-zinc-600 transition-colors"
          >
            {showFullBio ? '... See less' : '... See more'}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 text-sm font-bold text-zinc-900">
            <Briefcase className="w-5 h-5 text-zinc-400" />
            <div className="flex items-center gap-2">
              <span>{displayData?.category || 'Digital creator'}</span>
              <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
              <span>{displayData?.college || 'Abdul Awal Degree College'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm font-bold text-zinc-900">
            <Instagram className="w-5 h-5 text-zinc-400" />
            <span>{displayData?.instagram || 'rakibulhasantuhiin'}</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-white shadow-sm overflow-hidden">
                  <img src={`https://picsum.photos/seed/friend${i}/100/100`} alt="Friend" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-sm font-bold text-zinc-800">Friends with things in common</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8">
          {isOwnProfile ? (
            <div className="space-y-3">
              <button 
                onClick={() => setIsCreatePostOpen?.(true)}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-primary/25 flex items-center justify-center gap-3"
              >
                <Plus className="w-5 h-5" /> Create Post
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => showToast('Dashboard coming soon')}
                  className="bg-zinc-100 text-zinc-900 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-zinc-100 text-zinc-900 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className={cn("grid gap-3", friendStatus === 'friends' ? "grid-cols-2" : "grid-cols-1")}>
                {/* Friend Status Button */}
                {friendStatus === 'friends' ? (
                  <button 
                    className="bg-zinc-100 text-zinc-900 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    onClick={() => showToast('Friendship options coming soon')}
                  >
                    <UserCheck className="w-4 h-4" /> Friends
                  </button>
                ) : friendStatus === 'sent' ? (
                  <button 
                    onClick={handleCancelRequest}
                    disabled={friendshipLoading}
                    className="bg-zinc-100 text-zinc-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {friendshipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Cancel
                  </button>
                ) : friendStatus === 'received' ? (
                  <button 
                    onClick={handleAcceptRequest}
                    disabled={friendshipLoading}
                    className="bg-primary text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {friendshipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Accept
                  </button>
                ) : (
                  <button 
                    onClick={handleAddFriend}
                    disabled={friendshipLoading}
                    className="bg-primary text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {friendshipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add Friend
                  </button>
                )}

                {/* Message Button */}
                {friendStatus === 'friends' && (
                  <button 
                    onClick={handleMessage}
                    className="bg-primary text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                )}
              </div>

              {/* Follow Button */}
              <button 
                onClick={handleFollow}
                disabled={followLoading}
                className={cn(
                  "w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                  isFollowing 
                    ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" 
                    : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-900/20"
                )}
              >
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>
        <div className="mt-3">
          <button 
            onClick={() => showToast('Advertise coming soon')}
            className="w-full bg-zinc-100 text-zinc-900 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Flag className="w-4 h-4" /> Advertise
          </button>
        </div>
      </div>

      <div className="mt-8 px-5 sm:px-8">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-zinc-100 overflow-x-auto no-scrollbar pb-1">
          {['All', 'Reels', 'Photos', 'Events'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 px-1 text-sm font-black uppercase tracking-widest relative transition-all",
                activeTab === tab ? "text-primary" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
                />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: Details & Friends */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Personal details</h3>
                {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="text-zinc-400 hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>}
              </div>
              <div className="space-y-6">
                {personalDetails.map((detail, i) => (
                  <div key={i} className="flex items-center gap-4 text-zinc-600 group">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <detail.icon className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">{detail.label}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3 rounded-2xl bg-zinc-50 text-zinc-500 font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all">See more details</button>
              
              <div className="mt-10 pt-10 border-t border-zinc-50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Education</h3>
                  {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="text-zinc-400 hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>}
                </div>
                <div className="space-y-6">
                  {educationDetails.map((detail, i) => (
                    <div key={i} className="flex items-center gap-4 text-zinc-600 group">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <detail.icon className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-sm font-bold text-zinc-900">{detail.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-zinc-50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Hobbies</h3>
                  {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="text-zinc-400 hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {hobbies.map((hobby, i) => (
                    <span key={i} className="px-4 py-2 bg-zinc-50 text-zinc-800 text-xs font-bold rounded-xl border border-zinc-100">{hobby}</span>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-zinc-50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Interests</h3>
                  {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="text-zinc-400 hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>}
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">TV shows</p>
                  {interests.map((interest, i) => (
                    <div key={i} className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl group-hover:bg-zinc-200 transition-colors"></div>
                      <span className="text-sm font-bold text-zinc-900">{interest}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 rounded-2xl bg-zinc-50 text-zinc-500 font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all">See more</button>
              </div>
            </div>

            {/* Friends Section */}
            <div className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Friends</h3>
                  <p className="text-xs text-zinc-400 font-bold mt-1">1,248 friends</p>
                </div>
                <button className="text-primary font-black text-xs uppercase tracking-widest hover:underline">See all</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {friendsLoading ? (
                  [1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-zinc-100 rounded-3xl animate-pulse" />
                  ))
                ) : friends.length > 0 ? (
                  friends.map(friend => (
                    <div 
                      key={friend.id} 
                      onClick={() => onViewProfile?.(friend.id)}
                      className="flex flex-col gap-2 cursor-pointer group"
                    >
                      <div className="aspect-square rounded-3xl overflow-hidden bg-zinc-100 border-2 border-zinc-50 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-50">
                            <User className="w-8 h-8 text-zinc-200" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-zinc-900 truncate px-1 text-center">
                        {friend.firstName} {friend.lastName}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-12 text-center text-zinc-400 text-[10px] font-black uppercase tracking-widest bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
                    No friends
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Tabs & Posts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Post Creation Area */}
            {isOwnProfile && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-100 border-2 border-zinc-50 shadow-md">
                    {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-full h-full text-zinc-400 p-3" />}
                  </div>
                  <div 
                    onClick={() => setIsCreatePostOpen?.(true)}
                    className="flex-1 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-3xl px-6 py-4 text-zinc-400 font-bold text-base cursor-pointer"
                  >
                    What's on your mind?
                  </div>
                  <div 
                    onClick={() => setIsCreatePostOpen?.(true)}
                    className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 cursor-pointer hover:bg-emerald-100 transition-all"
                  >
                    <ImageIcon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex gap-4 border-t border-zinc-50 pt-6">
                  <button 
                    onClick={() => setIsCreatePostOpen?.(true)}
                    className="flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl bg-rose-50 text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                  >
                    <Video className="w-5 h-5" /> Reel
                  </button>
                  <button 
                    onClick={() => setIsCreatePostOpen?.(true)}
                    className="flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
                  >
                    <UserCheck className="w-5 h-5" /> Live
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter">All posts</h3>
              <button className="text-primary font-black text-xs uppercase tracking-widest hover:underline">Filters</button>
            </div>

            <button className="w-full bg-white p-5 rounded-[2rem] shadow-sm border border-zinc-100 flex items-center justify-center gap-3 font-black text-xs text-zinc-900 uppercase tracking-widest hover:bg-zinc-50 transition-all active:scale-[0.98]">
              <FileText className="w-5 h-5 text-primary" /> Manage posts
            </button>

            {/* Posts Section */}
            <div className="space-y-8">
              {postsLoading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <PostCard key={post.id} post={post} onViewProfile={onViewProfile} />
                ))
              ) : (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <FileText className="w-12 h-12 text-zinc-200 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-zinc-900 font-black text-2xl tracking-tighter uppercase">No signals detected</p>
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-2">Initialize your first transmission to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl border border-white/10"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
