/**
 * Manual Upload Page
 * Allows authenticated users to upload and analyze JSON data
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, AlertTriangle, Loader2, ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { Logo, Button, Card, AnalysisLoading } from '../components';
import { useAnalysisStore } from '../stores/analysisStore';
import { useAuthStore } from '../stores/authStore';

export function ManualUploadPage() {
  const navigate = useNavigate();
  const { isAnalyzing, error, insufficientData, uploadData, clearError } = useAnalysisStore();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState<'fetching' | 'analyzing' | 'processing' | 'finalizing'>('fetching');
  const [modelReady] = useState(true); // Assume model is ready for manual uploads
  const insufficientDataMessage =
    typeof insufficientData?.message === 'string'
      ? insufficientData.message
      : 'Insufficient data for reliable analysis. Upload at least 40 posts spanning 30+ days.';

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Simulate analysis stages for better UX
  useEffect(() => {
    if (isAnalyzing) {
      const stages: Array<'fetching' | 'analyzing' | 'processing' | 'finalizing'> = ['fetching', 'analyzing', 'processing', 'finalizing'];
      let currentStageIndex = 0;
      
      const interval = setInterval(() => {
        currentStageIndex = (currentStageIndex + 1) % stages.length;
        setAnalysisStage(stages[currentStageIndex]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const selectFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      setUploadHint('Only JSON files are supported. Please upload a .json file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadHint(`File uploaded: ${file.name}`);
    clearError();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleStartUploadAnalysis = async () => {
    if (!selectedFile) {
      return;
    }
    clearError();
    const success = await uploadData(selectedFile);
    if (success) {
      navigate('/results');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Show loading screen during analysis
  if (!isAuthenticated) {
    return null;
  }

  if (isAnalyzing) {
    return <AnalysisLoading stage={analysisStage} />;
  }

  // Show error if analysis failed
  if (error && !isAnalyzing) {
    return (
      <div className="bg-animated flex flex-col min-h-screen">
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
          <div className="container-narrow flex justify-between items-center h-16">
            <Logo size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              icon={<ArrowRight size={16} className="rotate-180" />}
            >
              Back
            </Button>
          </div>
        </header>
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <Card className="max-w-md text-center" padding="lg">
            <AlertTriangle size={64} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <Button onClick={handleStartUploadAnalysis} disabled={!selectedFile}>Try Again</Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-animated flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            icon={<ArrowRight size={16} className="rotate-180" />}
          >
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-16">
        <div className="container-narrow">
          <Card className="max-w-2xl mx-auto" padding="lg">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Manual Data Upload
              </h1>
              <p className="text-lg text-slate-400">
                Upload your data for analysis using your authenticated session
              </p>
            </motion.div>

            {/* Upload Section */}
            <div className="text-left mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upload JSON Data</h3>
              
              <div className="mb-4">
                <label htmlFor="file-upload" className="block text-sm text-slate-400 mb-3">
                  Select a JSON file with user data:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <button
                  type="button"
                  className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-purple-400 bg-purple-500/10'
                      : 'border-slate-600 hover:border-purple-500'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={40} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {isDragging ? 'Drop JSON file here' : 'Click to select a JSON file'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
                    </div>
                  </div>
                </button>

                {uploadHint && (
                  <p className="text-xs mt-2 text-slate-400">{uploadHint}</p>
                )}
              </div>

              {selectedFile && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-green-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-300">File uploaded successfully</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-300">
                          <FileText size={14} />
                          <span>{selectedFile.name}</span>
                          <span className="text-slate-500">({formatFileSize(selectedFile.size)})</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadHint(null);
                        clearError();
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Model Status */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${
                modelReady 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                {modelReady ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-sm text-green-400">Model Ready</span>
                  </>
                ) : (
                  <>
                    <Loader2 size={16} className="animate-spin text-amber-400" />
                    <span className="text-sm text-amber-400">Loading Model...</span>
                  </>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                  <p className="text-sm text-red-400 flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    {error}
                  </p>
                </div>
              )}

              {insufficientData && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                  <p className="text-sm text-amber-300 flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    {insufficientDataMessage}
                  </p>
                </div>
              )}

              {/* Analyze Button */}
              <Button 
                onClick={handleStartUploadAnalysis}
                fullWidth 
                disabled={!selectedFile || isAnalyzing || !modelReady}
                isLoading={isAnalyzing}
                size="lg"
                icon={<ArrowRight size={20} />}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Data'}
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-slate-400">
                ⚠️ <span className="text-amber-400 font-medium">Important:</span> This is a research tool, not a medical diagnosis.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
