import React, { useState, useRef, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, collection, addDoc, getDoc, increment, setDoc } from 'firebase/firestore';
import { Camera, MapPin, GraduationCap, Briefcase, Calendar, User, ArrowRight, Loader2, Upload, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../utils/imageCompressor';

export const OnboardingView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    avatar: '',
    cover: '',
    college: '',
    work: '',
    location: '',
    bio: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData(prev => ({
            ...prev,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            dob: data.dob || '',
            avatar: data.avatar || '',
            cover: data.cover || ''
          }));
        }
      }
    };
    fetchUserData();
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await compressImage(file, 800, 800, 0.7);
        updateField(field, imageUrl);
        
        // Immediate update and post creation as requested
        const user = auth.currentUser;
        if (user) {
          const fullName = `${formData.firstName} ${formData.lastName}`.trim() || user.displayName || 'User';
          
          // Update user doc immediately
          await setDoc(doc(db, 'users', user.uid), {
            [field]: imageUrl,
            postCount: increment(1),
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Create post immediately
          await addDoc(collection(db, 'posts'), {
            userId: user.uid,
            userName: fullName,
            userAvatar: field === 'avatar' ? imageUrl : (formData.avatar || ''),
            text: `updated their ${field === 'avatar' ? 'profile picture' : 'cover photo'}.`,
            image: imageUrl,
            privacy: 'Public',
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: 0,
            shares: 0
          });
        }
      } catch (err) {
        console.error("Error in immediate upload:", err);
      }
    }
  };

  const handleNext = async () => {
    setError('');
    
    // Validation
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dob) {
        setError('Please fill in all basic information.');
        return;
      }
    } else if (step === 2) {
      if (!formData.avatar || !formData.cover) {
        setError('Please upload both profile and cover photos.');
        return;
      }
    } else if (step === 3) {
      if (!formData.college || !formData.work || !formData.location) {
        setError('Please fill in all professional details.');
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          // Final update for onboarding completion and other fields
          await setDoc(doc(db, 'users', user.uid), {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dob: formData.dob,
            college: formData.college,
            work: formData.work,
            location: formData.location,
            bio: formData.bio,
            avatar: formData.avatar,
            cover: formData.cover,
            friendsCount: 0,
            onboardingCompleted: true,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          onComplete();
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">First Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1877F2]"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Last Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1877F2]"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="date" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1877F2]"
                  value={formData.dob}
                  onChange={(e) => updateField('dob', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Profile Photos</h2>
              <p className="text-gray-500 text-sm">Add a profile picture and cover photo to help friends recognize you.</p>
            </div>
            
            <div className="relative">
              {/* Cover Photo Area */}
              <div 
                className="relative h-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden group cursor-pointer transition-all hover:border-[#1877F2]/50"
                onClick={() => coverInputRef.current?.click()}
              >
                {formData.cover ? (
                  <>
                    <img src={formData.cover} className="w-full h-full object-cover" alt="Cover preview" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 p-2 rounded-full shadow-lg">
                        <Camera className="w-6 h-6 text-gray-700" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <span className="text-sm font-bold">Add Cover Photo</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={coverInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'cover')}
                />
              </div>
              
              {/* Avatar Overlap */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div 
                  className="relative w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200 group cursor-pointer transition-all hover:ring-4 hover:ring-[#1877F2]/20"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {formData.avatar ? (
                    <>
                      <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar preview" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <User className="w-16 h-16 opacity-50" />
                      <div className="absolute bottom-2 right-2 p-1.5 bg-[#1877F2] rounded-full text-white shadow-lg">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                  />
                </div>
              </div>
            </div>

            <div className="pt-12 text-center">
              <p className="text-xs text-gray-400 font-medium">Click on the areas above to upload photos from your device</p>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">Professional Details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">College/University</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1877F2]"
                    value={formData.college}
                    onChange={(e) => updateField('college', e.target.value)}
                    placeholder="Where did you study?"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Work</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1877F2]"
                    value={formData.work}
                    onChange={(e) => updateField('work', e.target.value)}
                    placeholder="What do you do?"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1877F2]"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="Where do you live?"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-[#1877F2]">Step {step} of 3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-8 h-1.5 rounded-full ${i <= step ? 'bg-[#1877F2]' : 'bg-gray-100'}`}></div>
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Complete Your Profile</h1>
        </div>

        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-red-500 text-sm font-bold text-center"
          >
            {error}
          </motion.p>
        )}

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          <button 
            onClick={handleNext}
            disabled={loading}
            className="flex-2 bg-[#1877F2] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-2 ml-auto"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 3 ? 'Finish' : 'Next')}
            {step < 3 && !loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
