
import React from 'react';
import { Smartphone, Home, Bell, User, Settings, CreditCard } from 'lucide-react';

export default function MobileDevicePreview() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-zinc-950">
        <Smartphone className="w-12 h-12 text-zinc-600 mb-4"/>
        <h3 className="text-xl font-bold text-white mb-2">Mobile Template Preview</h3>
        <p className="text-zinc-500 mb-6">Device frame simulation optimized for UI design</p>
        
        <div className="w-80 h-[560px] bg-white rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl relative overflow-hidden">
            {/* Notch */}
            <div className='absolute top-0 w-full h-8 flex justify-center z-10'>
                <div className='w-32 h-6 bg-zinc-900 rounded-b-2xl'></div>
            </div>

            {/* Main Content Area */}
            <div className='w-full h-full flex flex-col pt-10 pb-4'>
                {/* Header */}
                <div className='px-6 py-4 flex items-center justify-between border-b border-zinc-100'>
                    <div className='w-8 h-8 rounded-full bg-indigo-100'></div>
                    <h1 className='text-sm font-bold text-zinc-900'>My Dashboard</h1>
                    <Bell className='w-5 h-5 text-zinc-400'/>
                </div>

                {/* Content */}
                <div className='flex-1 overflow-y-auto p-6 space-y-4'>
                    <div className='w-full h-24 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-between px-6 text-white'>
                        <div>
                         <p className='text-xs opacity-80'>Total Balance</p>
                         <p className='text-xl font-bold'>$12,450.00</p>
                        </div>
                        <CreditCard className='w-8 h-8 opacity-50'/>
                    </div>
                    
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='h-24 bg-zinc-100 rounded-2xl flex flex-col p-3'>
                            <div className='w-6 h-6 bg-indigo-500/20 rounded-lg mb-auto'/>
                            <p className='text-xs font-bold text-zinc-700'>Transfer</p>
                        </div>
                        <div className='h-24 bg-zinc-100 rounded-2xl flex flex-col p-3'>
                            <div className='w-6 h-6 bg-emerald-500/20 rounded-lg mb-auto'/>
                            <p className='text-xs font-bold text-zinc-700'>Deposit</p>
                        </div>
                    </div>
                    
                    <div className='space-y-2'>
                       <div className='h-12 w-full bg-zinc-50 rounded-xl border border-zinc-100'></div>
                       <div className='h-12 w-full bg-zinc-50 rounded-xl border border-zinc-100'></div>
                    </div>
                </div>

                {/* Bottom Nav */}
                <div className='px-6 py-3 border-t border-zinc-100 flex justify-between'>
                    <Home className='w-6 h-6 text-indigo-600'/>
                    <CreditCard className='w-6 h-6 text-zinc-300'/>
                    <Settings className='w-6 h-6 text-zinc-300'/>
                    <User className='w-6 h-6 text-zinc-300'/>
                </div>
            </div>
        </div>
    </div>
  );
}
