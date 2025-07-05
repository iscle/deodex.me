import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import './App.css';

interface FileItem {
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

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
  downloadUrl?: string;
  log: string[];
  hasDownloaded?: boolean;
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Store files in a flat structure for processing
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  
  // Processing state
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    status: 'idle',
    log: []
  });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
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
        const newFile: FileItem = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          isFolder: false,
          level: path.split('/').length - 1,
        };
        
        if (parentId) {
          // Add as child to parent folder
          setFileTree(prev => prev.map(f => 
            f.id === parentId 
              ? { ...f, children: [...(f.children || []), newFile] }
              : f
          ));
        } else {
          // Add as root item
          setFileTree(prev => [...prev, newFile]);
        }
      });
    } else if (item.isDirectory) {
      // This is a folder - create a folder entry
      const folderName = item.name;
      const folderId = `folder-${folderName}-${Date.now()}-${Math.random()}`;
      
      // Add the folder to the tree immediately
      const newFolder: FileItem = {
        id: folderId,
        name: folderName,
        size: 0,
        type: 'folder',
        isFolder: true,
        fileCount: 0,
        children: [],
        isExpanded: true,
        level: path.split('/').length - 1,
      };
      
      if (parentId) {
        // Add as child to parent folder
        setFileTree(prev => prev.map(f => 
          f.id === parentId 
            ? { ...f, children: [...(f.children || []), newFolder] }
            : f
        ));
      } else {
        // Add as root item
        setFileTree(prev => [...prev, newFolder]);
      }
      
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
              setFileTree(prev => removeItemFromTree(prev, folderId));
            } else {
              // Update the folder with final count
              setFileTree(prev => updateFileCount(prev, folderId, fileCount));
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
                const newFile: FileItem = {
                  id: `${file.name}-${Date.now()}-${Math.random()}`,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  isFolder: false,
                  level: path.split('/').length,
                };
                
                setFileTree(prev => addChildToFolder(prev, folderId, newFile));
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

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => addFile(file));
  };

  const addFile = (file: File) => {
    // This function is now only used for individual files (not from folders)
    const newFile: FileItem = {
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      isFolder: false,
      level: 0,
    };
    
    setFileTree(prev => [...prev, newFile]);
  };

  // Helper function to update file count in a folder
  const updateFileCount = (items: FileItem[], folderId: string, count: number): FileItem[] => {
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

  // Helper function to add a child to a folder
  const addChildToFolder = (items: FileItem[], folderId: string, child: FileItem): FileItem[] => {
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

  // Function to toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setFileTree(prev => toggleFolderExpansion(prev, folderId));
  };

  // Helper function to toggle folder expansion
  const toggleFolderExpansion = (items: FileItem[], folderId: string): FileItem[] => {
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

  const removeFile = (id: string) => {
    setFileTree(prev => removeItemFromTree(prev, id));
  };

  // Helper function to remove an item from the tree
  const removeItemFromTree = (items: FileItem[], id: string): FileItem[] => {
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

  const handleGoClick = async () => {
    // Reset processing state
    setProcessing({
      isProcessing: true,
      progress: 0,
      status: 'processing',
      log: ['Starting file processing...']
    });

    try {
      // Simulate processing with progress updates
      const totalSteps = 5;
      
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate work
        
        const progress = (i / totalSteps) * 100;
        const logMessage = getLogMessage(i);
        
        setProcessing(prev => ({
          ...prev,
          progress,
          log: [...prev.log, logMessage]
        }));
      }

      // Simulate successful completion
      const downloadUrl = 'data:text/plain;base64,' + btoa('Processed file content');
      
      setProcessing(prev => ({
        ...prev,
        isProcessing: false,
        status: 'success',
        downloadUrl,
        log: [...prev.log, '✅ Processing completed successfully!']
      }));

    } catch (error) {
      setProcessing(prev => ({
        ...prev,
        isProcessing: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        log: [...prev.log, '❌ Processing failed!']
      }));
    }
  };

  const getLogMessage = (step: number): string => {
    const messages = [
      '📁 Analyzing file structure...',
      '🔍 Processing file contents...',
      '⚙️ Applying transformations...',
      '📊 Generating output...',
      '💾 Finalizing results...'
    ];
    return messages[step - 1] || `Step ${step} completed`;
  };

  const resetProcessing = () => {
    // Warn user if they haven't downloaded and are closing
    if (processing.status === 'success' && !processing.hasDownloaded) {
      const confirmed = window.confirm(
        'You haven\'t downloaded your processed files yet. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    
    setProcessing({
      isProcessing: false,
      progress: 0,
      status: 'idle',
      log: []
    });
  };

  const handleDownload = () => {
    setProcessing(prev => ({
      ...prev,
      hasDownloaded: true
    }));
  };

  // Auto-scroll log to bottom
  const logRef = useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (logRef.current && processing.log.length > 0) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [processing.log]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Processing UI Components
  const ProcessingOverlay = () => {
    if (!processing.isProcessing && processing.status === 'idle') return null;

    return (
      <div className="processing-overlay">
        <div className="processing-modal">
          {(processing.status === 'success' || processing.status === 'error') && (
            <button className="close-btn" onClick={resetProcessing}>
              ×
            </button>
          )}
          
          {processing.status === 'processing' && (
            <div className="processing-content">
              <div className="spinner"></div>
              <h3>Processing Files...</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${processing.progress}%` }}
                ></div>
              </div>
              <p className="progress-text">{Math.round(processing.progress)}%</p>
              
              <div className="log-container">
                <h4>Processing Log:</h4>
                <div className="log-messages" ref={logRef}>
                  {processing.log.map((message, index) => (
                    <div key={index} className="log-message">
                      {message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {processing.status === 'success' && (
            <div className="success-content">
              <div className="success-icon">✅</div>
              <h3>Processing Complete!</h3>
              <p>Your files have been processed successfully.</p>
              
              <div className="log-container">
                <h4>Processing Log:</h4>
                <div className="log-messages" ref={logRef}>
                  {processing.log.map((message, index) => (
                    <div key={index} className="log-message">
                      {message}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="action-buttons">
                <a 
                  href={processing.downloadUrl} 
                  download="processed-files.zip"
                  className="download-btn"
                  onClick={handleDownload}
                >
                  📥 Download Results
                </a>
              </div>
            </div>
          )}

          {processing.status === 'error' && (
            <div className="error-content">
              <div className="error-icon">❌</div>
              <h3>Processing Failed</h3>
              <p className="error-message">{processing.error}</p>
              
              <div className="log-container">
                <h4>Processing Log:</h4>
                <div className="log-messages" ref={logRef}>
                  {processing.log.map((message, index) => (
                    <div key={index} className="log-message">
                      {message}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="action-buttons">
                <button onClick={resetProcessing} className="retry-btn">
                  🔄 Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Recursive component to render tree items
  const TreeItem = ({ item }: { item: FileItem }) => {
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
                  onClick={() => toggleFolder(item.id)}
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
            onClick={() => removeFile(item.id)}
          >
            ×
          </button>
        </div>
        
        {item.isFolder && item.isExpanded && item.children && (
          <div className="folder-children">
            {item.children.map(child => (
              <TreeItem key={child.id} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <div className="container">
        <h1 className="title">deodex.me</h1>
        
        <div 
          className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
                <TreeItem key={item.id} item={item} />
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
      
      <ProcessingOverlay />
      
      <footer className="footer">
        <div className="footer-content">
          <a
            href="https://github.com/iscle/deodex.me"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            <span role="img" aria-label="GitHub">🐙</span> GitHub
          </a>
          <span className="footer-separator">|</span>
          <span className="footer-made">Made with <span style={{color: '#ff4b6e'}}>❤️</span> by iscle in Barcelona</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
