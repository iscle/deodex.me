export const getLogMessage = (step: number): string => {
  const messages = [
    '📁 Analyzing file structure...',
    '🔍 Processing file contents...',
    '⚙️ Applying transformations...',
    '📊 Generating output...',
    '💾 Finalizing results...'
  ];
  return messages[step - 1] || `Step ${step} completed`;
};

export const simulateProcessing = async (
  onProgressUpdate: (progress: number, logMessage: string) => void,
  onComplete: (downloadUrl: string) => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    const totalSteps = 5;
    
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate work
      
      const progress = (i / totalSteps) * 100;
      const logMessage = getLogMessage(i);
      
      onProgressUpdate(progress, logMessage);
    }

    // Simulate successful completion
    const downloadUrl = 'data:text/plain;base64,' + btoa('Processed file content');
    onComplete(downloadUrl);

  } catch (error) {
    onError(error instanceof Error ? error.message : 'An unknown error occurred');
  }
}; 