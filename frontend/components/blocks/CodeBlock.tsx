'use client';

import { useState, useEffect, useRef } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { ContentBlock } from '../../types';

interface CodeBlockProps {
  block: ContentBlock;
  onUpdate: (data: any) => void;
}

const LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'html',
  'css',
  'sql',
  'cpp',
  'c',
  'json',
  'java',
  'bash',
];

export function CodeBlock({ block, onUpdate }: CodeBlockProps) {
  const [code, setCode] = useState<string>(block.data?.code || '');
  const [language, setLanguage] = useState<string>(block.data?.language || 'python');
  const [copied, setCopied] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCode(block.data?.code || '');
    setLanguage(block.data?.language || 'python');
  }, [block.id]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate({ code: newCode, language });
    }, 800);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    onUpdate({ code, language: newLang });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/60 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <Code className="w-4 h-4 text-sky-400" />
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-700 text-slate-200 font-medium rounded px-2 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 capitalize"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={copyCode}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-sans transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>

      {/* Editor Body */}
      <div className="relative font-mono text-sm">
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="// Paste or write code here..."
          rows={Math.max(4, code.split('\n').length)}
          className="w-full p-4 bg-transparent text-emerald-400 placeholder-slate-600 focus:outline-none resize-y font-mono leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
