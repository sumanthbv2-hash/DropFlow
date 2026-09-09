import { Workspace, ContentBlock, FileRecord, SearchResponse } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getHeaders(password?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (password) {
    headers['x-workspace-password'] = password;
  }
  return headers;
}

export async function createWorkspace(data: { title?: string; slug?: string; password?: string; expires_in_seconds?: number }): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/api/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create workspace' }));
    throw new Error(err.detail || 'Failed to create workspace');
  }
  return res.json();
}

export async function getWorkspace(slug: string, password?: string): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/api/workspaces/${slug}`, {
    headers: getHeaders(password),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch workspace' }));
    throw new Error(err.detail || 'Workspace not found');
  }
  return res.json();
}

export async function verifyWorkspacePassword(slug: string, password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/workspaces/${slug}/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

export async function updateWorkspace(id: string, data: any, password?: string): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/api/workspaces/${id}`, {
    method: 'PATCH',
    headers: getHeaders(password),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to update workspace');
  }
  return res.json();
}

export async function getWorkspaceBlocks(workspaceId: string, password?: string): Promise<ContentBlock[]> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/blocks`, {
    headers: getHeaders(password),
  });
  if (!res.ok) {
    throw new Error('Failed to load content blocks');
  }
  return res.json();
}

export async function createBlock(workspaceId: string, data: { type: string; data?: any; position?: number }, password?: string): Promise<ContentBlock> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/blocks`, {
    method: 'POST',
    headers: getHeaders(password),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to create block');
  }
  return res.json();
}

export async function updateBlock(blockId: string, data: { data?: any; position?: number }, password?: string): Promise<ContentBlock> {
  const res = await fetch(`${API_BASE}/api/blocks/${blockId}`, {
    method: 'PATCH',
    headers: getHeaders(password),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to update block');
  }
  return res.json();
}

export async function reorderBlocks(workspaceId: string, blocks: { id: string; position: number }[], password?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/blocks/reorder`, {
    method: 'POST',
    headers: getHeaders(password),
    body: JSON.stringify({ blocks }),
  });
  if (!res.ok) {
    throw new Error('Failed to reorder blocks');
  }
}

export async function deleteBlock(blockId: string, password?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/blocks/${blockId}`, {
    method: 'DELETE',
    headers: getHeaders(password),
  });
  if (!res.ok) {
    throw new Error('Failed to delete block');
  }
}

export async function uploadFile(workspaceId: string, file: File, blockId?: string, password?: string): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('workspace_id', workspaceId);
  if (blockId) formData.append('block_id', blockId);
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (password) headers['x-workspace-password'] = password;

  const res = await fetch(`${API_BASE}/api/files/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'File upload failed' }));
    throw new Error(err.detail || 'File upload failed');
  }
  return res.json();
}

export async function searchWorkspace(slug: string, query: string, password?: string): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/workspaces/${slug}/search?q=${encodeURIComponent(query)}`, {
    headers: getHeaders(password),
  });
  if (!res.ok) {
    throw new Error('Search failed');
  }
  return res.json();
}
