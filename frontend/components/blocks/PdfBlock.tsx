'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Download, RefreshCw, Eye } from 'lucide-react';
import { ContentBlock } from '../../types';
import { uploadFile } from '../../lib/api';

interface PdfBlockProps {
  block: ContentBlock;
  onUpdate: (data: any) => void;
  password?: string;
}

export function PdfBlock({ block, onUpdate, password }: PdfBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUrl = block.data?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${block.data.url}` : null;

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Please upload a valid PDF document');
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
      setError(err.message || 'PDF upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {fileUrl ? (
        <div className="space-y-2">
          {/* PDF Viewer Header */}
          <div className="flex items-center justify-between p-3 rounded-t-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate max-w-xs">
                {block.data?.filename || 'Document.pdf'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={fileUrl}
                download={block.data?.filename}
                className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center space-x-1 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
                title="Replace PDF"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Embedded PDF iframe */}
          <div className="w-full h-[500px] rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-800 bg-slate-900 overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title={block.data?.filename || 'PDF Preview'}
            />
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
            {isUploading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
          </div>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {isUploading ? 'Uploading PDF...' : 'Click or drag PDF document here'}
          </span>
          <span className="text-xs text-slate-400 mt-1">Supports PDF (Max 50MB)</span>
        </div>
      )}

      {error && <div className="text-xs text-red-500 font-medium px-1">{error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}
