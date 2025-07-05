import { useState } from 'react';
import { ProcessingState } from '../types';
import { simulateProcessing } from '../utils/processingUtils';

export const useProcessing = () => {
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    status: 'idle',
    log: []
  });

  const startProcessing = () => {
    setProcessing({
      isProcessing: true,
      progress: 0,
      status: 'processing',
      log: ['Starting file processing...']
    });
  };

  const updateProgress = (progress: number, logMessage: string) => {
    setProcessing(prev => ({
      ...prev,
      progress,
      log: [...prev.log, logMessage]
    }));
  };

  const completeProcessing = (downloadUrl: string) => {
    setProcessing(prev => ({
      ...prev,
      isProcessing: false,
      status: 'success',
      downloadUrl,
      log: [...prev.log, '✅ Processing completed successfully!']
    }));
  };

  const failProcessing = (error: string) => {
    setProcessing(prev => ({
      ...prev,
      isProcessing: false,
      status: 'error',
      error,
      log: [...prev.log, '❌ Processing failed!']
    }));
  };

  const markDownloaded = () => {
    setProcessing(prev => ({
      ...prev,
      hasDownloaded: true
    }));
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

  const processFiles = async () => {
    startProcessing();
    
    await simulateProcessing(
      updateProgress,
      completeProcessing,
      failProcessing
    );
  };

  return {
    processing,
    processFiles,
    markDownloaded,
    resetProcessing,
  };
}; 