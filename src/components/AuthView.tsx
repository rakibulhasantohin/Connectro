import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'mobile'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Ensure user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          avatar: user.photoURL,
          onboardingCompleted: false,
          followers: 0,
          following: 0,
          postCount: 0,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // Ensure user document exists even on login
        const userDocRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || email.split('@')[0],
            onboardingCompleted: false,
            followers: 0,
            following: 0,
            postCount: 0,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        if (!fullName) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        const [firstName, ...lastNames] = fullName.split(' ');
        const lastName = lastNames.join(' ');

        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          firstName: firstName || '',
          lastName: lastName || '',
          displayName: fullName,
          onboardingCompleted: false,
          followers: 0,
          following: 0,
          postCount: 0,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center p-4 sm:p-6 font-sans">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-primary tracking-tight">Connectro</h1>
        <div className="text-sm">
          <span className="text-zinc-500 mr-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-sm p-8 sm:p-10"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-zinc-900 mb-3 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-zinc-500 text-[15px] leading-relaxed">
            {isLogin ? 'Enter your details to access your account.' : 'Start your journey with Connectro today.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-6">
          {/* Auth Method Toggle */}
          {!isLogin && (
            <div className="flex p-1 bg-zinc-100/80 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                  authMethod === 'email' 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('mobile')}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                  authMethod === 'mobile' 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Mobile
              </button>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-zinc-900 placeholder:text-zinc-400 font-medium"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {authMethod === 'email' ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-zinc-900 placeholder:text-zinc-400 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-500">+1</span>
                <input 
                  type="tel" 
                  placeholder="000 000 0000" 
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-zinc-900 placeholder:text-zinc-400 font-medium"
                  value={email} // Reusing email state for simplicity in this demo
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="w-full pl-12 pr-12 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-zinc-900 placeholder:text-zinc-400 font-medium tracking-widest"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-[15px] hover:bg-primary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-8"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'LOG IN' : 'CREATE MY ACCOUNT')}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-zinc-100"></div>
          <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">
            {isLogin ? 'Or log in with' : 'Or sign up with'}
          </span>
          <div className="flex-1 h-px bg-zinc-100"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-colors active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="font-bold text-zinc-700 text-sm">Google</span>
          </button>
          <button className="flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-colors active:scale-[0.98]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.34-.73 3.83-.66 2.16.1 3.47 1.07 4.28 2.65-3.6 2.15-2.98 6.98.64 8.46-.77 1.94-1.81 3.86-3.83 1.72zm-2.52-14.3c.6-1.55.04-3.18-1.32-4.18-.74 1.66-.02 3.2 1.32 4.18z" />
            </svg>
            <span className="font-bold text-zinc-700 text-sm">Apple</span>
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-zinc-500 text-xs leading-relaxed">
            By continuing, you acknowledge you've read our<br/>
            <a href="#" className="text-primary font-bold hover:underline">Terms</a> and <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

