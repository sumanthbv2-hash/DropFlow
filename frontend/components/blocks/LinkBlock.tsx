'use client';

import { useState, useEffect } from 'react';
import { Link2, ExternalLink, Youtube, Globe } from 'lucide-react';
import { ContentBlock } from '../../types';

interface LinkBlockProps {
  block: ContentBlock;
  onUpdate: (data: any) => void;
}

export function LinkBlock({ block, onUpdate }: LinkBlockProps) {
  const [url, setUrl] = useState<string>(block.data?.url || '');
  const [title, setTitle] = useState<string>(block.data?.title || '');
  const [isEditing, setIsEditing] = useState<boolean>(!block.data?.url);

  useEffect(() => {
    setUrl(block.data?.url || '');
    setTitle(block.data?.title || '');
  }, [block.id]);

  const extractYouTubeId = (link: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = link.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSave = () => {
    if (!url.trim()) return;
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let defaultTitle = title.trim();
    if (!defaultTitle) {
      try {
        const parsed = new URL(cleanUrl);
        defaultTitle = parsed.hostname;
      } catch {
        defaultTitle = cleanUrl;
      }
    }

    setUrl(cleanUrl);
    setTitle(defaultTitle);
    setIsEditing(false);
    onUpdate({ url: cleanUrl, title: defaultTitle });
  };

  const youtubeId = extractYouTubeId(url);

  return (
    <div className="space-y-3">
      {isEditing ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Web Address / URL
            </label>
            <input
              type="text"
              placeholder="https://example.com or YouTube link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Title / Caption (Optional)
            </label>
            <input
              type="text"
              placeholder="Custom link title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition"
          >
            Save Link
          </button>
        </div>
      ) : youtubeId ? (
        /* YouTube Embed Player */
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5 font-semibold text-red-500">
              <Youtube className="w-4 h-4" />
              <span>YouTube Video</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="hover:text-sky-500 font-medium"
            >
              Edit Link
            </button>
          </div>
          <div className="w-full h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        /* Web Link Card */
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
              <Globe className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {title || url}
              </h4>
              <p className="text-xs text-sky-500 truncate">{url}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <span>Visit</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
