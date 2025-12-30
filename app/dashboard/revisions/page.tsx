'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Brain,
  Lightbulb,
  BookOpen,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Volume2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: 'explanation' | 'quiz' | 'example';
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: string;
  };
  code?: {
    html?: string;
    css?: string;
    js?: string;
  };
}

const suggestedTopics = [
  "Les boucles en JavaScript",
  "Les fonctions async/await",
  "Les tableaux et leurs méthodes",
  "Les objets et les classes",
  "Le DOM et les événements",
  "Les promesses en JS"
];

export default function RevisionsPage() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: lessonId 
          ? "Bonjour ! Je suis Nathalie, votre assistante pédagogique. 👋\n\nJe vois que vous souhaitez réviser une séance spécifique. Dites-moi quel concept vous aimeriez revoir, et je vous aiderai avec des explications simples, des exemples et des quiz !"
          : "Bonjour ! Je suis Nathalie, votre assistante pédagogique. 👋\n\nJe suis là pour vous aider à réviser vos cours de programmation. Choisissez un sujet ci-dessous ou posez-moi directement votre question !",
        type: 'explanation'
      }]);
    }
  }, [lessonId]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText,
          context: 'revision',
          lessonId 
        })
      });
      
      const data = await res.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text || "Je n'ai pas compris votre question. Pouvez-vous reformuler ?",
        type: data.type || 'explanation',
        quiz: data.quizData,
        code: data.code
      };

      setMessages(prev => [...prev, aiMessage]);
      setQuizSubmitted(false);
      setSelectedQuizAnswer(null);

      // Auto-play audio if available
      if (data.audio) {
        playAudio(data.audio);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "Désolé, une erreur s'est produite. Réessayez dans un moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSubmit = (quiz: Message['quiz']) => {
    if (!selectedQuizAnswer || !quiz) return;
    setQuizSubmitted(true);
  };

  const requestQuiz = () => {
    sendMessage("Donne-moi un quiz sur ce qu'on vient de voir");
  };

  const playAudio = (base64: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = `data:audio/mp3;base64,${base64}`;
    audioRef.current.play().catch(e => {
      console.error("Erreur lecture audio:", e);
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#030712]">
      {/* Header */}
      <header className="flex-shrink-0 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0f1a]" />
              </div>
              <div>
                <h1 className="font-semibold text-white">Nathalie</h1>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Prête à vous aider
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={requestQuiz}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Quiz rapide</span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.role === 'user' ? '' : 'w-full max-w-2xl'}`}>
                  {message.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-slate-500">Nathalie</span>
                      {message.type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          message.type === 'quiz' 
                            ? 'bg-amber-500/20 text-amber-400'
                            : message.type === 'example'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-violet-500/20 text-violet-400'
                        }`}>
                          {message.type === 'quiz' ? 'Quiz' : 
                           message.type === 'example' ? 'Exemple' : 'Explication'}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className={`rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
                      : 'glass border border-white/10'
                  }`}>
                    <p className={`whitespace-pre-wrap ${
                      message.role === 'ai' ? 'text-slate-300' : 'text-white'
                    }`}>
                      {message.content}
                    </p>

                    {/* Code Preview */}
                    {message.code && (
                      <div className="mt-4 code-block p-4 rounded-lg text-sm overflow-x-auto">
                        {message.code.html && (
                          <div className="mb-2">
                            <span className="text-xs text-slate-500">HTML</span>
                            <pre className="text-slate-300">{message.code.html}</pre>
                          </div>
                        )}
                        {message.code.js && (
                          <div>
                            <span className="text-xs text-slate-500">JavaScript</span>
                            <pre className="text-slate-300">{message.code.js}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quiz */}
                    {message.quiz && (
                      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-amber-500/20">
                        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          {message.quiz.question}
                        </h4>
                        <div className="space-y-2 mb-4">
                          {message.quiz.options.map((option, i) => (
                            <button
                              key={i}
                              onClick={() => !quizSubmitted && setSelectedQuizAnswer(option)}
                              disabled={quizSubmitted}
                              className={`w-full p-3 rounded-lg text-left transition-all ${
                                quizSubmitted
                                  ? option === message.quiz!.correctAnswer
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                    : selectedQuizAnswer === option
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'bg-white/5 border-white/10 text-slate-400'
                                  : selectedQuizAnswer === option
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                              } border`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {quizSubmitted && option === message.quiz!.correctAnswer && (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                )}
                                {quizSubmitted && selectedQuizAnswer === option && option !== message.quiz!.correctAnswer && (
                                  <XCircle className="w-5 h-5 text-red-400" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        {!quizSubmitted ? (
                          <button
                            onClick={() => handleQuizSubmit(message.quiz)}
                            disabled={!selectedQuizAnswer}
                            className="w-full py-3 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Valider ma réponse
                          </button>
                        ) : (
                          <div className={`p-3 rounded-lg flex items-center gap-2 ${
                            selectedQuizAnswer === message.quiz.correctAnswer
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedQuizAnswer === message.quiz.correctAnswer ? (
                              <><CheckCircle2 className="w-5 h-5" /> Bravo ! C'est la bonne réponse !</>
                            ) : (
                              <><XCircle className="w-5 h-5" /> La bonne réponse était : {message.quiz.correctAnswer}</>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
                <RefreshCw className="w-3 h-3 text-white animate-spin" />
              </div>
              <span className="text-slate-400 text-sm">Nathalie réfléchit...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Topics (only show at start) */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 px-6 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-slate-500 mb-3">Suggestions de sujets :</p>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => sendMessage(`Explique-moi ${topic}`)}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 hover:border-cyan-500/30 transition"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 glass border-t border-white/5 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Posez votre question à Nathalie..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


