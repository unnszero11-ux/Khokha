import React from 'react';
import { X } from 'lucide-react';

export function LiveCommandCenter({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-[#09090B] text-[#FAFAFA] grid grid-cols-[250px_1fr] font-sans">
      {/* Sidebar */}
      <aside className="bg-[#09090B] border-r border-[#27272A] p-6 flex flex-col gap-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-xl font-bold tracking-wider flex items-center gap-2 text-[#FAFAFA] mt-4">
          <span className="text-[#6366F1]">//</span> SYSTEM_UI
        </div>
        <nav className="flex flex-col gap-3">
          {['Dashboard', 'Live Stream', 'Analytics', 'Transactions', 'Settings'].map((item) => (
            <a
              key={item}
              href="#"
              className={`px-3 py-2 rounded-md font-medium transition-all ${
                item === 'Dashboard'
                  ? 'bg-[#6366F1]/10 text-[#6366F1]'
                  : 'text-[#A1A1AA] hover:text-[#6366F1] hover:bg-[#6366F1]/10'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="p-8 overflow-y-auto border-l border-[#27272A]">
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-[#27272A]">
          <h1 className="text-2xl font-semibold">Command Center</h1>
          <div className="inline-flex items-center gap-2 bg-[#10B981]/10 text-[#10B981] px-3 py-1.5 rounded-md text-sm font-semibold border border-[#10B981]/20">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            SYSTEM ACTIVE
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Current Viewers', value: '12,450', highlight: false },
            { title: 'Session Uptime', value: '04:22:15', highlight: false },
            { title: 'System Load', value: '89%', highlight: true },
          ].map((stat) => (
            <div key={stat.title} className="bg-[#18181B] border border-[#27272A] rounded-md p-6 flex flex-col gap-2 hover:border-[#6366F1]/50 transition-colors">
              <span className="text-[#A1A1AA] text-sm font-medium">{stat.title}</span>
              <span className={`font-mono text-3xl font-bold ${stat.highlight ? 'text-[#F43F5E]' : 'text-white'}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Stream Placeholder */}
        <div className="bg-black border border-[#27272A] rounded-md h-[400px] flex items-center justify-center mb-8 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black/60 text-[#FAFAFA] border border-[#27272A] px-3 py-1 rounded-md text-sm backdrop-blur-sm">REC</div>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1516280440502-a2989cb34dd0?auto=format&fit=crop&w=1200&q=80" 
            alt="Live Stream Feed" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-8 border-t border-[#27272A]">
          <button className="bg-[#6366F1] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#4F46E5] transition-all border border-[#6366F1]">
            Initialize Stream
          </button>
          <button className="bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20 px-6 py-3 rounded-md font-semibold hover:bg-[#F43F5E] hover:text-white transition-all">
            Halt Process
          </button>
        </div>
      </main>
    </div>
  );
}
