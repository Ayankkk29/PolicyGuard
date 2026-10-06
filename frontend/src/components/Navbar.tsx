'use client';

import React from 'react';
import { Bell, UserCheck, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-xs sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
          Internal Enterprise App
        </span>
        <span className="text-slate-400 text-xs">•</span>
        <span className="text-xs text-slate-500 font-medium">Expense Policy Review System</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 font-medium">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reviewer Mode: <strong>John Doe (Senior Manager)</strong></span>
        </div>

        <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
