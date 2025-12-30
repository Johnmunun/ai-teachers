'use client';
import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CodePreviewProps {
    html: string;
    css?: string;
    js?: string;
}

export default function CodePreview({ html, css, js }: CodePreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [key, setKey] = useState(0); // To force reload

    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <script src="https://cdn.tailwindcss.com"></script>
              <style>${css || ''}</style>
            </head>
            <body class="bg-white p-4">
              ${html}
              <script>${js || ''}</script>
            </body>
          </html>
        `);
                doc.close();
            }
        }
    }, [html, css, js, key]);

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-500/30">
            <div className="bg-slate-900/95 backdrop-blur px-4 py-2 flex justify-between items-center border-b border-indigo-500/30">
                <span className="text-xs font-mono text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    LIVE PREVIEW :: NATHALIE_OS v1.0
                </span>
                <button onClick={() => setKey(k => k + 1)} className="text-indigo-400 hover:text-cyan-300 transition-colors">
                    <RefreshCw className="w-3 h-3" />
                </button>
            </div>
            <div className="flex-1 bg-white relative">
                <iframe
                    ref={iframeRef}
                    key={key}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin"
                    title="Code Preview"
                />
            </div>
        </div>
    );
}
