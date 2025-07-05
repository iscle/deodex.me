export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  path?: string;
  isFolder: boolean;
  fileCount?: number;
  children?: FileItem[];
  isExpanded?: boolean;
  level?: number;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
  downloadUrl?: string;
  log: string[];
  hasDownloaded?: boolean;
}

export interface TreeItemProps {
  item: FileItem;
  onToggleFolder: (folderId: string) => void;
  onRemoveFile: (id: string) => void;
}

export interface ProcessingOverlayProps {
  processing: ProcessingState;
  onReset: () => void;
  onDownload: () => void;
} 