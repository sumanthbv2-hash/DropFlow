'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Share2, Settings, Search, Users, Check, CloudOff, RefreshCw, Sun, Moon, Sparkles } from 'lucide-react';
import { Workspace } from '../types';

interface HeaderProps {
  workspace: Workspace;
  saveStatus: 'saved' | 'saving' | 'offline';
  activeUsers: number;
  onUpdateTitle: (title: string) => void;
  onOpenShare: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
}

export function Header({
  workspace,
  saveStatus,
  activeUsers,
  onUpdateTitle,
  onOpenShare,
  onOpenSettings,
  onOpenSearch,
}: HeaderProps) {
  const [title, setTitle] = useState(workspace.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== workspace.title) {
      onUpdateTitle(title.trim());
    } else {
      setTitle(workspace.title);
    }
  };

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand logo & Editable Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <Link href="/" className="flex items-center space-x-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:inline gradient-text">
              YourPad
            </span>
          </Link>

          <span className="text-slate-300 dark:text-slate-700 font-light hidden sm:inline">/</span>

          {/* Title Editor */}
          <div className="min-w-0 flex items-center">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="px-3 py-1 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-sky-500 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-inner"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition"
                title="Click to rename workspace"
              >
                {workspace.title}
              </h1>
            )}
          </div>
        </div>

        {/* Center: Save / Sync status indicator */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 shadow-sm">
          {saveStatus === 'saved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Auto-Saved</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-sky-500 animate-spin" />
              <span className="text-sky-500">Syncing...</span>
            </>
          )}
          {saveStatus === 'offline' && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-500">Connection lost</span>
            </>
          )}
        </div>

        {/* Right: Presence badge & Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Active Users presence indicator */}
          <div
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm"
            title={`${activeUsers} online user(s) currently collaborating`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <Users className="w-3.5 h-3.5" />
            <span>{activeUsers} Live</span>
          </div>

          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title="Search workspace (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Share Button */}
          <button
            onClick={onOpenShare}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 transition-all duration-200"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title="Workspace Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title="Toggle light/dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
