import React from 'react';
import { TreeItemProps } from '../types';
import { formatFileSize } from '../utils/fileUtils';

export const TreeItem: React.FC<TreeItemProps> = ({ item, onToggleFolder, onRemoveFile }) => {
  const indent = (item.level || 0) * 20;
  
  return (
    <div className="tree-item">
      <div 
        className="file-item"
        style={{ marginLeft: `${indent}px` }}
      >
        <div className="file-info">
          <span className="file-name">
            {item.isFolder && (
              <button 
                className="expand-btn"
                onClick={() => onToggleFolder(item.id)}
              >
                {item.isExpanded ? '▼' : '▶'}
              </button>
            )}
            {item.isFolder ? '📁 ' : '📄 '}{item.name}
          </span>
          <span className="file-size">
            {item.isFolder 
              ? `${item.fileCount} file${item.fileCount !== 1 ? 's' : ''}`
              : formatFileSize(item.size)
            }
          </span>
        </div>
        <button 
          className="remove-btn"
          onClick={() => onRemoveFile(item.id)}
        >
          ×
        </button>
      </div>
      
      {item.isFolder && item.isExpanded && item.children && (
        <div className="folder-children">
          {item.children.map(child => (
            <TreeItem 
              key={child.id} 
              item={child} 
              onToggleFolder={onToggleFolder}
              onRemoveFile={onRemoveFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 