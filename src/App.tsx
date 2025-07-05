import React, { useState, useRef } from 'react';
import './App.css';
import { useFileTree } from './hooks/useFileTree';
import { useProcessing } from './hooks/useProcessing';
import { TreeItem } from './components/TreeItem';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { Footer } from './components/Footer';

function App() {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { fileTree, addFile, addFolder, updateFolderFileCount, toggleFolder, removeFile } = useFileTree();
  const { processing, processFiles, markDownloaded, resetProcessing } = useProcessing();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set drag over to false if we're leaving the entire app container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedItems = Array.from(e.dataTransfer.items);
    
    droppedItems.forEach((item) => {
      if (item.kind === 'file') {
        // Use webkitGetAsEntry to properly handle folders
        const entry = (item as any).webkitGetAsEntry();
        if (entry) {
          traverseFileTree(entry, '');
        }
      }
    });
  };

  const traverseFileTree = (item: any, path: string, parentId?: string) => {
    path = path || "";
    
    if (item.isFile) {
      // Get file
      item.file((file: File) => {
        console.log("File:", path + file.name);
        addFile(file, path.split('/').length - 1, parentId);
      });
    } else if (item.isDirectory) {
      // This is a folder - create a folder entry
      const folderName = item.name;
      const folderId = addFolder(folderName, path.split('/').length - 1, parentId);
      
      // Get folder contents and count files
      const dirReader = item.createReader();
      let fileCount = 0;
      let hasFiles = false;
      
      const readEntries = () => {
        dirReader.readEntries((entries: any[]) => {
          if (entries.length === 0) {
            // No more entries, check if folder has any files
            if (!hasFiles) {
              // Remove empty folder from tree
              removeFile(folderId);
            } else {
              // Update the folder with final count
              updateFolderFileCount(folderId, fileCount);
            }
            return;
          }
          
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.isFile) {
              hasFiles = true;
              fileCount++;
              entry.file((file: File) => {
                console.log("File in folder:", path + folderName + "/" + file.name);
                addFile(file, path.split('/').length, folderId);
              });
            } else if (entry.isDirectory) {
              // Recursively traverse subdirectories
              traverseFileTree(entry, path + folderName + "/", folderId);
            }
          }
          
          // Continue reading if there are more entries
          readEntries();
        });
      };
      
      readEntries();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => addFile(file));
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGoClick = async () => {
    await processFiles();
  };

  return (
    <div 
      className="App"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="container">
        <h1 className="title">deodex.me</h1>
        <p className="subtitle">The drag-and-drop Android deodexer</p>
        <div className="local-processing-badge">
          <span className="badge-icon">🔒</span>
          <span className="badge-text">All processing done locally - your APKs stay private</span>
        </div>
        <div className="supported-files">
          <span className="supported-label">Supported:</span>
          <span className="file-type coming-soon" title="Coming soon - not yet supported">
            .odex
            <span className="tooltip">Coming soon - not yet supported</span>
          </span>
          <span className="file-type">.vdex</span>
        </div>
        
        <div 
          className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-content">
            <div className="upload-icon">📁</div>
            <h2>Drop files or folders here</h2>
            <p>or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              {...({ webkitdirectory: '' } as any)}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {fileTree.length > 0 && (
          <div className="file-list">
            <h3>Selected Files & Folders ({fileTree.length})</h3>
            <div className="files">
              {fileTree.map((item) => (
                <TreeItem 
                  key={item.id} 
                  item={item} 
                  onToggleFolder={toggleFolder}
                  onRemoveFile={removeFile}
                />
              ))}
            </div>
            <button 
              className="go-btn"
              onClick={handleGoClick}
              disabled={fileTree.length === 0 || processing.isProcessing}
            >
              {processing.isProcessing ? 'Processing...' : 'Go'}
            </button>
          </div>
        )}
      </div>
      
      <ProcessingOverlay 
        processing={processing}
        onReset={resetProcessing}
        onDownload={markDownloaded}
      />
      
      <Footer />
    </div>
  );
}

export default App;
