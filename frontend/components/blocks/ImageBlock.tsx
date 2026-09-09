'use client';

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, X, FileImage } from 'lucide-react';
import { ContentBlock } from '../../types';
import { uploadFile } from '../../lib/api';

interface ImageBlockProps {
  block: ContentBlock;
  onUpdate: (data: any) => void;
  password?: string;
}

export function ImageBlock({ block, onUpdate, password }: ImageBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUrl = block.data?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${block.data.url}` : null;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WebP, GIF)');
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
      setError(err.message || 'Image upload failed');
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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  return (
    <div className="space-y-3">
      {fileUrl ? (
        <div className="space-y-2">
          {/* Image Display */}
          <div className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-center items-center">
            <img
              src={fileUrl}
              alt={block.data?.filename || 'Image'}
              onLoad={handleImageLoad}
              className="max-h-[500px] w-auto object-contain rounded-xl"
            />
          </div>

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {block.data?.filename}
              </span>
              {dimensions && (
                <span>
                  {dimensions.width} × {dimensions.height} px
                </span>
              )}
              {block.data?.size && (
                <span>{(block.data.size / 1024).toFixed(1)} KB</span>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 hover:text-sky-500 font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace Image</span>
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
          <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
            {isUploading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {isUploading ? 'Uploading Image...' : 'Drag & drop image or click to browse'}
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Supports JPG, PNG, WebP, GIF (Max 50MB)
          </span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 font-medium px-1">{error}</div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}
