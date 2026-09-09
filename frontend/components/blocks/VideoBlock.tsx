'use client';

import { useState, useRef } from 'react';
import { Upload, Video, RefreshCw, Film } from 'lucide-react';
import { ContentBlock } from '../../types';
import { uploadFile } from '../../lib/api';

interface VideoBlockProps {
  block: ContentBlock;
  onUpdate: (data: any) => void;
  password?: string;
}

export function VideoBlock({ block, onUpdate, password }: VideoBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUrl = block.data?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${block.data.url}` : null;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please upload a valid video file (MP4, WebM)');
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
      setError(err.message || 'Video upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {fileUrl ? (
        <div className="space-y-2">
          {/* Video Player */}
          <div className="rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800">
            <video
              src={fileUrl}
              controls
              className="w-full max-h-[480px] object-contain rounded-xl"
            />
          </div>

          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
            <div className="flex items-center space-x-2">
              <Film className="w-4 h-4 text-sky-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {block.data?.filename}
              </span>
              {block.data?.size && (
                <span>({(block.data.size / (1024 * 1024)).toFixed(1)} MB)</span>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 hover:text-sky-500 font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace Video</span>
            </button>
          </div>
        </div>
      ) : (
        /* Upload Area */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
            {isUploading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Video className="w-6 h-6" />}
          </div>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {isUploading ? 'Uploading Video...' : 'Drag & drop video file or click to browse'}
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Supports MP4, WebM (Max 50MB)
          </span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 font-medium px-1">{error}</div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}
