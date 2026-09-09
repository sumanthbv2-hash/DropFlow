'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { ContentBlock } from '../../types';

interface TextBlockProps {
  block: ContentBlock;
  onUpdate: (data: any) => void;
}

export function TextBlock({ block, onUpdate }: TextBlockProps) {
  const [content, setContent] = useState<string>(block.data?.text || block.data?.content || '');
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (block.data?.text || '')) {
      editorRef.current.innerHTML = block.data?.text || block.data?.content || '';
    }
  }, [block.id]);

  const handleChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContent(html);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate({ text: html });
    }, 800);
  };

  const execCommand = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleChange();
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className="space-y-2">
      {/* Rich Text Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h1>')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition font-bold text-xs"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition font-bold text-xs"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h3>')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition font-bold text-xs"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<blockquote>')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={insertLink}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand('undo')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('redo')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
          title="Redo"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        className="min-h-[100px] p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-base leading-relaxed prose dark:prose-invert max-w-none"
        data-placeholder="Type text here..."
      />
    </div>
  );
}
