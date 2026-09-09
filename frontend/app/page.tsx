'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createWorkspace } from '../lib/api';
import { FileText, Sparkles, ArrowRight, Sun, Moon, Shield, Zap, Share2 } from 'lucide-react';

export default function HomePage() {
  const [padSlug, setPadSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  };

  const handleCreateNewPad = async () => {
    setIsCreating(true);
    try {
      const pad = await createWorkspace({ title: 'Untitled Workspace' });
      router.push(`/pad/${pad.slug}`);
    } catch (err) {
      console.error(err);
      // Fallback redirect with client-side slug generator if backend offline
      const fallbackSlug = `pad-${Math.random().toString(36).substring(2, 9)}`;
      router.push(`/pad/${fallbackSlug}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenPad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!padSlug.trim()) return;
    // Clean input slug if full URL pasted
    let clean = padSlug.trim();
    if (clean.includes('/pad/')) {
      clean = clean.split('/pad/')[1];
    }
    clean = clean.replace(/[^a-zA-Z0-9\-_]/g, '');
    router.push(`/pad/${clean}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            YourPad
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Collaborative Workspace</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
          A simple shared workspace for <br className="hidden md:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600">
            text, files, media & collaboration.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10">
          Create instantly shareable pages. Add rich text, code snippets, high-res images, videos, audio clips, PDFs, and custom files with real-time collaboration.
        </p>

        {/* Action Panel */}
        <div className="w-full max-w-lg p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-3">
          <button
            onClick={handleCreateNewPad}
            disabled={isCreating}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/25 transition disabled:opacity-50 text-base"
          >
            <span>{isCreating ? 'Creating Workspace...' : 'Create New Pad'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-3 text-xs uppercase text-slate-400 font-medium absolute">or join pad</span>
          </div>

          <form onSubmit={handleOpenPad} className="flex space-x-2 pt-1">
            <input
              type="text"
              placeholder="Enter pad name or slug (e.g. project-x)"
              value={padSlug}
              onChange={(e) => setPadSlug(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition text-sm"
            >
              Open Pad
            </button>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Real-Time Sync</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              WebSocket presence and instant state sync for multi-user editing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Rich Content Blocks</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Drag and drop text, code, audio, video, images, PDFs, and generic files.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Password & Expiry</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Protect pads with hashed passwords and optional auto-expiration policies.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-900">
        YourPad Collaborative Workspace • Powered by Next.js & FastAPI
      </footer>
    </div>
  );
}
