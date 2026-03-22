import React, { useState } from 'react';
import { Search, Activity, HelpCircle, Users, User, BarChart2, TrendingUp, Lock, DollarSign, PieChart, ArrowUpRight, Wallet, History, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { INSIGHTS_DATA } from '../data/dummy';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const DashboardView: React.FC = () => {
  const { user, userData } = useUser();
  const [activeTab, setActiveTab] = useState('Overview');
  const [requestingMonetization, setRequestingMonetization] = useState(false);

  const EARNINGS_DATA = [
    { name: 'Mon', amount: 12.5 },
    { name: 'Tue', amount: 18.2 },
    { name: 'Wed', amount: 15.8 },
    { name: 'Thu', amount: 22.4 },
    { name: 'Fri', amount: 28.9 },
    { name: 'Sat', amount: 32.1 },
    { name: 'Sun', amount: 25.5 },
  ];

  const handleRequestMonetization = async () => {
    if (!user) return;
    setRequestingMonetization(true);
    try {
      // Simulate app confirmation
      await updateDoc(doc(db, 'users', user.uid), {
        monetizationRequested: true,
        // For demo purposes, let's say it's instantly approved if they are Level 5
        // But the user said "only after confirm from app", so I'll just set requested
      });
      // In a real app, an admin would approve this.
      // For this demo, let's just show a "Requested" state.
    } catch (error) {
      console.error("Error requesting monetization:", error);
    } finally {
      setRequestingMonetization(false);
    }
  };

  const isLevel5 = (userData?.level || 4) >= 5;
  const hasEnoughConnections = (userData?.followers || 0) >= 1000;
  const canApply = isLevel5 && hasEnoughConnections;
  const isMonetized = userData?.isMonetized || false;
  const isRequested = userData?.monetizationRequested || false;

  return (
    <div className="bg-zinc-50 min-h-full pb-24">
      <div className="bg-white/90 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-zinc-100 sticky top-0 z-10">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Connectro Insights</h2>
        <button className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all active:scale-90"><Search className="w-5 h-5 text-zinc-900" /></button>
      </div>
      <div className="flex gap-3 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-zinc-50 overflow-x-auto no-scrollbar sticky top-[65px] z-10">
        {['Overview', 'Analytics', 'Growth', 'Monetization'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95",
              activeTab === tab ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-zinc-500 hover:bg-zinc-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="p-6 flex flex-col gap-6">
        {activeTab === 'Monetization' ? (
          <>
            {!isMonetized ? (
              <div className="space-y-6">
                {/* Locked State */}
                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-zinc-100 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <DollarSign className="w-32 h-32 text-primary" />
                  </div>
                  
                  <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                    <Lock className="w-8 h-8 text-zinc-300" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tighter mb-2">Monetization Locked</h3>
                  <p className="text-zinc-500 text-sm font-medium max-w-[240px] leading-relaxed">
                    Complete the requirements below to start earning from your content.
                  </p>

                  <div className="w-full mt-10 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-3 text-left">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          isLevel5 ? "bg-emerald-500/10" : "bg-zinc-200/50"
                        )}>
                          {isLevel5 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Activity className="w-4 h-4 text-zinc-400" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Connectro Level 5</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Current: Level {userData?.level || 4}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isLevel5 ? "text-emerald-500" : "text-zinc-400"
                      )}>{isLevel5 ? 'Done' : '92%'}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-3 text-left">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          hasEnoughConnections ? "bg-emerald-500/10" : "bg-zinc-200/50"
                        )}>
                          {hasEnoughConnections ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Users className="w-4 h-4 text-zinc-400" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">1,000 Connections</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Current: {userData?.followers || 0}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        hasEnoughConnections ? "text-emerald-500" : "text-zinc-400"
                      )}>{hasEnoughConnections ? 'Done' : '0%'}</span>
                    </div>
                  </div>

                  <button 
                    disabled={!canApply || isRequested || requestingMonetization}
                    onClick={handleRequestMonetization}
                    className={cn(
                      "w-full mt-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                      canApply && !isRequested ? "bg-primary text-white shadow-primary/25" : "bg-zinc-100 text-zinc-400 shadow-none cursor-not-allowed"
                    )}
                  >
                    {requestingMonetization ? 'Processing...' : isRequested ? 'Request Sent' : 'Apply for Monetization'}
                  </button>

                  {isRequested && (
                    <div className="mt-4 flex items-center gap-2 text-amber-500 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Waiting for app confirmation</span>
                    </div>
                  )}
                </div>

                {/* Info Card */}
                <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-lg font-black tracking-tight mb-2">How it works</h4>
                    <p className="text-white/70 text-xs font-medium leading-relaxed">
                      Once confirmed, you'll earn from ad revenue shared on your posts and reels. Payouts are made monthly to your linked wallet.
                    </p>
                  </div>
                  <div className="absolute -bottom-6 -right-6 opacity-10">
                    <PieChart className="w-32 h-32" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Earnings Overview */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-emerald-500" />
                      </div>
                      <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">Your Earnings</h3>
                    </div>
                    <button className="w-8 h-8 bg-zinc-50 rounded-xl flex items-center justify-center hover:bg-zinc-100 transition-all">
                      <History className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>

                  <div className="mb-8">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Balance</p>
                    <div className="flex items-end gap-2">
                      <h2 className="text-4xl font-black text-zinc-900 tracking-tighter">$1,240.50</h2>
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12.5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-48 w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={EARNINGS_DATA}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '20px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            padding: '12px 16px'
                          }}
                          itemStyle={{ color: '#10b981', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorAmount)" 
                          strokeWidth={4}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="p-4 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">This Month</p>
                      <p className="text-xl font-black text-zinc-900 tracking-tighter">$450.20</p>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Last Payout</p>
                      <p className="text-xl font-black text-zinc-900 tracking-tighter">$790.30</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-3">
                  <button className="w-full p-5 bg-white rounded-[2rem] border border-zinc-100 flex items-center justify-between hover:bg-zinc-50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-zinc-900 tracking-tight">Withdraw Funds</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Transfer to bank or mobile</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-primary transition-colors" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Profile Progress */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100/80 group hover:border-primary/20 transition-all duration-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500/20 p-0.5 group-hover:rotate-6 transition-transform duration-500">
                {userData?.avatar ? (
                  <img src={userData.avatar} alt="Avatar" className="w-full h-full rounded-[14px] object-cover" />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-zinc-100 flex items-center justify-center">
                    <User className="w-7 h-7 text-zinc-300" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-xl p-1.5 border-2 border-white shadow-lg">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h4 className="font-black text-zinc-900 tracking-tight">{userData?.firstName} {userData?.lastName}</h4>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                {userData?.followers || 0} connections • <span className="text-emerald-500">Peak performance</span>
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center mb-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <span>Connectro Level 4</span>
            <span className="text-primary">92% to Level 5</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden p-0.5">
            <div className="w-[92%] h-full bg-primary rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)] transition-all duration-1000"></div>
          </div>
        </div>

        {/* Insights Chart */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100/80">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">Performance</h3>
            </div>
            <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Full Report</button>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-zinc-900 leading-tight tracking-tighter">
              Exceptional reach, <br/>8,225 impressions.
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                <TrendingUp className="w-3 h-3" />
                <span>412% increase</span>
              </div>
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">vs last cycle</span>
            </div>
          </div>

          <div className="h-56 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={INSIGHTS_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ color: '#4f46e5', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={false} 
                  animationDuration={2000}
                  strokeLinecap="round"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-5 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:bg-zinc-100 transition-all cursor-pointer group">
              <div className="w-10 h-10 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-zinc-900 tracking-tighter">305</span>
                <span className="text-emerald-500 text-[10px] font-black tracking-widest">↑ 239%</span>
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Engagement</p>
            </div>
            <div className="p-5 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:bg-zinc-100 transition-all cursor-pointer group">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-zinc-900 tracking-tighter">1.2K</span>
                <span className="text-emerald-500 text-[10px] font-black tracking-widest">↑ 12%</span>
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Velocity</p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
