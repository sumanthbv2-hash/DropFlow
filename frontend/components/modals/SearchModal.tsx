'use client';

import { useState } from 'react';
import { Search, X, FileText, Code, File, Link2, ArrowRight } from 'lucide-react';
import { SearchResultItem } from '../../types';
import { searchWorkspace } from '../../lib/api';

interface SearchModalProps {
  slug: string;
  password?: string;
  onClose: () => void;
  onSelectBlock: (blockId: string) => void;
}

export function SearchModal({ slug, password, onClose, onSelectBlock }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const resp = await searchWorkspace(slug, q.trim(), password);
      setResults(resp.results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'code':
        return Code;
      case 'file':
      case 'pdf':
      case 'image':
        return File;
      case 'link':
        return Link2;
      default:
        return FileText;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search workspace text, code, files, or links..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {isSearching ? (
            <div className="py-8 text-center text-xs text-slate-400">Searching workspace...</div>
          ) : results.length > 0 ? (
            results.map((item) => {
              const Icon = getBlockIcon(item.type);
              return (
                <button
                  key={item.block_id}
                  onClick={() => {
                    onSelectBlock(item.block_id);
                    onClose();
                  }}
                  className="w-full p-3 flex items-start space-x-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition group"
                >
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sky-500 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-0.5">
                      <span className="uppercase font-semibold">{item.type}</span>
                      <span className="text-[10px] text-slate-400">Matched in {item.matched_field}</span>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 truncate font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                      {item.snippet}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition self-center shrink-0" />
                </button>
              );
            })
          ) : query ? (
            <div className="py-8 text-center text-xs text-slate-400">No matching content found</div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">Type to search content blocks</div>
          )}
        </div>
      </div>
    </div>
  );
}
