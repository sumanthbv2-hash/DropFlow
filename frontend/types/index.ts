export type BlockType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'pdf' | 'code' | 'link' | 'embed';

export interface ContentBlock {
  id: string;
  workspace_id: string;
  type: BlockType;
  position: number;
  data: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  slug: string;
  title: string;
  owner_id?: string;
  visibility: 'public' | 'private';
  has_password: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface FileRecord {
  id: string;
  workspace_id: string;
  block_id?: string;
  original_filename: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
}

export interface SearchResultItem {
  block_id: string;
  type: string;
  snippet: string;
  matched_field: string;
}

export interface SearchResponse {
  workspace_slug: string;
  query: string;
  results: SearchResultItem[];
}
