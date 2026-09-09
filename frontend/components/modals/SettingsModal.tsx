'use client';

import { useState } from 'react';
import { X, Settings, Lock, Clock, Check, ShieldAlert } from 'lucide-react';
import { Workspace } from '../../types';
import { updateWorkspace } from '../../lib/api';

interface SettingsModalProps {
  workspace: Workspace;
  currentPassword?: string;
  onClose: () => void;
  onUpdate: (updated: Workspace) => void;
}

const EXPIRATION_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '1 Hour', value: 3600 },
  { label: '1 Day', value: 86400 },
  { label: '7 Days', value: 604800 },
  { label: '30 Days', value: 2592000 },
];

export function SettingsModal({
  workspace,
  currentPassword,
  onClose,
  onUpdate,
}: SettingsModalProps) {
  const [title, setTitle] = useState(workspace.title);
  const [password, setPassword] = useState('');
  const [removePassword, setRemovePassword] = useState(false);
  const [expirationSeconds, setExpirationSeconds] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const updatePayload: any = {
        title: title.trim(),
        remove_password: removePassword,
        expires_in_seconds: expirationSeconds,
      };
      if (password && !removePassword) {
        updatePayload.password = password;
      }

      const updated = await updateWorkspace(workspace.id, updatePayload, currentPassword);
      onUpdate(updated);
      setSuccessMsg('Settings saved successfully');
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Workspace Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title Setting */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-slate-400">
            Workspace Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Password Protection */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-slate-400 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Password Protection</span>
            </label>
            {workspace.has_password && (
              <span className="text-[11px] text-amber-500 font-medium">Currently Enabled</span>
            )}
          </div>

          {workspace.has_password ? (
            <div className="flex items-center space-x-2 pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removePassword}
                  onChange={(e) => setRemovePassword(e.target.checked)}
                  className="rounded text-red-500 focus:ring-red-500"
                />
                <span>Remove password protection</span>
              </label>
            </div>
          ) : (
            <input
              type="password"
              placeholder="Set optional password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          )}
        </div>

        {/* Expiration Policy */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-slate-400 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Workspace Expiration</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EXPIRATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExpirationSeconds(opt.value)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition border ${
                  expirationSeconds === opt.value
                    ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {successMsg && (
          <div className="flex items-center space-x-1 text-xs text-emerald-500 font-semibold justify-center">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Save Controls */}
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
