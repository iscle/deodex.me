import { FileItem } from '../types';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateFileId = (name: string): string => {
  return `${name}-${Date.now()}-${Math.random()}`;
};

export const generateFolderId = (name: string): string => {
  return `folder-${name}-${Date.now()}-${Math.random()}`;
};

export const updateFileCount = (items: FileItem[], folderId: string, count: number): FileItem[] => {
  return items.map(item => {
    if (item.id === folderId) {
      return { ...item, fileCount: count };
    }
    if (item.children) {
      return { ...item, children: updateFileCount(item.children, folderId, count) };
    }
    return item;
  });
};

export const addChildToFolder = (items: FileItem[], folderId: string, child: FileItem): FileItem[] => {
  return items.map(item => {
    if (item.id === folderId) {
      return { ...item, children: [...(item.children || []), child] };
    }
    if (item.children) {
      return { ...item, children: addChildToFolder(item.children, folderId, child) };
    }
    return item;
  });
};

export const toggleFolderExpansion = (items: FileItem[], folderId: string): FileItem[] => {
  return items.map(item => {
    if (item.id === folderId) {
      return { ...item, isExpanded: !item.isExpanded };
    }
    if (item.children) {
      return { ...item, children: toggleFolderExpansion(item.children, folderId) };
    }
    return item;
  });
};

export const removeItemFromTree = (items: FileItem[], id: string): FileItem[] => {
  return items.filter(item => {
    if (item.id === id) {
      return false;
    }
    if (item.children) {
      item.children = removeItemFromTree(item.children, id);
    }
    return true;
  });
}; 