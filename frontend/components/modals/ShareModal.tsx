'use client';

import { useState } from 'react';
import { X, Copy, Check, QrCode, Lock, Globe, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Workspace } from '../../types';

interface ShareModalProps {
  workspace: Workspace;
  onClose: () => void;
}

export function ShareModal({ workspace, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/pad/${workspace.slug}`
    : `http://localhost:3000/pad/${workspace.slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Share Workspace
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shareable Link Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-slate-400">
            Workspace Link
          </label>
          <div className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none truncate font-mono"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Access Status Info */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Protection:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              {workspace.has_password ? (
                <>
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Password Protected</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Public Access</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Default Role:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Editor (Collaborative)</span>
          </div>
        </div>

        {/* QR Code Toggle */}
        <div className="pt-1 flex flex-col items-center">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-sky-500 hover:text-sky-600 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>{showQR ? 'Hide QR Code' : 'Show Mobile QR Code'}</span>
          </button>

          {showQR && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-md flex justify-center">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
