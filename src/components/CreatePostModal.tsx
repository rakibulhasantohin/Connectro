import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  Smile,
  MapPin,
  Users,
  Globe,
  Loader2,
  User,
  Lock,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { userData, user } = useUser();
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const postInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && !postImage) return;
    if (!user || !userData) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        userName: `${userData.firstName} ${userData.lastName}`,
        userAvatar: userData.avatar || '',
        text: postText,
        image: postImage,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        privacy: privacy
      });

      // Increment postCount in user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        postCount: increment(1)
      });

      setPostText('');
      setPostImage(null);
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setPostImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Create Signal</h3>
              <button 
                onClick={onClose} 
                className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-90"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 border-2 border-zinc-50 shadow-md">
                  {userData?.avatar ? <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-full h-full text-zinc-400 p-3" />}
                </div>
                <div>
                  <p className="font-black text-zinc-900 text-sm">{userData?.firstName} {userData?.lastName}</p>
                  <div className="relative">
                    <button 
                      onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                      className="flex items-center gap-2 mt-1 px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg w-fit transition-colors active:scale-95"
                    >
                      {privacy === 'public' && <Globe className="w-3 h-3 text-zinc-500" />}
                      {privacy === 'friends' && <Users className="w-3 h-3 text-zinc-500" />}
                      {privacy === 'private' && <Lock className="w-3 h-3 text-zinc-500" />}
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {privacy === 'public' && 'Public Transmission'}
                        {privacy === 'friends' && 'Friends Only'}
                        {privacy === 'private' && 'Private Signal'}
                      </span>
                      <ChevronDown className="w-3 h-3 text-zinc-400" />
                    </button>

                    {showPrivacyMenu && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-zinc-100 p-1 z-50 animate-in fade-in zoom-in duration-200">
                        <button 
                          onClick={() => { setPrivacy('public'); setShowPrivacyMenu(false); }}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-colors",
                            privacy === 'public' ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-50"
                          )}
                        >
                          <Globe className="w-4 h-4" /> Public
                        </button>
                        <button 
                          onClick={() => { setPrivacy('friends'); setShowPrivacyMenu(false); }}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-colors",
                            privacy === 'friends' ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-50"
                          )}
                        >
                          <Users className="w-4 h-4" /> Friends
                        </button>
                        <button 
                          onClick={() => { setPrivacy('private'); setShowPrivacyMenu(false); }}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-colors",
                            privacy === 'private' ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-50"
                          )}
                        >
                          <Lock className="w-4 h-4" /> Private
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <textarea 
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[120px] text-lg font-bold text-zinc-900 placeholder:text-zinc-300 resize-none outline-none bg-transparent"
              />

              {postImage && (
                <div className="relative rounded-[2rem] overflow-hidden border-4 border-zinc-50 shadow-xl group">
                  <img src={postImage} alt="Post" className="w-full h-auto" />
                  <button 
                    onClick={() => setPostImage(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-black/70 transition-all active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="p-4 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Add to your signal</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => postInputRef.current?.click()}
                      className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-all active:scale-90 shadow-sm border border-zinc-100"
                    >
                      <ImageIcon className="w-6 h-6" />
                    </button>
                    <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all active:scale-90 shadow-sm border border-zinc-100">
                      <Video className="w-6 h-6" />
                    </button>
                    <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 hover:bg-amber-50 transition-all active:scale-90 shadow-sm border border-zinc-100">
                      <Smile className="w-6 h-6" />
                    </button>
                    <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all active:scale-90 shadow-sm border border-zinc-100">
                      <MapPin className="w-6 h-6" />
                    </button>
                  </div>
                  <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-all active:scale-90 shadow-sm border border-zinc-100">
                    <Users className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100">
              <button 
                disabled={isPosting || (!postText.trim() && !postImage)}
                onClick={handleCreatePost}
                className="w-full bg-primary text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center justify-center gap-3"
              >
                {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Initialize Transmission'}
              </button>
            </div>

            <input 
              type="file" 
              ref={postInputRef} 
              onChange={handlePostImageChange} 
              className="hidden" 
              accept="image/*"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
