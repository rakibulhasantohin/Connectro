import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  Smile,
  MapPin,
  Loader2,
  ChevronRight,
  Settings
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
  const [postVideo, setPostVideo] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleCreatePost = async () => {
    if (!postImage && !postVideo) return;
    if (!user || !userData) return;

    setIsPosting(true);
    // Optimistic close - tell the user it's sharing
    onClose();

    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        userName: `${userData.firstName} ${userData.lastName}`,
        userAvatar: userData.avatar || '',
        text: postText,
        image: postImage,
        video: postVideo,
        isReel: !!postVideo,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        privacy: 'public'
      });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { postCount: increment(1) });
      setPostText('');
      setPostImage(null);
      setPostVideo(null);
    } catch (error) {
      console.error(error);
      alert("Failed to share post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') {
          setPostImage(reader.result as string);
          setPostVideo(null);
        } else {
          setPostVideo(reader.result as string);
          setPostImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex flex-col bg-black">
          {/* Header */}
          <div className="px-4 h-14 flex items-center justify-between border-b border-zinc-900 sticky top-0 bg-black">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-1">
                <X className="w-7 h-7 text-white" />
              </button>
              <h3 className="text-xl font-bold text-white">New post</h3>
            </div>
            <button 
              disabled={isPosting || (!postImage && !postVideo)}
              onClick={handleCreatePost}
              className="text-blue-500 font-bold text-lg active:opacity-50 disabled:opacity-50"
            >
              {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Preview Section */}
            {(postImage || postVideo) ? (
              <div className="aspect-square bg-zinc-900 group relative">
                {postImage && <img src={postImage} className="w-full h-full object-cover" alt="" />}
                {postVideo && <video src={postVideo} autoPlay muted loop className="w-full h-full object-cover" />}
                <button 
                  onClick={() => { setPostImage(null); setPostVideo(null); }}
                  className="absolute top-4 right-4 bg-black/60 p-2 rounded-full"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="aspect-square bg-zinc-900 flex flex-col items-center justify-center gap-6 p-10">
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-zinc-500" />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold"
                  >
                    Select Photo
                  </button>
                  <button 
                    onClick={() => videoInputRef.current?.click()}
                    className="bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold"
                  >
                    Select Video
                  </button>
                </div>
              </div>
            )}

            {/* Caption Area */}
            <div className="p-4 border-b border-zinc-900 flex gap-4">
              <img src={userData?.avatar} className="w-10 h-10 rounded-full object-cover" />
              <textarea 
                placeholder="Write a caption..."
                className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-zinc-500 resize-none min-h-[40px] text-white"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />
            </div>

            {/* Options List */}
            <div className="divide-y divide-zinc-900">
               <div className="flex items-center justify-between p-4 cursor-pointer active:bg-zinc-900 transition-colors">
                 <div className="flex items-center gap-3">
                   <MapPin className="w-5 h-5" />
                   <span className="text-sm">Add location</span>
                 </div>
                 <ChevronRight className="w-4 h-4 text-zinc-500" />
               </div>
               <div className="flex items-center justify-between p-4 cursor-pointer active:bg-zinc-900 transition-colors">
                 <div className="flex items-center gap-3">
                   <Smile className="w-5 h-5" />
                   <span className="text-sm">Tag people</span>
                 </div>
                 <ChevronRight className="w-4 h-4 text-zinc-500" />
               </div>
               <div className="flex items-center justify-between p-4 cursor-pointer active:bg-zinc-900 transition-colors">
                 <div className="flex items-center gap-3 text-zinc-400">
                   <Settings className="w-5 h-5" />
                   <span className="text-sm">Advanced settings</span>
                 </div>
                 <ChevronRight className="w-4 h-4 text-zinc-500" />
               </div>
            </div>
          </div>

          <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'image')} />
          <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={e => handleFileChange(e, 'video')} />
        </div>
      )}
    </AnimatePresence>
  );
};
