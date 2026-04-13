/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CameraView } from './components/CameraView';
import { ImageEditor } from './components/ImageEditor';
import { SettingsModal } from './components/SettingsModal';
import { analyzeFrame, VisionAnalysis, speak, parseAiError } from './services/visionService';
import { 
  Activity, 
  Box, 
  Info, 
  Layers, 
  Maximize2, 
  Mic2, 
  MicOff, 
  Scan, 
  Shield, 
  Terminal,
  Volume2,
  VolumeX,
  Camera,
  Wand2,
  Settings,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [mode, setMode] = useState<'vision' | 'editor'>('vision');
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const handleFrame = useCallback(async (base64: string) => {
    if (isAnalyzing || mode !== 'vision') return;
    
    setIsAnalyzing(true);
    setGlobalError(null);
    try {
      const result = await analyzeFrame(base64);
      setAnalysis(result);
      
      const timestamp = new Date().toLocaleTimeString();
      setHistory(prev => [`[${timestamp}] Detected: ${result.objects.join(', ')}`, ...prev].slice(0, 10));
      
      if (isVoiceEnabled) {
        const voiceText = `Detected ${result.count} items. ${result.activity}. ${result.insights}`;
        speak(voiceText);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      setGlobalError(parseAiError(error));
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isVoiceEnabled, mode]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-blue-500/30">
      {/* Top Navigation / Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tighter uppercase">VisionAI Assistant</h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">System v3.0.0 // {mode === 'vision' ? 'Live Vision' : 'Image Studio'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setMode('vision')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${mode === 'vision' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Camera className="w-3 h-3" />
              Vision
            </button>
            <button 
              onClick={() => setMode('editor')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${mode === 'editor' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Wand2 className="w-3 h-3" />
              Studio
            </button>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <button 
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-2 rounded-full transition-colors ${isVoiceEnabled ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-500 bg-zinc-800'}`}
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full text-zinc-500 bg-zinc-800 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4"
          >
            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md p-4 rounded-xl flex items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest leading-relaxed">
                  {globalError}
                </p>
              </div>
              <button onClick={() => setGlobalError(null)} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4 text-red-500/50" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {mode === 'vision' ? (
            <motion.div 
              key="vision"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Camera Feed */}
              <div className="lg:col-span-8 space-y-6">
                <CameraView 
                  onFrame={handleFrame} 
                  isAnalyzing={isAnalyzing} 
                  autoCaptureInterval={isAutoMode ? 15000 : null}
                />
                
                {/* Controls Bar */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsAutoMode(!isAutoMode)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all ${
                        isAutoMode 
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      <Activity className={`w-3 h-3 ${isAutoMode ? 'animate-pulse' : ''}`} />
                      {isAutoMode ? 'Auto-Scan ON' : 'Manual Mode'}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-zinc-500">
                    <Maximize2 className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                    <Layers className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                    <Scan className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Terminal / Log */}
                <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-zinc-900 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-zinc-500" />
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">System Log</span>
                    </div>
                  </div>
                  <div className="p-4 h-32 font-mono text-[10px] text-zinc-500 overflow-y-auto space-y-1">
                    {history.length === 0 ? (
                      <p className="animate-pulse">Waiting for system initialization...</p>
                    ) : (
                      history.map((log, i) => (
                        <p key={i} className={i === 0 ? 'text-blue-400' : ''}>{log}</p>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Analysis Results */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-8 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">Analysis Report</h2>
                      <Box className="w-4 h-4 text-blue-500" />
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {analysis ? (
                        <motion.div
                          key="results"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Objects Detected</label>
                            <div className="flex flex-wrap gap-2">
                              {analysis.objects.map((obj, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-mono text-blue-400 uppercase">
                                  {obj}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Person Activity</label>
                            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                              <Activity className="w-4 h-4 text-green-500" />
                              <p className="text-sm font-medium">{analysis.activity}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Environment</label>
                            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                              <Maximize2 className="w-4 h-4 text-purple-500" />
                              <p className="text-sm font-medium">{analysis.scene}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 text-center">
                              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">Count</p>
                              <p className="text-3xl font-bold text-white">{analysis.count}</p>
                            </div>
                            <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 text-center">
                              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">Status</p>
                              <p className="text-xs font-mono font-bold text-green-500 uppercase mt-2">Nominal</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                              <Info className="w-3 h-3" />
                              Additional Insights
                            </label>
                            <p className="text-xs text-zinc-400 leading-relaxed italic">
                              "{analysis.insights}"
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-20 text-center space-y-4"
                        >
                          <div className="w-12 h-12 border-2 border-dashed border-zinc-800 rounded-full mx-auto flex items-center justify-center">
                            <Scan className="w-6 h-6 text-zinc-800" />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Awaiting Input Data</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="mb-8 text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">AI Image Studio</h2>
                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em]">Generative Manipulation Engine</p>
              </div>
              <ImageEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 mt-12">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          © 2026 VisionAI Systems // Neural Engine v3.0
        </p>
      </footer>
    </div>
  );
}

