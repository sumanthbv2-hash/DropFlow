'use client';

import { useState, useRef } from 'react';
import { Upload, Music, RefreshCw, Volume2 } from 'lucide-react';
import { ContentBlock } from '../../types';
import { uploadFile } from '../../lib/api';

interface AudioBlockProps {
  block: ContentBlock;
  onUpdate: (data: any) => void;
  password?: string;
}

export function AudioBlock({ block, onUpdate, password }: AudioBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUrl = block.data?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${block.data.url}` : null;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('Please upload a valid audio file (MP3, WAV, OGG)');
      return;
    }
    setError(null);
    setIsUploading(true);

    try {
      const record = await uploadFile(block.workspace_id, file, block.id, password);
      onUpdate({
        url: record.url,
        filename: record.original_filename,
        size: record.size,
        mime_type: record.mime_type,
      });
    } catch (err: any) {
      setError(err.message || 'Audio upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {fileUrl ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {block.data?.filename}
                </h4>
                <p className="text-xs text-slate-400">
                  {block.data?.size ? `${(block.data.size / 1024).toFixed(1)} KB` : 'Audio Track'}
                </p>
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              title="Replace Audio"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <audio src={fileUrl} controls className="w-full h-10 rounded-lg" />
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2">
            {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
          </div>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {isUploading ? 'Uploading Audio...' : 'Click to upload audio file'}
          </span>
          <span className="text-xs text-slate-400 mt-1">Supports MP3, WAV, OGG</span>
        </div>
      )}

      {error && <div className="text-xs text-red-500 font-medium px-1">{error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}
