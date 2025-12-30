'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Bot, X, Sparkles } from 'lucide-react';

interface StudentAIAssistantProps {
    lessonId?: string | null;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function StudentAIAssistant({ lessonId }: StudentAIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    context: 'student_assistance',
                    lessonId,
                }),
            });

            const data = await res.json();
            
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.text || 'Désolé, je n\'ai pas pu générer de réponse.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Erreur interaction IA:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Erreur lors de la communication avec l\'assistant IA. Veuillez réessayer.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center z-40"
                >
                    <MessageCircle className="w-7 h-7 text-white" />
                </motion.button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border border-purple-500/50 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-white" />
                                <h3 className="text-white font-bold">Assistant IA</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 py-8">
                                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                                    <p className="text-sm">Posez-moi une question sur le cours !</p>
                                    <p className="text-xs mt-2 text-slate-500">
                                        Je peux expliquer, reformuler, donner des exemples...
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${
                                            msg.role === 'user'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-800 text-slate-200 border border-slate-700'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <p className="text-xs mt-1 opacity-60">
                                            {msg.timestamp.toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-slate-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Posez une question..."
                                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isLoading}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

