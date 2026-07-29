import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Key, ExternalLink, ShieldCheck, Trash2, Eye, EyeOff, 
  CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles
} from 'lucide-react';
import { 
  getStoredGeminiKey, 
  getStoredOpenRouterKey, 
  setGeminiKey, 
  setOpenRouterKey, 
  removeGeminiKey, 
  removeOpenRouterKey,
  hasCustomGeminiKey,
  hasCustomOpenRouterKey,
  API_KEY_URLS 
} from '../services/apiKeyService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated
}) => {
  const [geminiInput, setGeminiInput] = useState<string>('');
  const [openRouterInput, setOpenRouterInput] = useState<string>('');
  const [showGemini, setShowGemini] = useState<boolean>(false);
  const [showOpenRouter, setShowOpenRouter] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGeminiInput(getStoredGeminiKey());
      setOpenRouterInput(getStoredOpenRouterKey());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveGemini = () => {
    setGeminiKey(geminiInput);
    setStatusMessage({
      text: geminiInput.trim() ? 'Google Gemini API Key securely saved in browser storage.' : 'Gemini custom key cleared. Using default environment configuration.',
      type: 'success'
    });
    if (onKeysUpdated) onKeysUpdated();
  };

  const handleSaveOpenRouter = () => {
    setOpenRouterKey(openRouterInput);
    setStatusMessage({
      text: openRouterInput.trim() ? 'OpenRouter API Key securely saved in browser storage.' : 'OpenRouter custom key cleared. Using default environment configuration.',
      type: 'success'
    });
    if (onKeysUpdated) onKeysUpdated();
  };

  const handleClearGemini = () => {
    removeGeminiKey();
    setGeminiInput('');
    setStatusMessage({
      text: 'Custom Gemini API Key removed. Reverted to default system configuration.',
      type: 'info'
    });
    if (onKeysUpdated) onKeysUpdated();
  };

  const handleClearOpenRouter = () => {
    removeOpenRouterKey();
    setOpenRouterInput('');
    setStatusMessage({
      text: 'Custom OpenRouter API Key removed. Reverted to default system configuration.',
      type: 'info'
    });
    if (onKeysUpdated) onKeysUpdated();
  };

  const isGeminiCustom = hasCustomGeminiKey();
  const isOpenRouterCustom = hasCustomOpenRouterKey();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Bring Your Own API Keys (BYOK)
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    Client-Side Encryption
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Provide custom Gemini or OpenRouter API keys stored exclusively in your browser.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Message Toast */}
          {statusMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-5 py-2.5 border-b font-mono text-xs flex items-center gap-2 ${
                statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                statusMessage.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
                'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </motion.div>
          )}

          {/* Body Content */}
          <div className="p-6 space-y-6 overflow-y-auto bg-zinc-900/50">
            
            {/* Security Guarantee Notice */}
            <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-400 flex items-start gap-3">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-zinc-200 font-bold block mb-0.5">Privacy & Browser Security Guarantee</span>
                Your API keys are stored locally in your browser's <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded">localStorage</code>. They are transmitted directly to official provider endpoints (Google / OpenRouter) and are never logged or stored on external servers.
              </div>
            </div>

            {/* 1. Google Gemini API Key Section */}
            <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <h3 className="text-sm font-bold text-white">Google Gemini API Key</h3>
                  {isGeminiCustom ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                      Custom Key Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded">
                      System Default Active
                    </span>
                  )}
                </div>

                {/* Direct Link to Get Key */}
                <a 
                  href={API_KEY_URLS.GEMINI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-4 hover:no-underline transition-colors"
                >
                  Get Gemini API Key
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input 
                    type={showGemini ? 'text' : 'password'}
                    value={geminiInput}
                    onChange={(e) => setGeminiInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 pr-10 text-xs font-mono text-emerald-200 outline-none transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowGemini(!showGemini)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Used for Gemini 3.6 Flash, thinking models, and Google Search Grounding pipelines.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {isGeminiCustom && (
                  <button 
                    onClick={handleClearGemini}
                    className="px-3 py-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Key
                  </button>
                )}
                <button 
                  onClick={handleSaveGemini}
                  className="px-4 py-1.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Gemini Key
                </button>
              </div>
            </div>

            {/* 2. OpenRouter API Key Section */}
            <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <h3 className="text-sm font-bold text-white">OpenRouter API Key</h3>
                  {isOpenRouterCustom ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                      Custom Key Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded">
                      System Default Active
                    </span>
                  )}
                </div>

                {/* Direct Link to Get Key */}
                <a 
                  href={API_KEY_URLS.OPENROUTER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-400 hover:text-purple-300 underline underline-offset-4 hover:no-underline transition-colors"
                >
                  Get OpenRouter API Key
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input 
                    type={showOpenRouter ? 'text' : 'password'}
                    value={openRouterInput}
                    onChange={(e) => setOpenRouterInput(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-purple-500 rounded-lg px-3.5 py-2.5 pr-10 text-xs font-mono text-purple-200 outline-none transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowOpenRouter(!showOpenRouter)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showOpenRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Used for DeepSeek R1, Claude 3.7 Sonnet, GPT-4o, Llama 3.3, and multi-vendor models.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {isOpenRouterCustom && (
                  <button 
                    onClick={handleClearOpenRouter}
                    className="px-3 py-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Key
                  </button>
                )}
                <button 
                  onClick={handleSaveOpenRouter}
                  className="px-4 py-1.5 text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save OpenRouter Key
                </button>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Local Key Vault Active
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
            >
              Done / Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
