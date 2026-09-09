'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Copy, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { ContentBlock } from '../../types';

interface BlockWrapperProps {
  block: ContentBlock;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  dragHandleProps?: any;
  children: React.ReactNode;
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  text: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  code: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  image: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  video: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  audio: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  pdf: 'bg-red-500/10 text-red-400 border-red-500/20',
  file: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  link: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  embed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export function BlockWrapper({
  block,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
  children,
}: BlockWrapperProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const badgeClass = TYPE_BADGE_COLORS[block.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <div className="group relative my-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200">
      {/* Contextual Top Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex items-center space-x-2.5">
          {/* Drag handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Drag to reorder block"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <span className={`font-bold text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
            {block.type}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition duration-150">
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              title="Move block up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              title="Move block down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onDuplicate}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
            title="Duplicate block"
          >
            <Copy className="w-4 h-4" />
          </button>

          {showConfirmDelete ? (
            <div className="flex items-center space-x-1 bg-red-500/10 p-1 rounded-lg border border-red-500/30">
              <span className="text-[11px] text-red-400 font-bold px-1">Delete?</span>
              <button
                onClick={onDelete}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold shadow-sm transition"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 text-[11px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
              title="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Block Content */}
      <div>{children}</div>
    </div>
  );
}
