'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { ContentBlock } from '../../types';
import { uploadFile } from '../../lib/api';

interface FileBlockProps {
  block: ContentBlock;
  onUpdate: (data: any) => void;
  password?: string;
}

export function FileBlock({ block, onUpdate, password }: FileBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUrl = block.data?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${block.data.url}` : null;

  const handleFileUpload = async (file: File) => {
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
      setError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const getExtension = (filename?: string) => {
    if (!filename) return 'FILE';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toUpperCase() : 'FILE';
  };

  return (
    <div className="space-y-3">
      {fileUrl ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center border border-sky-500/20 shrink-0">
              {getExtension(block.data?.filename)}
            </div>

            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {block.data?.filename || 'Uploaded File'}
              </h4>
              <p className="text-xs text-slate-400">
                {block.data?.size ? `${(block.data.size / 1024).toFixed(1)} KB` : 'Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Preview in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </a>

            <a
              href={fileUrl}
              download={block.data?.filename}
              className="p-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              title="Replace file"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mb-2">
            {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </div>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {isUploading ? 'Uploading file...' : 'Click to upload any file'}
          </span>
          <span className="text-xs text-slate-400 mt-1">DOCX, PPTX, XLSX, TXT, CSV, ZIP (Max 50MB)</span>
        </div>
      )}

      {error && <div className="text-xs text-red-500 font-medium px-1">{error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}
