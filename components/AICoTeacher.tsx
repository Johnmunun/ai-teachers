import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Lightbulb, MessageCircle, HelpCircle, X } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { motion, AnimatePresence } from 'framer-motion';
import CodePreview from './CodePreview';
import { ConnectionState } from 'livekit-client';

const TypewriterText = ({ text }: { text: string }) => {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        let i = 0;
        setDisplayed('');
        const interval = setInterval(() => {
            setDisplayed(text.slice(0, i));
            i += 1;
            if (i > text.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return <p className="text-sm text-slate-300 mb-2 font-mono leading-relaxed">{displayed}<span className="animate-pulse border-r-2 border-cyan-500 ml-1"></span></p>;
};

export default function AICoTeacher() {
    const { aiSuggestions, setActiveQuiz, removeAiSuggestion } = useStore();
    let room: any;
    try {
        room = useRoomContext();
    } catch (e) { }

    const launchQuiz = async (quizData: any) => {
        setActiveQuiz(quizData);
        if (!room || !room.localParticipant) {
            console.warn("Non connecté à LiveKit");
            return;
        }

        // Vérifier que la connexion est établie
        if (room.state !== ConnectionState.Connected) {
            console.warn("La connexion LiveKit n'est pas encore établie. État:", room.state);
            return;
        }

        try {
            const payload = JSON.stringify({ type: 'QUIZ_START', quiz: quizData });
            const encoder = new TextEncoder();
            await room.localParticipant.publishData(encoder.encode(payload), { reliable: true });
        } catch (error) {
            console.error("Erreur lors de la publication du quiz:", error);
        }
    };

    // Auto-Broadcast new suggestions to students
    useEffect(() => {
        if (aiSuggestions.length > 0 && room && room.localParticipant) {
            // Vérifier que la connexion est établie
            if (room.state !== ConnectionState.Connected) {
                console.warn("La connexion LiveKit n'est pas encore établie. État:", room.state);
                return;
            }

            const latest = aiSuggestions[aiSuggestions.length - 1];
            // Only broadcast if it's new (simple usage: broadcast last item on change)
            const payload = JSON.stringify({
                type: 'SHOW_CODE',
                text: latest.content || "",
                code: latest.code || null
            });
            const encoder = new TextEncoder();
            
            room.localParticipant.publishData(encoder.encode(payload), { reliable: true }).catch((error: any) => {
                console.error("Erreur lors de la publication des suggestions:", error);
            });
        }
    }, [aiSuggestions.length, room]);

    if (aiSuggestions.length === 0) return null;

    return (
        <div className="fixed right-2 sm:right-4 top-16 sm:top-20 w-[calc(100%-1rem)] sm:w-80 lg:w-96 max-w-sm lg:max-w-none z-50 pointer-events-none">
            {/* Make children pointer-events-auto */}
            <div className="pointer-events-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-900 to-slate-900 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)] rounded-t-lg px-4 py-2 flex items-center justify-between backdrop-blur-md relative"
                >
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                        <h3 className="text-cyan-400 font-bold text-sm tracking-wide">AI CO-TEACHER <span className="text-xs opacity-60 font-mono">::ACTIVE::</span></h3>
                    </div>
                </motion.div>

                <div className="bg-slate-900/90 border-x border-b border-cyan-500/30 rounded-b-lg p-4 max-h-[70vh] overflow-y-auto space-y-6 backdrop-blur-xl">
                    <AnimatePresence mode="popLayout">
                        {aiSuggestions.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="bg-slate-800/80 p-4 rounded-xl border border-white/10 shadow-lg relative group overflow-hidden"
                            >
                                {/* Scanning beam effect */}
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/50"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ duration: 1.5, ease: "linear" }}
                                />

                                <button
                                    onClick={() => removeAiSuggestion(idx)}
                                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-2 mb-3">
                                    {item.type === 'explanation' && <MessageCircle className="w-4 h-4 text-blue-400" />}
                                    {item.type === 'quiz' && <HelpCircle className="w-4 h-4 text-orange-400" />}
                                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{item.type}</span>
                                </div>

                                {/* Content (Typewriter) */}
                                <div className="mb-4">
                                    <TypewriterText text={item.content || "Analyse en cours..."} />
                                </div>

                                {/* Code Preview (if any) */}
                                {item.code && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: '16rem' }}
                                        transition={{ delay: 0.5 }}
                                        className="rounded-lg overflow-hidden border border-slate-700 mb-2 relative h-64"
                                    >
                                        <CodePreview html={item.code.html} css={item.code.css} js={item.code.js} />
                                    </motion.div>
                                )}

                                {item.type === 'quiz' && item.quizData && (
                                    <button
                                        onClick={() => launchQuiz(item.quizData)}
                                        className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium py-2 rounded-lg transition shadow-md hover:shadow-cyan-500/20 uppercase tracking-wide"
                                    >
                                        Lancer ce Quiz
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
