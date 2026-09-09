'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '../../../components/Header';
import { AddBlockMenu } from '../../../components/AddBlockMenu';
import { BlockWrapper } from '../../../components/blocks/BlockWrapper';
import { TextBlock } from '../../../components/blocks/TextBlock';
import { ImageBlock } from '../../../components/blocks/ImageBlock';
import { VideoBlock } from '../../../components/blocks/VideoBlock';
import { AudioBlock } from '../../../components/blocks/AudioBlock';
import { FileBlock } from '../../../components/blocks/FileBlock';
import { PdfBlock } from '../../../components/blocks/PdfBlock';
import { CodeBlock } from '../../../components/blocks/CodeBlock';
import { LinkBlock } from '../../../components/blocks/LinkBlock';

import { ShareModal } from '../../../components/modals/ShareModal';
import { PasswordModal } from '../../../components/modals/PasswordModal';
import { SettingsModal } from '../../../components/modals/SettingsModal';
import { SearchModal } from '../../../components/modals/SearchModal';

import { Workspace, ContentBlock, BlockType } from '../../../types';
import { useWebSocket } from '../../../hooks/useWebSocket';
import {
  getWorkspace,
  createWorkspace,
  getWorkspaceBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
  updateWorkspace,
} from '../../../lib/api';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [password, setPassword] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');

  // Modal visibility states
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // WebSocket Message Handler
  const handleWSMessage = useCallback((data: any) => {
    if (data.type === 'block_created') {
      setBlocks((prev) => {
        if (prev.some((b) => b.id === data.block.id)) return prev;
        return [...prev, data.block].sort((a, b) => a.position - b.position);
      });
    } else if (data.type === 'block_updated') {
      setBlocks((prev) =>
        prev.map((b) => (b.id === data.block.id ? data.block : b))
      );
    } else if (data.type === 'block_deleted') {
      setBlocks((prev) => prev.filter((b) => b.id !== data.block_id));
    } else if (data.type === 'title_updated') {
      setWorkspace((prev) => (prev ? { ...prev, title: data.title } : prev));
    } else if (data.type === 'blocks_reordered') {
      const orderMap = new Map<string, number>(data.order.map((o: any) => [o.id, Number(o.position)]));
      setBlocks((prev) =>
        [...prev]
          .map((b) => (orderMap.has(b.id) ? { ...b, position: orderMap.get(b.id)! } : b))
          .sort((a, b) => a.position - b.position)
      );
    }
  }, []);

  const { isConnected, activeUsers } = useWebSocket({ slug, onMessage: handleWSMessage });

  useEffect(() => {
    setSaveStatus(isConnected ? 'saved' : 'offline');
  }, [isConnected]);

  // Initial Pad Loading with auto-creation fallback
  const loadWorkspace = useCallback(
    async (pwd?: string) => {
      setIsLoading(true);
      try {
        let ws: Workspace;
        try {
          ws = await getWorkspace(slug, pwd);
        } catch (err: any) {
          if (err.message.includes('password') || err.message.includes('401')) {
            setIsLocked(true);
            setIsLoading(false);
            return;
          }
          // Auto-create pad if it doesn't exist yet (Dontpad behavior)
          ws = await createWorkspace({ slug, title: slug });
        }

        setWorkspace(ws);
        setIsLocked(false);

        const blks = await getWorkspaceBlocks(ws.id, pwd);
        setBlocks(blks.sort((a, b) => a.position - b.position));
      } catch (err: any) {
        if (err.message.includes('password') || err.message.includes('401')) {
          setIsLocked(true);
        } else {
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    loadWorkspace(password);
  }, [loadWorkspace, password]);

  const handlePasswordSuccess = (unlockedPassword: string) => {
    setPassword(unlockedPassword);
    setIsLocked(false);
  };

  const handleAddBlock = async (type: BlockType) => {
    if (!workspace) return;
    setSaveStatus('saving');
    try {
      const newBlock = await createBlock(
        workspace.id,
        { type, position: blocks.length, data: {} },
        password
      );
      setBlocks((prev) => [...prev, newBlock]);
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('offline');
    }
  };

  const handleUpdateBlockData = async (blockId: string, data: any) => {
    setSaveStatus('saving');
    try {
      const updated = await updateBlock(blockId, { data }, password);
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? updated : b)));
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('offline');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setSaveStatus('saving');
    try {
      await deleteBlock(blockId, password);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('offline');
    }
  };

  const handleDuplicateBlock = async (block: ContentBlock) => {
    if (!workspace) return;
    setSaveStatus('saving');
    try {
      const duplicated = await createBlock(
        workspace.id,
        { type: block.type, data: { ...block.data }, position: block.position + 1 },
        password
      );
      setBlocks((prev) => [...prev, duplicated].sort((a, b) => a.position - b.position));
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('offline');
    }
  };

  const handleMoveBlock = async (index: number, direction: 'up' | 'down') => {
    if (!workspace) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    // Update positions
    const reordered = newBlocks.map((b, idx) => ({ ...b, position: idx }));
    setBlocks(reordered);

    setSaveStatus('saving');
    try {
      await reorderBlocks(
        workspace.id,
        reordered.map((b) => ({ id: b.id, position: b.position })),
        password
      );
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('offline');
    }
  };

  const handleUpdateTitle = async (newTitle: string) => {
    if (!workspace) return;
    setSaveStatus('saving');
    try {
      const updated = await updateWorkspace(workspace.id, { title: newTitle }, password);
      setWorkspace(updated);
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('offline');
    }
  };

  const scrollToBlock = (blockId: string) => {
    const el = document.getElementById(`block-${blockId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
          <span className="text-sm font-medium">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <PasswordModal slug={slug} onSuccess={handlePasswordSuccess} />;
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4 max-w-md p-6">
          <h2 className="text-2xl font-bold">Workspace Error</h2>
          <p className="text-sm text-slate-400">
            Could not initialize workspace "/pad/{slug}".
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm hover:bg-sky-600 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <Header
        workspace={workspace}
        saveStatus={saveStatus}
        activeUsers={activeUsers}
        onUpdateTitle={handleUpdateTitle}
        onOpenShare={() => setShowShare(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSearch={() => setShowSearch(true)}
      />

      {/* Main Workspace Stream */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {blocks.length === 0 ? (
          <div className="text-center py-16 px-4 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/40 backdrop-blur-md">
            <h3 className="text-lg font-bold text-white mb-2">
              Empty Workspace
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
              Start building your shared pad by adding text, files, images, code, or video blocks below.
            </p>
            <AddBlockMenu onAddBlock={handleAddBlock} />
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, idx) => {
              return (
                <div key={block.id} id={`block-${block.id}`}>
                  <BlockWrapper
                    block={block}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onDuplicate={() => handleDuplicateBlock(block)}
                    onMoveUp={idx > 0 ? () => handleMoveBlock(idx, 'up') : undefined}
                    onMoveDown={idx < blocks.length - 1 ? () => handleMoveBlock(idx, 'down') : undefined}
                  >
                    {block.type === 'text' && (
                      <TextBlock block={block} onUpdate={(data) => handleUpdateBlockData(block.id, data)} />
                    )}
                    {block.type === 'image' && (
                      <ImageBlock block={block} onUpdate={(data) => handleUpdateBlockData(block.id, data)} password={password} />
                    )}
                    {block.type === 'video' && (
                      <VideoBlock block={block} onUpdate={(data) => handleUpdateBlockData(block.id, data)} password={password} />
                    )}
                    {block.type === 'audio' && (
                      <AudioBlock block={block} onUpdate={(data) => handleUpdateBlockData(block.id, data)} password={password} />
                    )}
                    {block.type === 'file' && (
                      <FileBlock block={block} onUpdate={(data) => handleUpdateBlockData(block.id, data)} password={password} />
                    )}
                    {block.type === 'pdf' && (
                      <PdfBlock block={block} onUpdate={(data) => handleUpdateBlockData(block.id, data)} password={password} />
                    )}
                    {block.type === 'code' && (
                      <CodeBlock block={block} onUpdate={(data) => handleUpdateBlockData(block.id, data)} />
                    )}
                    {(block.type === 'link' || block.type === 'embed') && (
                      <LinkBlock block={block} onUpdate={(data) => handleUpdateBlockData(block.id, data)} />
                    )}
                  </BlockWrapper>
                </div>
              );
            })}

            <AddBlockMenu onAddBlock={handleAddBlock} />
          </div>
        )}
      </main>

      {/* Modals */}
      {showShare && (
        <ShareModal workspace={workspace} onClose={() => setShowShare(false)} />
      )}
      {showSettings && (
        <SettingsModal
          workspace={workspace}
          currentPassword={password}
          onClose={() => setShowSettings(false)}
          onUpdate={(updated) => setWorkspace(updated)}
        />
      )}
      {showSearch && (
        <SearchModal
          slug={slug}
          password={password}
          onClose={() => setShowSearch(false)}
          onSelectBlock={scrollToBlock}
        />
      )}
    </div>
  );
}
