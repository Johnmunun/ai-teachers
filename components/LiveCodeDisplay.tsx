'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Play, Eye, Sparkles, Maximize2, X } from 'lucide-react';
import CodeTyping from './CodeTyping';
import CodePreview from './CodePreview';

interface LiveCodeDisplayProps {
  html?: string;
  css?: string;
  js?: string;
  explanation?: string;
  title?: string;
  autoPlay?: boolean;
}

type Tab = 'html' | 'css' | 'js' | 'preview';

export default function LiveCodeDisplay({
  html = '',
  css = '',
  js = '',
  explanation,
  title = 'Code Live',
  autoPlay = true
}: LiveCodeDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typingComplete, setTypingComplete] = useState({
    html: false,
    css: false,
    js: false
  });

  const allTabs: Array<{ id: Tab; label: string; icon: any; code: string }> = [
    { id: 'html', label: 'HTML', icon: Code2, code: html },
    { id: 'css', label: 'CSS', icon: Code2, code: css },
    { id: 'js', label: 'JavaScript', icon: Code2, code: js },
  ];
  const tabs = allTabs.filter(tab => tab.code);

  // Auto-switch to preview when all typing is complete
  useEffect(() => {
    const allComplete = tabs.every(tab => typingComplete[tab.id as keyof typeof typingComplete] || !tab.code);
    if (allComplete && tabs.length > 0) {
      setTimeout(() => setShowPreview(true), 500);
    }
  }, [typingComplete]);

  const handleTypingComplete = (tab: Tab) => {
    setTypingComplete(prev => ({ ...prev, [tab]: true }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      }`}
    >
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="font-medium text-white">{title}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-mono">
              LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-6 py-4 border-b border-white/5 bg-violet-500/5"
        >
          <p className="text-slate-300 text-sm leading-relaxed">{explanation}</p>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setShowPreview(false);
            }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
              activeTab === tab.id && !showPreview
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {typingComplete[tab.id as keyof typeof typingComplete] && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
            {activeTab === tab.id && !showPreview && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
              />
            )}
          </button>
        ))}
        
        {/* Preview Tab */}
        <button
          onClick={() => setShowPreview(true)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all ml-auto ${
            showPreview
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Eye className="w-4 h-4" />
          Aperçu
          {showPreview && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
            />
          )}
        </button>
      </div>

      {/* Content */}
      <div className={`${isFullscreen ? 'h-[calc(100%-180px)]' : 'h-96'}`}>
        <AnimatePresence mode="wait">
          {showPreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <CodePreview html={html} css={css} js={js} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-auto"
            >
              {tabs.find(t => t.id === activeTab)?.code && (
                <CodeTyping
                  code={tabs.find(t => t.id === activeTab)!.code}
                  language={activeTab === 'js' ? 'javascript' : activeTab}
                  speed={activeTab === activeTab && autoPlay ? 20 : 0}
                  autoStart={autoPlay}
                  onComplete={() => handleTypingComplete(activeTab)}
                  className="h-full rounded-none border-0"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{tabs.length} fichiers</span>
          <span>•</span>
          <span>
            {(html.length + css.length + js.length).toLocaleString()} caractères
          </span>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
        >
          <Play className="w-4 h-4" />
          Exécuter
        </motion.button>
      </div>

      {/* Fullscreen Overlay Background */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 -z-10"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </motion.div>
  );
}


