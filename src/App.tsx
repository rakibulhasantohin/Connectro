import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { TabType } from './data/dummy';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ReelsView } from './components/ReelsView';
import { FriendsView } from './components/FriendsView';
import { GroupsView } from './components/GroupsView';
import { DashboardView } from './components/DashboardView';
import { NotificationsView } from './components/NotificationsView';
import { MenuView } from './components/MenuView';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { AuthView } from './components/AuthView';
import { OnboardingView } from './components/OnboardingView';
import { CreatePostModal } from './components/CreatePostModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2, Home, Play, Plus, Compass, User, Bell } from 'lucide-react';
import { cn } from './lib/utils';

function AppContent() {
  const [currentTab, setTab] = useState<TabType>('home');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { user, userData, loading } = useUser();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab, viewingUserId]);

  const handleSetTab = (tab: TabType) => {
    setTab(tab);
    setViewingUserId(null); // Reset viewing user when switching tabs
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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (!userData || !userData.onboardingCompleted) {
    return <OnboardingView onComplete={() => {}} />;
  }

  return (
    <div className="h-[100dvh] bg-zinc-100 flex justify-center selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Mobile Container */}
      <div className="w-full max-w-md bg-zinc-50 h-full relative shadow-2xl overflow-hidden flex flex-col border-x border-zinc-100">
        
        {currentTab !== 'menu' && (
          <Header 
            currentTab={currentTab} 
            setTab={handleSetTab} 
            onPlusClick={() => setIsCreatePostOpen(true)}
          />
        )}
        
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
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
            />
          )}
          {currentTab === 'menu' && <MenuView setTab={handleSetTab} />}
          {currentTab === 'profile' && (
            <ProfileView 
              targetUserId={viewingUserId} 
              onBack={() => setViewingUserId(null)} 
              onViewProfile={handleViewProfile}
              setIsCreatePostOpen={setIsCreatePostOpen}
              onOpenChat={handleOpenChat}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-14 px-1">
            <button 
              onClick={() => handleSetTab('home')}
              className={cn(
                "flex-1 h-full flex items-center justify-center transition-all",
                currentTab === 'home' ? "text-primary" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              )}
            >
              <Home className="w-7 h-7" strokeWidth={currentTab === 'home' ? 2.5 : 2} />
            </button>
            <button 
              onClick={() => handleSetTab('reels')}
              className={cn(
                "flex-1 h-full flex items-center justify-center transition-all",
                currentTab === 'reels' ? "text-primary" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              )}
            >
              <Play className="w-7 h-7" strokeWidth={currentTab === 'reels' ? 2.5 : 2} />
            </button>
            <button 
              onClick={() => setIsCreatePostOpen(true)}
              className="flex-1 h-full flex items-center justify-center transition-all"
            >
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </div>
            </button>
            <button 
              onClick={() => handleSetTab('notifications')}
              className={cn(
                "flex-1 h-full flex items-center justify-center transition-all relative",
                currentTab === 'notifications' ? "text-primary" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              )}
            >
              <div className="relative">
                <Bell className="w-7 h-7" strokeWidth={currentTab === 'notifications' ? 2.5 : 2} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-white"></span>
              </div>
            </button>
            <button 
              onClick={() => handleSetTab('profile')}
              className={cn(
                "flex-1 h-full flex items-center justify-center transition-all",
                currentTab === 'profile' ? "text-primary" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              )}
            >
              <User className="w-7 h-7" strokeWidth={currentTab === 'profile' ? 2.5 : 2} />
            </button>
          </div>
        </div>

        <CreatePostModal 
          isOpen={isCreatePostOpen} 
          onClose={() => setIsCreatePostOpen(false)} 
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <AppContent />
        {/* Global styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            overscroll-behavior-y: contain;
            background-color: #f4f4f5; /* zinc-100 */
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Smooth transitions for view switching */
          main > * {
            animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}} />
      </UserProvider>
    </ErrorBoundary>
  );
}
