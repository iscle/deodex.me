import { useState } from 'react';
import { FileItem } from '../types';
import { 
  updateFileCount, 
  addChildToFolder, 
  toggleFolderExpansion, 
  removeItemFromTree,
  generateFileId,
  generateFolderId
} from '../utils/fileUtils';

export const useFileTree = () => {
  const [fileTree, setFileTree] = useState<FileItem[]>([]);

  const addFile = (file: File, level: number = 0, parentId?: string) => {
    const newFile: FileItem = {
      id: generateFileId(file.name),
      name: file.name,
      size: file.size,
      type: file.type,
      isFolder: false,
      level,
    };
    
    if (parentId) {
      setFileTree(prev => addChildToFolder(prev, parentId, newFile));
    } else {
      setFileTree(prev => [...prev, newFile]);
    }
  };

  const addFolder = (folderName: string, level: number = 0, parentId?: string) => {
    const folderId = generateFolderId(folderName);
    
    const newFolder: FileItem = {
      id: folderId,
      name: folderName,
      size: 0,
      type: 'folder',
      isFolder: true,
      fileCount: 0,
      children: [],
      isExpanded: true,
      level,
    };
    
    if (parentId) {
      setFileTree(prev => addChildToFolder(prev, parentId, newFolder));
    } else {
      setFileTree(prev => [...prev, newFolder]);
    }
    
    return folderId;
  };

  const updateFolderFileCount = (folderId: string, count: number) => {
    setFileTree(prev => updateFileCount(prev, folderId, count));
  };

  const toggleFolder = (folderId: string) => {
    setFileTree(prev => toggleFolderExpansion(prev, folderId));
  };

  const removeFile = (id: string) => {
    setFileTree(prev => removeItemFromTree(prev, id));
  };

  const clearFileTree = () => {
    setFileTree([]);
  };

  return {
    fileTree,
    addFile,
    addFolder,
    updateFolderFileCount,
    toggleFolder,
    removeFile,
    clearFileTree,
  };
}; 