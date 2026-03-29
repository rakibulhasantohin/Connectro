import React, { useState, useEffect } from 'react';
import { X, Send, User } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: any;
}

interface CommentModalProps {
  postId: string | number;
  onClose: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ postId, onClose }) => {
  const { user, userData } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const commentsRef = collection(db, 'posts', postId.toString(), 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: Comment[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `posts/${postId}/comments`);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !userData) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'posts', postId.toString(), 'comments'), {
        userId: user.uid,
        userName: `${userData.firstName} ${userData.lastName}`,
        userAvatar: userData.avatar || '',
        text: newComment,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', postId.toString()), {
        comments: increment(1)
      });

      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/70 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in duration-300 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100">
          <h3 className="text-lg font-black text-zinc-900 tracking-tighter">Comments</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-90"
          >
            <X className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3 flex-1">
                <p className="font-bold text-xs text-zinc-900">{comment.userName}</p>
                <p className="text-sm text-zinc-700">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-100 flex gap-2">
          <input 
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-zinc-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button 
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 transition-all active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
