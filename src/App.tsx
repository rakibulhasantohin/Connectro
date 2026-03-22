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
import { Loader2 } from 'lucide-react';

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
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
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
    <div className="min-h-screen bg-zinc-100 flex justify-center selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Container */}
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-hidden flex flex-col border-x border-zinc-100">
        
        <Header 
          currentTab={currentTab} 
          setTab={handleSetTab} 
          onPlusClick={() => setIsCreatePostOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50">
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
          {currentTab === 'notifications' && <NotificationsView />}
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
  );
}
