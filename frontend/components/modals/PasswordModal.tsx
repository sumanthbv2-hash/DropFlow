'use client';

import { useState } from 'react';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';
import { verifyWorkspacePassword } from '../../lib/api';

interface PasswordModalProps {
  slug: string;
  onSuccess: (password: string) => void;
}

export function PasswordModal({ slug, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);
    setError(null);

    try {
      const isValid = await verifyWorkspacePassword(slug, password);
      if (isValid) {
        onSuccess(password);
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setError('Incorrect password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-xl text-slate-900 dark:text-white">
            Protected Workspace
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            This workspace requires a password to view or edit content.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              placeholder="Enter workspace password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-red-500 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isLoading ? 'Verifying...' : 'Unlock Workspace'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
