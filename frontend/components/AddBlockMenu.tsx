'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Type,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  FileCode,
  Code,
  Link2,
  Globe
} from 'lucide-react';
import { BlockType } from '../types';

interface AddBlockMenuProps {
  onAddBlock: (type: BlockType) => void;
}

const BLOCK_OPTIONS: { type: BlockType; label: string; icon: any; desc: string }[] = [
  { type: 'text', label: 'Text', icon: Type, desc: 'Rich text paragraph or notes' },
  { type: 'code', label: 'Code', icon: Code, desc: 'Syntax-highlighted code editor' },
  { type: 'image', label: 'Image', icon: ImageIcon, desc: 'JPG, PNG, WebP, GIF uploads' },
  { type: 'video', label: 'Video', icon: Video, desc: 'MP4, WebM video player' },
  { type: 'audio', label: 'Audio', icon: Music, desc: 'Audio clip & music player' },
  { type: 'pdf', label: 'PDF Document', icon: FileText, desc: 'Embedded PDF viewer' },
  { type: 'file', label: 'Generic File', icon: FileCode, desc: 'DOCX, XLSX, ZIP downloads' },
  { type: 'link', label: 'Link / Embed', icon: Link2, desc: 'Web URL & YouTube embed' },
];

export function AddBlockMenu({ onAddBlock }: AddBlockMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative my-6 flex flex-col items-center" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:border-sky-500 dark:hover:border-sky-500 text-slate-700 dark:text-slate-200 font-semibold text-sm transition"
      >
        <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center group-hover:scale-110 transition">
          <Plus className="w-3.5 h-3.5" />
        </div>
        <span>Add Content</span>
      </button>

      {isOpen && (
        <div className="absolute top-12 z-30 w-72 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl grid grid-cols-1 gap-1 max-h-96 overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase text-slate-400">
            Select Block Type
          </div>
          {BLOCK_OPTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={() => {
                  onAddBlock(item.type);
                  setIsOpen(false);
                }}
                className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition group"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-500 group-hover:text-white text-slate-600 dark:text-slate-300 transition">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
