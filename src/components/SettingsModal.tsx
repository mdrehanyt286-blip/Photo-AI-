import React, { useState, useEffect } from 'react';
import { X, Key, Shield, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateApiKey, verifyKey } from '../services/visionService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY') || '';
    setApiKey(savedKey);
    setTestResult(null);
  }, [isOpen]);

  const handleSave = () => {
    updateApiKey(apiKey);
    onClose();
  };

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    
    // Temporarily save to test
    const oldKey = localStorage.getItem('GEMINI_API_KEY');
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    
    const result = await verifyKey();
    
    if (result.success) {
      setTestResult({ success: true, message: "Bhai, key ekdum mast kaam kar rahi hai!" });
    } else {
      setTestResult({ success: false, message: result.error || "Key fail ho gayi." });
      // Restore old key if test failed
      if (oldKey) localStorage.setItem('GEMINI_API_KEY', oldKey);
      else localStorage.removeItem('GEMINI_API_KEY');
    }
    setIsTesting(false);
  };

  const handleReset = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <h2 className="text-xs font-mono uppercase tracking-widest font-bold">System Configuration</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Key className="w-3 h-3" />
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="Enter your API key here..."
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-colors pr-10"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[9px] text-zinc-600 font-mono leading-relaxed">
                  Bhai, agar environment variable kaam nahi kar raha, toh yahan apni key daal de. Ye tere browser (localStorage) mein save hogi. 
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                    Get your free key here.
                  </a>
                </p>
              </div>

              {testResult && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl border flex items-center gap-3 ${
                    testResult.success ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-red-500/5 border-red-500/20 text-red-500'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <p className="text-[10px] font-mono uppercase tracking-tight leading-relaxed">
                    {testResult.message}
                  </p>
                </motion.div>
              )}

              <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                <p className="text-[9px] text-yellow-500/80 font-mono leading-relaxed uppercase tracking-tight">
                  Warning: Saving a new key will reload the application to apply changes.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <button
                    onClick={handleTest}
                    disabled={isTesting || !apiKey.trim()}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-mono text-[10px] uppercase tracking-widest font-bold transition-all border border-white/5 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ActivityIcon className="w-3 h-3" />}
                    Test Key
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-3 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all border border-white/5"
                  >
                    Reset
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isTesting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-mono text-[10px] uppercase tracking-widest font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  Save & Reload
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
