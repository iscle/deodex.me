import React, { useRef, useEffect } from 'react';
import { ProcessingOverlayProps } from '../types';

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ 
  processing, 
  onReset, 
  onDownload 
}) => {
  const logRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current && processing.log.length > 0) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [processing.log]);

  if (!processing.isProcessing && processing.status === 'idle') return null;

  return (
    <div className="processing-overlay">
      <div className="processing-modal">
        {(processing.status === 'success' || processing.status === 'error') && (
          <button className="close-btn" onClick={onReset}>
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
                onClick={onDownload}
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
              <button onClick={onReset} className="retry-btn">
                🔄 Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 