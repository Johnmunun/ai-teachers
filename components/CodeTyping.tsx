'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Copy, Check, Terminal, Sparkles } from 'lucide-react';

interface CodeTypingProps {
  code: string;
  language?: string;
  speed?: number; // ms per character
  onComplete?: () => void;
  showLineNumbers?: boolean;
  autoStart?: boolean;
  className?: string;
}

// Simple syntax highlighting
function highlightCode(code: string, language: string = 'javascript'): string {
  let highlighted = code
    // Strings
    .replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '<span class="text-emerald-400">$&</span>')
    // Comments
    .replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>')
    // Keywords
    .replace(/\b(const|let|var|function|async|await|return|if|else|for|while|class|import|export|from|default|new|this|try|catch|throw)\b/g, 
      '<span class="text-violet-400">$1</span>')
    // Functions
    .replace(/(\w+)(?=\()/g, '<span class="text-cyan-400">$1</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>')
    // Operators
    .replace(/([=+\-*/<>!&|?:]+)/g, '<span class="text-rose-400">$1</span>');
  
  return highlighted;
}

export default function CodeTyping({
  code,
  language = 'javascript',
  speed = 30,
  onComplete,
  showLineNumbers = true,
  autoStart = true,
  className = ''
}: CodeTypingProps) {
  const [displayedCode, setDisplayedCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoStart) {
      startTyping();
    }
  }, [code, autoStart]);

  const startTyping = () => {
    setDisplayedCode('');
    setIsTyping(true);
    setIsComplete(false);
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < code.length) {
        setDisplayedCode(code.slice(0, i + 1));
        i++;
        
        // Auto-scroll to bottom
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = displayedCode.split('\n');
  const totalLines = code.split('\n').length;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 ${className}`}>
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />
      
      {/* Scan Line Effect */}
      {isTyping && (
        <motion.div
          className="absolute left-0 right-0 h-8 bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent pointer-events-none z-10"
          animate={{ y: ['0%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/30">
        <div className="flex items-center gap-3">
          {/* Window Controls */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          {/* File Info */}
          <div className="flex items-center gap-2 text-xs">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400 font-mono">main.{language}</span>
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="flex items-center gap-1 text-cyan-400"
              >
                <Sparkles className="w-3 h-3" />
                typing...
              </motion.span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={copyCode}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Copy className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Replay Button */}
          {isComplete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={startTyping}
              className="p-2 rounded-lg hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition"
            >
              <Play className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Code Content */}
      <div 
        ref={containerRef}
        className="p-4 overflow-auto max-h-96 font-mono text-sm"
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="leading-relaxed">
                {showLineNumbers && (
                  <td className="pr-4 text-right text-slate-600 select-none w-8 align-top">
                    {i + 1}
                  </td>
                )}
                <td className="text-slate-300 whitespace-pre">
                  <span 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightCode(line, language) 
                    }} 
                  />
                  {/* Cursor at current line */}
                  {isTyping && i === lines.length - 1 && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-cyan-400 ml-0.5 align-middle"
                    />
                  )}
                </td>
              </tr>
            ))}
            {/* Placeholder lines for remaining code */}
            {isTyping && lines.length < totalLines && (
              Array.from({ length: Math.min(totalLines - lines.length, 3) }).map((_, i) => (
                <tr key={`placeholder-${i}`} className="opacity-20">
                  {showLineNumbers && (
                    <td className="pr-4 text-right text-slate-700 select-none w-8">
                      {lines.length + i + 1}
                    </td>
                  )}
                  <td className="text-slate-600">...</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Progress Bar */}
      {isTyping && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
            style={{ width: `${(displayedCode.length / code.length) * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Completion Badge */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs"
          >
            <Check className="w-3 h-3" />
            Code complet
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


