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
  Italic,
  Bookmark
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, getDoc, limit, setDoc, deleteDoc, increment, Timestamp, serverTimestamp, getDocs } from 'firebase/firestore';
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

  const [activeTab, setActiveTab] = useState('Posts');
  const [avatar, setAvatar] = useState(displayData?.avatar || '');
  const [cover, setCover] = useState(displayData?.cover || '');
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(true);
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
    if (activeTab === 'Posts') return true;
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
      handleFirestoreError(error, OperationType.GET, `users/${targetUserId}`);
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `follows/${followId}`);
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
      handleFirestoreError(error, OperationType.LIST, 'posts');
      setPostsLoading(false);
    });

    return () => unsubscribe();
  }, [targetUserId, user?.uid]);

  useEffect(() => {
    const uid = targetUserId || user?.uid;
    if (!uid || !isOwnProfile) {
      setSavedPosts([]);
      setSavedPostsLoading(false);
      return;
    }

    const savedQuery = query(
      collection(db, 'users', uid, 'savedPosts'),
      orderBy('savedAt', 'desc')
    );

    const unsubscribe = onSnapshot(savedQuery, async (snapshot) => {
      const savedPostIds = snapshot.docs.map(doc => doc.data().postId);
      
      if (savedPostIds.length === 0) {
        setSavedPosts([]);
        setSavedPostsLoading(false);
        return;
      }

      // Fetch actual posts
      try {
        const postsData = [];
        // Firestore 'in' query supports up to 10 items. For simplicity, we fetch them individually or in chunks.
        // Let's fetch them individually for now.
        for (const postId of savedPostIds) {
          const postDoc = await getDoc(doc(db, 'posts', postId));
          if (postDoc.exists()) {
            postsData.push({ id: postDoc.id, ...postDoc.data() });
          }
        }
        setSavedPosts(postsData);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'posts');
      } finally {
        setSavedPostsLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/savedPosts`);
      setSavedPostsLoading(false);
    });

    return () => unsubscribe();
  }, [targetUserId, user?.uid, isOwnProfile]);

  // Fetch real friends
  useEffect(() => {
    const uid = targetUserId || user?.uid;
    if (!uid) return;

    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('uids', 'array-contains', uid)
    );

    const unsubscribe = onSnapshot(friendshipsQuery, async (snapshot) => {
      const ids = snapshot.docs.map(doc => {
        const data = doc.data();
        return data.uids.find((id: string) => id !== uid);
      }).filter(Boolean);

      if (ids.length === 0) {
        setFriends([]);
        setFriendsLoading(false);
        return;
      }

      // Fetch friend details (limit to 6 for profile view)
      const friendDetails = [];
      const idsToFetch = ids.slice(0, 6);
      
      for (const friendId of idsToFetch) {
        try {
          const friendDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', friendId), limit(1)));
          if (!friendDoc.empty) {
            friendDetails.push({ id: friendId, ...friendDoc.docs[0].data() });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'users');
        }
      }
      setFriends(friendDetails);
      setFriendsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friendships');
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
    
    let unsubOutgoing: () => void;
    let unsubIncoming: () => void;

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
        unsubOutgoing = onSnapshot(qOutgoing, (outSnap) => {
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
            unsubIncoming = onSnapshot(qIncoming, (inSnap) => {
              if (!inSnap.empty) {
                setFriendStatus('received');
                setRequestId(inSnap.docs[0].id);
              } else {
                setFriendStatus('none');
                setRequestId(null);
              }
              setFriendshipLoading(false);
            }, (error) => {
              handleFirestoreError(error, OperationType.LIST, 'friendRequests');
              setFriendshipLoading(false);
            });
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'friendRequests');
          setFriendshipLoading(false);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `friendships/${friendshipId}`);
      setFriendshipLoading(false);
    });

    // Listen for follow status
    const followId = `${user.uid}_${targetUserId}`;
    const unsubFollow = onSnapshot(doc(db, 'follows', followId), (docSnap) => {
      setIsFollowing(docSnap.exists());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `follows/${followId}`);
    });

    return () => {
      unsubFriendship();
      if (unsubOutgoing) unsubOutgoing();
      if (unsubIncoming) unsubIncoming();
      unsubFollow();
    };
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
        toUserId: targetUserId,
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
        toUserId: targetUserId,
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
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Website</label>
                  <input 
                    type="text" 
                    value={editFormData.website || ''} 
                    onChange={(e) => setEditFormData({...editFormData, website: e.target.value})}
                    placeholder="e.g. yourdomain.com"
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

      <div className="relative h-48 sm:h-56 bg-zinc-200 group/cover overflow-hidden">
        {cover ? (
          <img src={cover} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover/cover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-zinc-900 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
          </div>
        )}
        
        {!isOwnProfile && (
          <button 
            onClick={onBack} 
            className="absolute top-4 left-4 bg-black/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/30 transition-all active:scale-90 z-30"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {isOwnProfile && (
          <button 
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-full text-white border border-white/20 hover:bg-black/60 transition-all z-20"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="px-4 sm:px-6 relative">
        <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-20">
          <div className="relative group/avatar">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-zinc-100 relative">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-zinc-300" />
                </div>
              )}
            </div>
            {isOwnProfile && (
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-zinc-100 p-1.5 rounded-full text-zinc-900 border-2 border-white shadow-sm hover:bg-zinc-200 transition-all active:scale-90"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {displayData?.firstName} {displayData?.lastName}
            </h2>
            <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
              ★ PRO
            </span>
          </div>
          
          <div className="text-zinc-600 text-sm">
            @{displayData?.firstName?.toLowerCase()}{displayData?.lastName?.toLowerCase()} • {displayData?.category || 'Digital Curator & Visual Storyteller'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          {isOwnProfile ? (
            <>
              <button 
                onClick={() => setIsCreatePostOpen?.(true)}
                className="flex-1 bg-primary text-white py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" strokeWidth={3} /> Add to Story
              </button>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 bg-zinc-100 text-zinc-700 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Edit Profile
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleFollow}
                disabled={followLoading}
                className={cn(
                  "flex-1 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm",
                  isFollowing 
                    ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" 
                    : "bg-primary text-white hover:bg-primary-hover shadow-primary/20"
                )}
              >
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? 'Following' : (
                  <><UserPlus className="w-4 h-4" /> Follow</>
                )}
              </button>
              <button 
                onClick={handleMessage}
                className="flex-1 bg-zinc-100 text-zinc-700 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </button>
            </>
          )}
        </div>

        {/* Bio Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 mb-6">
          <p className="text-zinc-700 italic text-[15px] leading-relaxed mb-6">
            "{displayData?.bio || 'Exploring the intersection of technology and human emotion through pixels. Based in Barcelona. Always looking for the next hidden gem in the city. ✨'}"
          </p>
          
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {displayData?.followers >= 1000 ? `${(displayData.followers / 1000).toFixed(1)}k` : (displayData?.followers || '12.4k')}
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Followers</div>
            </div>
            <div className="w-px h-8 bg-zinc-200"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {displayData?.following || '842'}
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Following</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-between border-b border-zinc-200 mb-6">
          {['Posts', 'Photos', 'About', ...(isOwnProfile ? ['Saved'] : [])].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 px-2 text-xs font-bold uppercase tracking-wider relative transition-all",
                activeTab === tab ? "text-primary" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="profileTab"
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeTab === 'Photos' ? (
          <div className="space-y-3">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filteredPosts.length > 0 ? (
              <>
                {/* Featured Photo */}
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] group cursor-pointer">
                  <img src={filteredPosts[0].image} alt="Featured" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">Featured</span>
                  </div>
                </div>
                
                {/* Photo Grid */}
                {filteredPosts.length > 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                      {filteredPosts.slice(1).filter((_, i) => i % 2 === 0).map((post, i) => (
                        <div key={post.id} className={cn("rounded-3xl overflow-hidden cursor-pointer group", i % 2 === 0 ? "aspect-square" : "aspect-[3/4]")}>
                          <img src={post.image} alt="Photo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {filteredPosts.slice(1).filter((_, i) => i % 2 !== 0).map((post, i) => (
                        <div key={post.id} className={cn("rounded-3xl overflow-hidden cursor-pointer group", i % 2 === 0 ? "aspect-[3/4]" : "aspect-square")}>
                          <img src={post.image} alt="Photo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-zinc-300" />
                </div>
                <p className="text-zinc-900 font-bold text-lg">No photos yet</p>
                <p className="text-zinc-500 text-sm mt-1">When {displayData?.firstName} posts photos, they'll appear here.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'Posts' ? (
          <div className="space-y-6">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onViewProfile={onViewProfile} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-zinc-300" />
                </div>
                <p className="text-zinc-900 font-bold text-lg">No posts yet</p>
                <p className="text-zinc-500 text-sm mt-1">When {displayData?.firstName} posts, you'll see it here.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'About' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">About {displayData?.firstName}</h3>
              
              <div className="space-y-4">
                {displayData?.bio && (
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Bio</p>
                      <p className="text-sm text-zinc-600 mt-1">{displayData.bio}</p>
                    </div>
                  </div>
                )}
                
                {displayData?.category && (
                  <div className="flex gap-3">
                    <Briefcase className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Category</p>
                      <p className="text-sm text-zinc-600 mt-1">{displayData.category}</p>
                    </div>
                  </div>
                )}
                
                {displayData?.location && (
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Location</p>
                      <p className="text-sm text-zinc-600 mt-1">{displayData.location}</p>
                    </div>
                  </div>
                )}
                
                {displayData?.hometown && (
                  <div className="flex gap-3">
                    <Home className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Hometown</p>
                      <p className="text-sm text-zinc-600 mt-1">{displayData.hometown}</p>
                    </div>
                  </div>
                )}
                
                {displayData?.college && (
                  <div className="flex gap-3">
                    <GraduationCap className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">College</p>
                      <p className="text-sm text-zinc-600 mt-1">{displayData.college}</p>
                    </div>
                  </div>
                )}
                
                {displayData?.instagram && (
                  <div className="flex gap-3">
                    <Instagram className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Instagram</p>
                      <a href={`https://instagram.com/${displayData.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block">
                        @{displayData.instagram.replace('@', '')}
                      </a>
                    </div>
                  </div>
                )}
                
                {displayData?.website && (
                  <div className="flex gap-3">
                    <Globe className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Website</p>
                      <a href={displayData.website.startsWith('http') ? displayData.website : `https://${displayData.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block">
                        {displayData.website}
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Joined</p>
                    <p className="text-sm text-zinc-600 mt-1">
                      {displayData?.createdAt ? new Date(displayData.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Saved' ? (
          <div className="space-y-6">
            {savedPostsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : savedPosts.length > 0 ? (
              savedPosts.map(post => (
                <PostCard key={post.id} post={post} onViewProfile={onViewProfile} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="w-8 h-8 text-zinc-300" />
                </div>
                <p className="text-zinc-900 font-bold text-lg">No saved posts</p>
                <p className="text-zinc-500 text-sm mt-1">Posts you save will appear here.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100 shadow-sm">
            <p className="text-zinc-500 text-sm">Content for {activeTab} will appear here.</p>
          </div>
        )}
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
