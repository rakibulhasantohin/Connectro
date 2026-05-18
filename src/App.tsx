import React, { useState, useEffect, Suspense, lazy } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { TabType } from './data/dummy';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home, Search, Play, Heart, User, Film, Send, Compass } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Lazy load views for better performance
const HomeView = lazy(() => import('./components/HomeView').then(m => ({ default: m.HomeView })));
const ReelsView = lazy(() => import('./components/ReelsView').then(m => ({ default: m.ReelsView })));
const FriendsView = lazy(() => import('./components/FriendsView').then(m => ({ default: m.FriendsView })));
const GroupsView = lazy(() => import('./components/GroupsView').then(m => ({ default: m.GroupsView })));
const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const NotificationsView = lazy(() => import('./components/NotificationsView').then(m => ({ default: m.NotificationsView })));
const MenuView = lazy(() => import('./components/MenuView').then(m => ({ default: m.MenuView })));
const ProfileView = lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));
const MessagesView = lazy(() => import('./components/MessagesView').then(m => ({ default: m.MessagesView })));
const AuthView = lazy(() => import('./components/AuthView').then(m => ({ default: m.AuthView })));
const OnboardingView = lazy(() => import('./components/OnboardingView').then(m => ({ default: m.OnboardingView })));
const CreatePostModal = lazy(() => import('./components/CreatePostModal').then(m => ({ default: m.CreatePostModal })));
const SettingsMenuView = lazy(() => import('./components/SettingsMenuView').then(m => ({ default: m.SettingsMenuView })));

const ViewLoader = () => (
  <div className="flex-1 flex items-center justify-center bg-black animate-pulse">
    <div className="w-12 h-12 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin"></div>
  </div>
);

function AppContent() {
  const [currentTab, setTab] = useState<TabType>('home');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, userData, loading, logout } = useUser();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab, viewingUserId]);

  const handleSetTab = (tab: TabType) => {
    setTab(tab);
    setViewingUserId(null); 
    if (tab !== 'messages') {
      setSelectedChatId(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    setViewingUserId(userId);
    setTab('profile');
  };

  const handleOpenChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setTab('messages');
  };

  if (loading) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
          <div className="w-8 h-8 bg-zinc-800 rounded-full border-t-zinc-400 border-2 animate-spin"></div>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight mb-2">Connectro</h2>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<ViewLoader />}>
        <AuthView />
      </Suspense>
    );
  }

  if (userData && !userData.onboardingCompleted) {
    return (
      <Suspense fallback={<ViewLoader />}>
        <OnboardingView onComplete={() => {}} />
      </Suspense>
    );
  }

  return (
    <div className="h-[100dvh] bg-zinc-950 flex justify-center selection:bg-zinc-800 selection:text-white overflow-hidden">
      {/* Mobile Container */}
      <div className="w-full max-w-[480px] bg-black h-[100dvh] relative shadow-2xl overflow-hidden flex flex-col">
        
        {currentTab !== 'menu' && currentTab !== 'reels' && currentTab !== 'messages' && (
          <Header 
            currentTab={currentTab} 
            setTab={handleSetTab} 
            onPlusClick={() => setIsCreatePostOpen(true)}
            onLogoClick={() => setIsSettingsOpen(true)}
          />
        )}
        
        <main className={cn(
          "flex-1 overflow-y-auto no-scrollbar bg-black relative",
          currentTab === 'reels' ? "pb-0" : "pb-14"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab + (viewingUserId || '')}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full w-full"
            >
              <Suspense fallback={<ViewLoader />}>
                {currentTab === 'home' && (
                  <HomeView 
                    setTab={handleSetTab} 
                    onViewProfile={handleViewProfile} 
                    isCreatePostOpen={isCreatePostOpen}
                    setIsCreatePostOpen={setIsCreatePostOpen}
                  />
                )}
                {currentTab === 'reels' && <ReelsView />}
                {currentTab === 'friends' && (
                  <FriendsView 
                    onViewProfile={handleViewProfile} 
                    onOpenChat={handleOpenChat}
                  />
                )}
                {currentTab === 'groups' && <GroupsView />}
                {currentTab === 'dashboard' && <DashboardView />}
                {currentTab === 'notifications' && <NotificationsView onViewProfile={handleViewProfile} />}
                {currentTab === 'messages' && (
                  <MessagesView 
                    onViewProfile={handleViewProfile} 
                    selectedChatId={selectedChatId}
                    setSelectedChatId={setSelectedChatId}
                    onBack={() => handleSetTab('home')}
                  />
                )}
                {currentTab === 'menu' && <MenuView setTab={handleSetTab} />}
                {currentTab === 'profile' && (
                  <ProfileView 
                    targetUserId={viewingUserId} 
                    onBack={() => {
                      if (viewingUserId) setViewingUserId(null);
                      else handleSetTab('home');
                    }} 
                    onViewProfile={handleViewProfile}
                    setIsCreatePostOpen={setIsCreatePostOpen}
                    onOpenChat={handleOpenChat}
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-900 pb-[env(safe-area-inset-bottom)] px-2">
          <div className="flex justify-around items-center h-12">
            <button 
              onClick={() => handleSetTab('home')}
              className="flex-1 h-full flex items-center justify-center transition-all group active:scale-90"
            >
              <Home className={cn("w-6 h-6", currentTab === 'home' ? "text-white" : "text-zinc-500")} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
            </button>
            <button 
              onClick={() => handleSetTab('friends')}
              className="flex-1 h-full flex items-center justify-center transition-all group active:scale-90"
            >
              <Search className={cn("w-6 h-6", currentTab === 'friends' ? "text-white" : "text-zinc-500")} strokeWidth={currentTab === 'friends' ? 2.5 : 2} />
            </button>
            <button 
              onClick={() => handleSetTab('messages')}
              className="flex-1 h-full flex items-center justify-center transition-all group active:scale-90"
            >
              <Send className={cn("w-6 h-6", currentTab === 'messages' ? "text-white" : "text-zinc-500")} strokeWidth={currentTab === 'messages' ? 2.5 : 2} />
            </button>
            <button 
              onClick={() => handleSetTab('reels')}
              className="flex-1 h-full flex items-center justify-center transition-all group active:scale-90"
            >
              <Film className={cn("w-6 h-6", currentTab === 'reels' ? "text-white" : "text-zinc-500")} strokeWidth={currentTab === 'reels' ? 2.5 : 2} />
            </button>
            <button 
              onClick={() => handleSetTab('profile')}
              className="flex-1 h-full flex items-center justify-center transition-all group active:scale-90"
            >
              <div className={cn(
                "w-6 h-6 rounded-full overflow-hidden border",
                currentTab === 'profile' ? "border-white" : "border-transparent"
              )}>
                {userData?.avatar ? (
                  <img src={userData.avatar} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <User className="w-3 h-3 text-zinc-500" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        <Suspense fallback={null}>
          <CreatePostModal 
            isOpen={isCreatePostOpen} 
            onClose={() => setIsCreatePostOpen(false)} 
          />
        </Suspense>

        <AnimatePresence>
          {isSettingsOpen && (
            <Suspense fallback={null}>
              <SettingsMenuView 
                onBack={() => setIsSettingsOpen(false)} 
                onLogout={() => {
                  setIsSettingsOpen(false);
                  logout();
                }}
              />
            </Suspense>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ErrorBoundary>
  );
}
